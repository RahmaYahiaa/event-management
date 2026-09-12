const express = require('express');
const router = express.Router();
const {getMyReservations,getReservation,cancelReservation} = require('../controllers/reservationController');
const auth = require('../middleware/authenticate');
/**
 * @swagger
 * /api/reservations/my:
 *   get:
 *     summary: Get my reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [active, cancelled]
 *         description: Filter reservations by status
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of reservations per page
 *     responses:
 *       200:
 *         description: Reservations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationListResponse'
 *       400:
 *         description: Invalid status filter
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch reservations
 */
router.get('/my', auth, getMyReservations);


/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Get a reservation by ID
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     responses:
 *       200:
 *         description: Reservation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationSingleResponse'
 *       400:
 *         description: Invalid reservation ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User is not allowed to view this reservation
 *       404:
 *         description: Reservation not found
 *       500:
 *         description: Failed to fetch reservation
 */

router.get('/:id', auth, getReservation);
/**
 * @swagger
 * /api/reservations/{id}/cancel:
 *   post:
 *     summary: Cancel a reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationSingleResponse'
 *       400:
 *         description: Invalid reservation ID or reservation is not active
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User is not allowed to cancel this reservation
 *       404:
 *         description: Reservation or event not found
 *       500:
 *         description: Failed to cancel reservation
 */

router.post('/:id/cancel', auth, cancelReservation);

module.exports = router;