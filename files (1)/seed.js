require('dotenv').config();
const connectDB = require('./db');
const Event = require('./models/Event');
const Reservation = require('./models/Reservation');

async function seed() {
  await connectDB();

  await Reservation.deleteMany({});
  await Event.deleteMany({});

  const [evt1, evt2, evt3] = await Event.create([
    {
      name: 'Node.js Workshop',
      date: new Date(Date.now() + 1000 * 60 * 60 * 48), 
      totalSeats: 3,
      availableSeats: 1,
    },
    {
      name: 'React Meetup',
      date: new Date(Date.now() + 1000 * 60 * 60 * 2), 
      totalSeats: 2,
      availableSeats: 0,
    },
    {
      name: 'Past Conference',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24), 
      totalSeats: 5,
      availableSeats: 2,
    },
  ]);

  await Reservation.create([
    { userId: 'user1', eventId: evt1._id, seatsBooked: 1, status: 'active' },
    { userId: 'user2', eventId: evt1._id, seatsBooked: 1, status: 'active' },
    { userId: 'user1', eventId: evt2._id, seatsBooked: 2, status: 'active' },
    { userId: 'user3', eventId: evt3._id, seatsBooked: 3, status: 'cancelled' },
  ]);

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
