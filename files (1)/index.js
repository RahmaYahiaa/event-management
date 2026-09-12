require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const Reservation = require('./models/Reservation');
const {
  viewUserReservations,
  viewReservationDetails,
  cancelReservation,
  viewEventAttendees,
  validateReservationOwnership,
} = require('./reservationService');

function section(title) {
  console.log('\n=== ' + title + ' ===');
}

async function tryIt(label, fn) {
  try {
    console.log(`[OK] ${label}:`, await fn());
  } catch (err) {
    console.log(`[${err.name || 'Error'}] ${label}: ${err.message}`);
  }
}

async function main() {
  await connectDB();

  
  const [res1, res3, res4] = await Promise.all([
    Reservation.findOne({ userId: 'user1', seatsBooked: 1 }),
    Reservation.findOne({ userId: 'user1', seatsBooked: 2 }),
    Reservation.findOne({ userId: 'user3' }),
  ]);

  section('View user reservations (user1)');
  await tryIt('user1 reservations', () => viewUserReservations('user1'));

  section('View reservation details');
  await tryIt('details of res1', () => viewReservationDetails(res1.id));

  section('Validate reservation ownership');
  await tryIt('res1 belongs to user1', () => validateReservationOwnership(res1.id, 'user1'));
  await tryIt('res1 belongs to user2 (should fail)', () =>
    validateReservationOwnership(res1.id, 'user2')
  );

  section('View event attendees');
  await tryIt('attendees of evt1', () => viewEventAttendees(res1.eventId));

  section('Cancel reservation (res1, event 48h away -> allowed)');
  await tryIt('cancel res1', () => cancelReservation(res1.id, 'user1'));
  await tryIt('attendees of evt1 after cancel', () => viewEventAttendees(res1.eventId));

  section('Edge cases');
  await tryIt('cancel non-existent reservation', () =>
    cancelReservation(new mongoose.Types.ObjectId().toString(), 'user1')
  );
  await tryIt('user2 tries to cancel res3 (owned by user1)', () =>
    cancelReservation(res3.id, 'user2')
  );
  await tryIt('cancel res1 again (already cancelled)', () => cancelReservation(res1.id, 'user1'));
  await tryIt('cancel res3 (event too close, should fail)', () =>
    cancelReservation(res3.id, 'user1')
  );
  await tryIt('cancel res4 (event already happened / already cancelled)', () =>
    cancelReservation(res4.id, 'user3')
  );
  await tryIt('attendees of non-existent event', () =>
    viewEventAttendees(new mongoose.Types.ObjectId().toString())
  );
  await tryIt('viewUserReservations with no userId', () => viewUserReservations());

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
