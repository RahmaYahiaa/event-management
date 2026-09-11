const express = require('express');
const router = express.Router();
const {createReservation, cancelReservation} = require('../controllers/reversationControl');
const auth = require('../middleware/authenticate');



router.post('/', auth, createReservation);

router.patch('/:reservationId/cancel', auth, cancelReservation);


module.exports = router;