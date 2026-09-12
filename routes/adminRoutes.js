const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getAllEvents,
  getAllReservations,
} = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/events', getAllEvents);
router.get('/reservations', getAllReservations);

module.exports = router;