const express = require('express');
const router = express.Router();
const {getMyReservations,getReservation,cancelReservation} = require('../controllers/reservationController');
const auth = require('../middleware/authenticate');

router.get('/my', auth, getMyReservations);
router.get('/:id', auth, getReservation);
router.post('/:id/cancel', auth, cancelReservation);

module.exports = router;