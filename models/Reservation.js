const mongoose = require('mongoose');
const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },

    ticketQuantity: {
      type: Number,
      required: [true, 'Ticket quantity is required'],
      min: [1, 'Ticket quantity must be at least 1'],
    },

    status: {
  type: String,
  enum: {
    values: ['active', 'cancelled'],
    message: 'Status must be one of: active, cancelled',
  },
  default: 'active',
},
  },
  { timestamps: true }
);

reservationSchema.index({ user: 1, event: 1, status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);

