const express = require('express');
const { summarizeEvent } = require('../controllers/aiController');
const authenticate = require('../middleware/authenticate'); 

const router = express.Router();
/**
 * @swagger
 * /api/summarise-event:
 *   post:
 *     summary: Generate a short summary for an event using Gemini AI
 *     tags: [Gemini AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SummarizeEventRequest'
 *     responses:
 *       200:
 *         description: Event summary generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SummarizeEventResponse'
 *       400:
 *         description: Missing event title or description
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Gemini API error or missing API key
 */
router.post('/summarize-event', authenticate, summarizeEvent);

module.exports = router;