const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be a positive number'],
    },
    availableSeats: {
      type: Number,
      required: true,
      min: [0, 'Available seats cannot be negative'],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        message: 'Status must be one of: upcoming, ongoing, completed, cancelled',
      },
      default: 'upcoming',
    },
  },
  { timestamps: true }
);

// Defensive guard: available seats can never exceed capacity, whatever
// code path created/modified the document.
eventSchema.pre('validate', function () {
  if (this.availableSeats == null && this.capacity != null) {
    this.availableSeats = this.capacity;
  }
  if (
    this.availableSeats != null &&
    this.capacity != null &&
    this.availableSeats > this.capacity
  ) {
    return next(new Error('Available seats cannot exceed capacity'));
  }
  
});

eventSchema.index({ organizer: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ date: 1 });

module.exports = mongoose.model('Event', eventSchema);
