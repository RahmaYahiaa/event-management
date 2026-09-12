const mongoose = require('mongoose');


async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/reservation_system';
  await mongoose.connect(uri);
  console.log('MongoDB connected:', uri);
}

module.exports = connectDB;
