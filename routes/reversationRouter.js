const express = require('express');
const router = express.Router();
const {createReservation, cancelReservation} = require('../controllers/reversationControl');
const auth = require('../middleware/authenticate');


/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservationRequest'
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationResponse'
 *       400:
 *         description: Invalid ticket quantity, event status, available seats, or duplicate reservation
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.post('/', auth, createReservation);
/**
 * @swagger
 * /api/reservations/{id}/cancel:
 *   patch:
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
 *       400:
 *         description: Invalid reservation ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reservation not found
 *       500:
 *         description: Server error
 */
router.patch('/:reservationId/cancel', auth, cancelReservation);


module.exports = router;