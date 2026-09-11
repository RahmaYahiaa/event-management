const { GoogleGenAI } = require('@google/genai');

const summarizeEvent = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Missing event title' });
    }
    if (!description || description.trim() === '') {
      return res.status(400).json({ success: false, message: 'Missing description' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'Missing API key' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `Please generate a short and clear summary for the following event:\nTitle: ${title}\nDescription: ${description}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    if (!response || !response.text) {
      return res.status(500).json({ success: false, message: 'Empty AI response' });
    }

    return res.status(200).json({
      success: true,
      summary: response.text
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Gemini unavailable or error occurred' });
  }
};

module.exports = { summarizeEvent };