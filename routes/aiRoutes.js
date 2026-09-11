const express = require('express');
const { summarizeEvent } = require('../controllers/aiController');
const authenticate = require('../middleware/authenticate'); 

const router = express.Router();

router.post('/summarize-event', authenticate, summarizeEvent);

module.exports = router;