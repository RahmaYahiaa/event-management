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
/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Event created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only organizers can create events
 */

router.post('/', authenticate, authorize('organizer'), createEvent);
/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events
 *       401:
 *         description: Unauthorized
 */

router.get('/', authenticate, getEvents);
/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */

router.get('/:id', authenticate, getEvent);
/**
 * @swagger
 * /api/events/{id}:
 *   patch:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only organizers can update events
 *       404:
 *         description: Event not found
 */

router.patch('/:id', authenticate, authorize('organizer'), updateEvent);
/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only organizers can delete events
 *       404:
 *         description: Event not found
 */

router.delete('/:id', authenticate, authorize('organizer'), deleteEvent);


/**
 * @swagger
 * /api/reservations/{id}/attendees:
 *   get:
 *     summary: Get attendees of an event
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [active, cancelled, all]
 *           default: active
 *         description: Filter attendees by reservation status
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Event attendees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttendeesListResponse'
 *       400:
 *         description: Invalid event ID or invalid status filter
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only the event organizer or admin can view attendees
 *       404:
 *         description: Event not found
 *       500:
 *         description: Failed to fetch attendees
 */
router.get('/:id/attendees', authenticate, authorize('organizer', 'admin'), getEventAttendees);

/**
 * @swagger
 * /api/reservations/{id}/reserve:
 *   post:
 *     summary: Reserve tickets for an event
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReserveTicketsRequest'
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *       400:
 *         description: Invalid event ID, invalid ticket quantity, cancelled/completed event, not enough seats, or duplicate active reservation
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 *       500:
 *         description: Failed to create reservation
 */

router.post('/:id/reserve', authenticate, reserveTickets);


module.exports = router;