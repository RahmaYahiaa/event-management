const mongoose = require('mongoose');
const Event = require('../models/Event');
const Reservation = require('../models/reversation');


const createReservation = async (req, res) => {
const { eventId, ticketQuantity } = req.body;

  //  Validate ticket quantity
    if (!ticketQuantity || ticketQuantity <= 0) {
    return res.status(400).json({
      success: false,
      msg: 'Ticket quantity must be greater than 0'
    });
}

  //  Find event
const foundEvent = await Event.findById(eventId);

if (!foundEvent) {
    return res.status(404).json({
    success: false,
    msg: 'Event not found'
    });
}

  //  Check event status
if (foundEvent.status !== 'upcoming') {
    return res.status(400).json({
    success: false,
    msg: `Cannot reserve this event because it is ${foundEvent.status}`
    });
}

  //  Check available seats
if (foundEvent.availableSeats < ticketQuantity) {
    return res.status(400).json({
    success: false,
    msg: 'Not enough available seats'
    });
}

  //  Prevent duplicate active reservation
  const existingReservation = await Reservation.findOne({
    user: req.user._id,
    event: eventId,
    status: 'active'
  });

if (existingReservation) {
    return res.status(400).json({
    success: false,
    msg: 'You already have an active reservation for this event'
    });
}


const session = await mongoose.startSession();

try {
    session.startTransaction();

    // 7. Create reservation
    const reservation = await Reservation.create(
      [
        {
          user: req.user._id,
          event: eventId,
          ticketQuantity,
          status: 'active'
        }
      ],
      { session }
    );

    // 8. Update available seats
    foundEvent.availableSeats -= ticketQuantity;

    await foundEvent.save({ session });

    // 9. Commit transaction
    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      msg: 'Reservation created successfully',
      reservation: reservation[0]
    });

  } catch (error) {
    await session.abortTransaction();

    return res.status(500).json({
      success: false,
      msg: error.message
    });

  } finally {
    await session.endSession();
  }
};



// Cancel Reservation
const cancelReservation = async (req, res) => {
  const { reservationId } = req.params;

  // 1. Find reservation
  const reservation = await Reservation.findById(reservationId);

  if (!reservation) {
    return res.status(404).json({
      success: false,
      msg: 'Reservation not found'
    });
  }

  // 2. Check reservation belongs to current user
  if (reservation.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      msg: 'You are not allowed to cancel this reservation'
    });
  }

  // 3. Check reservation status
  if (reservation.status !== 'active') {
    return res.status(400).json({
      success: false,
      msg: 'Only active reservations can be cancelled'
    });
  }

  // 4. Find event
  const event = await Event.findById(reservation.event);

  if (!event) {
    return res.status(404).json({
      success: false,
      msg: 'Event not found'
    });
  }

  // 5. Start transaction
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 6. Change reservation status
    reservation.status = 'cancelled';

    await reservation.save({ session });

    // 7. Return seats to event
    event.availableSeats += reservation.ticketQuantity;

    // prevent availableSeats from exceeding capacity
    if (event.availableSeats > event.capacity) {
      event.availableSeats = event.capacity;
    }

    await event.save({ session });

    // 8. Commit
    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      msg: 'Reservation cancelled successfully',
      reservation
    });

  } catch (error) {
    await session.abortTransaction();

    return res.status(500).json({
      success: false,
      msg: error.message
    });

  } finally {
    await session.endSession();
  }
};

module.exports = {
  createReservation,
  cancelReservation
};
