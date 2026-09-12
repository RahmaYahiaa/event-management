const { GoogleGenAI } = require('@google/genai');

const MAX_DESCRIPTION_LENGTH = 4000;
const GEMINI_TIMEOUT_MS = 15000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(Object.assign(new Error('Request timed out'), { isTimeout: true })), ms)
    ),
  ]);
}

async function summarizeEvent(req, res) {
  try {
    const { title, description } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Missing event title' });
    }

    if (!description || description.trim() === '') {
      return res.status(400).json({ success: false, message: 'Missing description' });
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Description is too long, maximum ${MAX_DESCRIPTION_LENGTH} characters allowed`,
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      return res.status(500).json({ success: false, message: 'AI service is not configured' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

   const prompt = `Generate a short, clear summary for the following event in plain text only, without any markdown formatting, headings, or bullet points:\nTitle: ${title}\nDescription: ${description}`;

    let response;
    try {
      response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        }),
        GEMINI_TIMEOUT_MS
      );
    } catch (err) {
      console.error('Gemini API call failed:', err);

      if (err.isTimeout) {
        return res.status(504).json({ success: false, message: 'AI request timed out, please try again' });
      }

      const statusCode = err.status || err.code || err?.response?.status;

      if (statusCode === 401 || statusCode === 403) {
        return res.status(500).json({ success: false, message: 'AI service configuration error' });
      }

      if (statusCode === 429) {
        return res.status(429).json({
          success: false,
          message: 'AI service rate limit exceeded, please try again shortly',
        });
      }

      if (statusCode === 503 || statusCode === 500) {
        return res.status(503).json({ success: false, message: 'AI service is currently unavailable' });
      }

      return res.status(502).json({ success: false, message: 'Failed to generate summary' });
    }

    if (!response || !response.text || response.text.trim() === '') {
      return res.status(502).json({ success: false, message: 'AI returned an empty response' });
    }

    return res.status(200).json({
      success: true,
      summary: response.text,
    });
  } catch (err) {
    console.error('Unexpected error in summarizeEvent:', err);
    return res.status(500).json({ success: false, message: 'Failed to summarize event' });
  }
}

module.exports = { summarizeEvent };