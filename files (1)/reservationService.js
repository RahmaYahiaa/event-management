const mongoose = require('mongoose');
const Event = require('./models/Event');
const Reservation = require('./models/Reservation');
const {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ConflictError,
} = require('./errors');

const CANCELLATION_WINDOW_HOURS = 24;



function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function findEventById(eventId) {
  if (!isValidObjectId(eventId)) {
    throw new ValidationError(`"${eventId}" is not a valid event id.`);
  }
  const event = await Event.findById(eventId);
  if (!event) {
    throw new NotFoundError(`Event with id "${eventId}" was not found.`);
  }
  return event;
}

async function findReservationById(reservationId) {
  if (!isValidObjectId(reservationId)) {
    throw new ValidationError(`"${reservationId}" is not a valid reservation id.`);
  }
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    throw new NotFoundError(`Reservation with id "${reservationId}" was not found.`);
  }
  return reservation;
}


async function validateReservationOwnership(reservationId, userId) {
  if (!userId) {
    throw new ValidationError('userId is required to validate ownership.');
  }
  const reservation = await findReservationById(reservationId);
  if (reservation.userId !== userId) {
    throw new UnauthorizedError(
      `User "${userId}" is not allowed to access reservation "${reservationId}".`
    );
  }
  return reservation;
}


function assertCancellable(reservation, event) {
  if (reservation.status === 'cancelled') {
    throw new ConflictError(`Reservation "${reservation.id}" is already cancelled.`);
  }

  const now = new Date();
  const msUntilEvent = event.date.getTime() - now.getTime();
  const hoursUntilEvent = msUntilEvent / (1000 * 60 * 60);

  if (msUntilEvent <= 0) {
    throw new ConflictError('Cannot cancel a reservation for an event that already happened.');
  }

  if (hoursUntilEvent < CANCELLATION_WINDOW_HOURS) {
    throw new ConflictError(
      `Cancellation window has passed. Reservations must be cancelled at least ` +
        `${CANCELLATION_WINDOW_HOURS}h before the event starts ` +
        `(only ${hoursUntilEvent.toFixed(1)}h left).`
    );
  }
}



async function viewUserReservations(userId) {
  if (!userId) {
    throw new ValidationError('userId is required.');
  }

  const reservations = await Reservation.find({ userId })
    .sort({ createdAt: -1 })
    .populate('eventId', 'name date'); 

  return reservations.map((r) => ({
    reservationId: r.id,
    status: r.status,
    seatsBooked: r.seatsBooked,
    eventId: r.eventId?.id,
    eventName: r.eventId ? r.eventId.name : '(event deleted)',
    eventDate: r.eventId ? r.eventId.date : null,
  }));
}

async function viewReservationDetails(reservationId, userId = null) {
  const reservation = userId
    ? await validateReservationOwnership(reservationId, userId)
    : await findReservationById(reservationId);

  const event = await findEventById(reservation.eventId);

  return {
    reservationId: reservation.id,
    userId: reservation.userId,
    status: reservation.status,
    seatsBooked: reservation.seatsBooked,
    createdAt: reservation.createdAt,
    event: {
      id: event.id,
      name: event.name,
      date: event.date,
      availableSeats: event.availableSeats,
      totalSeats: event.totalSeats,
    },
  };
}


async function cancelReservation(reservationId, userId) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const reservation = await Reservation.findById(reservationId).session(session);
      if (!reservation) {
        throw new NotFoundError(`Reservation with id "${reservationId}" was not found.`);
      }
      if (reservation.userId !== userId) {
        throw new UnauthorizedError(
          `User "${userId}" is not allowed to access reservation "${reservationId}".`
        );
      }

      const event = await Event.findById(reservation.eventId).session(session);
      if (!event) {
        throw new NotFoundError(`Event with id "${reservation.eventId}" was not found.`);
      }

      assertCancellable(reservation, event);

      reservation.status = 'cancelled';
      event.availableSeats = Math.min(
        event.totalSeats,
        event.availableSeats + reservation.seatsBooked
      );

      await reservation.save({ session });
      await event.save({ session });

      result = {
        reservationId: reservation.id,
        status: reservation.status,
        seatsRestored: reservation.seatsBooked,
        eventAvailableSeats: event.availableSeats,
      };
    });
    return result;
  } finally {
    session.endSession();
  }
}

async function viewEventAttendees(eventId) {
  await findEventById(eventId); 

  const attendees = await Reservation.find({ eventId, status: 'active' });

  return attendees.map((r) => ({
    userId: r.userId,
    reservationId: r.id,
    seatsBooked: r.seatsBooked,
  }));
}

module.exports = {
  viewUserReservations,
  viewReservationDetails,
  cancelReservation,
  viewEventAttendees,
  validateReservationOwnership,
  CANCELLATION_WINDOW_HOURS,
};
