const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, 
    seatsBooked: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
  },
  { timestamps: true } 
);

module.exports = mongoose.model('Reservation', reservationSchema);
