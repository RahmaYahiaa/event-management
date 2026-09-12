const mongoose = require('mongoose');
const Event = require('../models/Event');
const Reservation = require('../models/Reservation');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

const reserveTickets = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { ticketQuantity } = req.body;

    if (!isValidId(eventId)) {
      return res.status(400).json({ success: false, msg: 'Invalid event id' });
    }

    const qty = Number(ticketQuantity);
    if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        msg: 'Ticket quantity must be a positive integer',
      });
    }

    const foundEvent = await Event.findById(eventId);
    if (!foundEvent) {
      return res.status(404).json({ success: false, msg: 'Event not found' });
    }

    if (foundEvent.status === 'cancelled') {
      return res.status(400).json({ success: false, msg: 'Cannot reserve a cancelled event' });
    }

    if (foundEvent.status === 'completed') {
      return res.status(400).json({ success: false, msg: 'Cannot reserve a completed event' });
    }

    if (foundEvent.availableSeats < qty) {
      return res.status(400).json({ success: false, msg: 'Not enough available seats' });
    }

    // Prevent duplicate active reservation by the same attendee
    const existingReservation = await Reservation.findOne({
      user: req.user._id,
      event: eventId,
      status: 'active',
    });

    if (existingReservation) {
      return res.status(400).json({
        success: false,
        msg: 'You already have an active reservation for this event',
      });
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const reservation = await Reservation.create(
        [
          {
            user: req.user._id,
            event: eventId,
            ticketQuantity: qty,
            status: 'active',
          },
        ],
        { session }
      );

      foundEvent.availableSeats -= qty;
      await foundEvent.save({ session });

      await session.commitTransaction();

      return res.status(201).json({
        success: true,
        msg: 'Reservation created successfully',
        data: reservation[0],
      });
    } catch (error) {
      await session.abortTransaction();

      if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, msg: error.message });
      }

      return res.status(500).json({
        success: false,
        msg: 'Failed to create reservation',
        error: error.message,
      });
    } finally {
      session.endSession();
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: 'Failed to create reservation',
      error: error.message,
    });
  }
};

const getMyReservations = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user._id };

    if (status !== undefined) {
      if (!['active', 'cancelled'].includes(status)) {
        return res.status(400).json({ success: false, msg: 'Invalid status filter' });
      }
      filter.status = status;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const [reservations, total] = await Promise.all([
      Reservation.find(filter)
        .populate('event', 'title date location status')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Reservation.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: reservations.length,
      total,
      page: pageNum,
      pages: Math.max(Math.ceil(total / limitNum), 1),
      data: reservations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: 'Failed to fetch reservations',
      error: error.message,
    });
  }
};

const getReservation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, msg: 'Invalid reservation id' });
    }

    const reservation = await Reservation.findById(id).populate(
      'event',
      'title date location status organizer'
    );

    if (!reservation) {
      return res.status(404).json({ success: false, msg: 'Reservation not found' });
    }

    const isOwner = reservation.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        msg: 'You are not allowed to view this reservation',
      });
    }

    return res.status(200).json({ success: true, data: reservation });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: 'Failed to fetch reservation',
      error: error.message,
    });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, msg: 'Invalid reservation id' });
    }

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({ success: false, msg: 'Reservation not found' });
    }

    if (reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        msg: 'You are not allowed to cancel this reservation',
      });
    }

    if (reservation.status !== 'active') {
      return res.status(400).json({
        success: false,
        msg: 'Only active reservations can be cancelled',
      });
    }

    const event = await Event.findById(reservation.event);

    if (!event) {
      return res.status(404).json({ success: false, msg: 'Event not found' });
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      reservation.status = 'cancelled';
      await reservation.save({ session });

      event.availableSeats += reservation.ticketQuantity;
      if (event.availableSeats > event.capacity) {
        event.availableSeats = event.capacity;
      }
      await event.save({ session });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        msg: 'Reservation cancelled successfully',
        data: reservation,
      });
    } catch (error) {
      await session.abortTransaction();

      return res.status(500).json({
        success: false,
        msg: 'Failed to cancel reservation',
        error: error.message,
      });
    } finally {
      session.endSession();
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: 'Failed to cancel reservation',
      error: error.message,
    });
  }
};

const getEventAttendees = async (req, res) => {
  try {
    const { id: eventId } = req.params;

    if (!isValidId(eventId)) {
      return res.status(400).json({ success: false, msg: 'Invalid event id' });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, msg: 'Event not found' });
    }

    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        msg: 'You are not allowed to view attendees of this event',
      });
    }

    const { status = 'active', page = 1, limit = 20 } = req.query;
    const filter = { event: eventId };

    if (status !== 'all') {
      if (!['active', 'cancelled'].includes(status)) {
        return res.status(400).json({ success: false, msg: 'Invalid status filter' });
      }
      filter.status = status;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [reservations, total] = await Promise.all([
      Reservation.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Reservation.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: reservations.length,
      total,
      page: pageNum,
      pages: Math.max(Math.ceil(total / limitNum), 1),
      data: reservations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: 'Failed to fetch attendees',
      error: error.message,
    });
  }
};

module.exports = {
  reserveTickets,
  getMyReservations,
  getReservation,
  cancelReservation,
  getEventAttendees,
};