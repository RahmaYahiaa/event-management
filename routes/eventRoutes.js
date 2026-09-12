const express = require('express');
const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const {
  reserveTickets,
  getEventAttendees,
} = require('../controllers/reservationController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.post('/', authenticate, authorize('organizer'), createEvent);
router.get('/', authenticate, getEvents);
router.get('/:id', authenticate, getEvent);
router.patch('/:id', authenticate, authorize('organizer'), updateEvent);
router.delete('/:id', authenticate, authorize('organizer'), deleteEvent);

router.post('/:id/reserve', authenticate, reserveTickets);
router.get('/:id/attendees', authenticate, authorize('organizer', 'admin'), getEventAttendees);

module.exports = router;