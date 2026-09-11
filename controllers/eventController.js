const mongoose = require('mongoose');
const Event = require('../models/Event');

const ALLOWED_STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'];

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parseAndValidateDate(rawDate) {
  const parsedDate = new Date(rawDate);
  if (isNaN(parsedDate.getTime())) {
    return { error: 'Invalid event date' };
  }
  if (parsedDate.getTime() <= Date.now()) {
    return { error: 'Event date must be in the future' };
  }
  return { value: parsedDate };
}

function parseAndValidateCapacity(rawCapacity) {
  const parsedCapacity = Number(rawCapacity);
  if (!Number.isFinite(parsedCapacity) || !Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
    return { error: 'Capacity must be a positive integer' };
  }
  return { value: parsedCapacity };
}

// POST /api/events (organizer only)
async function createEvent(req, res) {
  try {
    const { title, description, location, date, capacity } = req.body;

    if (!title || !description || !location || !date || capacity === undefined || capacity === null || capacity === '') {
      return res.status(400).json({
        success: false,
        message: 'Title, description, location, date and capacity are required',
      });
    }

    const capacityResult = parseAndValidateCapacity(capacity);
    if (capacityResult.error) {
      return res.status(400).json({ success: false, message: capacityResult.error });
    }

    const dateResult = parseAndValidateDate(date);
    if (dateResult.error) {
      return res.status(400).json({ success: false, message: dateResult.error });
    }

    const event = await Event.create({
      title,
      description,
      location,
      date: dateResult.value,
      capacity: capacityResult.value,
      availableSeats: capacityResult.value,
      organizer: req.user._id,
      status: 'upcoming',
    });

    return res.status(201).json({ success: true, data: event });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to create event', error: err.message });
  }
}

// GET /api/events (any authenticated user) - list + basic filters/pagination
async function getEvents(req, res) {
  try {
    const { status, organizer, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status filter. Allowed: ${ALLOWED_STATUSES.join(', ')}`,
        });
      }
      filter.status = status;
    }

    if (organizer !== undefined) {
      if (!isValidId(organizer)) {
        return res.status(400).json({ success: false, message: 'Invalid organizer id' });
      }
      filter.organizer = organizer;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('organizer', 'name email')
        .sort({ date: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Event.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: events.length,
      total,
      page: pageNum,
      pages: Math.max(Math.ceil(total / limitNum), 1),
      data: events,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch events', error: err.message });
  }
}

// GET /api/events/:id (any authenticated user)
async function getEvent(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event id' });
    }

    const event = await Event.findById(id).populate('organizer', 'name email');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    return res.status(200).json({ success: true, data: event });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch event', error: err.message });
  }
}

// PATCH /api/events/:id (owning organizer only)
async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event id' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to modify another organizer's event",
      });
    }

    const { title, description, location, date, capacity, status } = req.body;

    const isOnlyCancelling =
      status === 'cancelled' &&
      title === undefined &&
      description === undefined &&
      location === undefined &&
      date === undefined &&
      capacity === undefined;

    if (['completed', 'cancelled'].includes(event.status) && !isOnlyCancelling) {
      return res.status(400).json({
        success: false,
        message: `Cannot update an event that is already ${event.status}`,
      });
    }

    if (title !== undefined) {
      if (!title) {
        return res.status(400).json({ success: false, message: 'Title cannot be empty' });
      }
      event.title = title;
    }

    if (description !== undefined) {
      if (!description) {
        return res.status(400).json({ success: false, message: 'Description cannot be empty' });
      }
      event.description = description;
    }

    if (location !== undefined) {
      if (!location) {
        return res.status(400).json({ success: false, message: 'Location cannot be empty' });
      }
      event.location = location;
    }

    if (date !== undefined) {
      const dateResult = parseAndValidateDate(date);
      if (dateResult.error) {
        return res.status(400).json({ success: false, message: dateResult.error });
      }
      event.date = dateResult.value;
    }

    if (capacity !== undefined) {
      const capacityResult = parseAndValidateCapacity(capacity);
      if (capacityResult.error) {
        return res.status(400).json({ success: false, message: capacityResult.error });
      }
      const alreadyReserved = event.capacity - event.availableSeats;
      if (capacityResult.value < alreadyReserved) {
        return res.status(400).json({
          success: false,
          message: `Capacity cannot be less than the ${alreadyReserved} seat(s) already reserved`,
        });
      }
      event.availableSeats = capacityResult.value - alreadyReserved;
      event.capacity = capacityResult.value;
    }

    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}`,
        });
      }
      if (status === 'cancelled' && event.status === 'cancelled') {
        return res.status(400).json({ success: false, message: 'Event is already cancelled' });
      }
      if (status === 'cancelled' && event.status === 'completed') {
        return res.status(400).json({ success: false, message: 'Cannot cancel a completed event' });
      }
      event.status = status;
    }

    await event.save();

    return res.status(200).json({ success: true, data: event });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to update event', error: err.message });
  }
}

// DELETE /api/events/:id (owning organizer only)
async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event id' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete another organizer's event",
      });
    }

    // Reservation model belongs to a teammate's part of the project and may
    // not exist yet. When it does exist (registered on this same mongoose
    // connection), block deleting an event that still has active
    // reservations, per the business rules.
    if (mongoose.models.Reservation) {
      const activeReservationsCount = await mongoose.models.Reservation.countDocuments({
        event: event._id,
        status: 'active',
      });
      if (activeReservationsCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete an event that has active reservations',
        });
      }
    }

    await event.deleteOne();

    return res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete event', error: err.message });
  }
}

module.exports = { createEvent, getEvents, getEvent, updateEvent, deleteEvent };
