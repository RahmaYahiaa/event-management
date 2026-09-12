const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Reservation = require('../models/Reservation');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function paginationParams(query, defaultLimit = 20) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 100);
  return { page, limit };
}

async function getUsers(req, res) {
  try {
    const { role, search } = req.query;
    const filter = {};

    if (role !== undefined) {
      if (!['admin', 'organizer', 'attendee'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role filter' });
      }
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const { page, limit } = paginationParams(req.query);

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
}
async function getUser(req, res) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, role } = req.body;

    if (name === undefined && email === undefined && role === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one of: name, email, role',
      });
    }

    if (role !== undefined && !['admin', 'organizer', 'attendee'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (id === req.user._id.toString() && role !== undefined && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own admin role',
      });
    }

    if (email !== undefined) {
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email is already in use' });
      }
      user.email = email;
    }

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;

    await user.save();

    return res.status(200).json({ success: true, message: 'User updated successfully', data: user });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account',
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.deleteOne();

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
}

async function getAllEvents(req, res) {
  try {
    const { status, organizer } = req.query;
    const filter = {};

    if (status !== undefined) {
      if (!['upcoming', 'ongoing', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status filter' });
      }
      filter.status = status;
    }

    if (organizer !== undefined) {
      if (!isValidId(organizer)) {
        return res.status(400).json({ success: false, message: 'Invalid organizer id' });
      }
      filter.organizer = organizer;
    }

    const { page, limit } = paginationParams(req.query);

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('organizer', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Event.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: events.length,
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      data: events,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message,
    });
  }
}

async function getAllReservations(req, res) {
  try {
    const { status, event, user } = req.query;
    const filter = {};

    if (status !== undefined) {
      if (!['active', 'cancelled'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status filter' });
      }
      filter.status = status;
    }

    if (event !== undefined) {
      if (!isValidId(event)) {
        return res.status(400).json({ success: false, message: 'Invalid event id' });
      }
      filter.event = event;
    }

    if (user !== undefined) {
      if (!isValidId(user)) {
        return res.status(400).json({ success: false, message: 'Invalid user id' });
      }
      filter.user = user;
    }

    const { page, limit } = paginationParams(req.query);

    const [reservations, total] = await Promise.all([
      Reservation.find(filter)
        .populate('user', 'name email role')
        .populate('event', 'title date status organizer')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Reservation.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: reservations.length,
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      data: reservations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reservations',
      error: error.message,
    });
  }
}

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getAllEvents,
  getAllReservations,
};