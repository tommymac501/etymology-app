const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors({ origin: 'https://etymology-frontend.onrender.com' })); // Allow requests from frontend (update with specific frontend URL in production)
app.use(express.json());

// Simulated local etymology dictionary for fallback
const localEtymology = {
  'book': 'Derived from Old English "bōc," meaning a written document or volume, rooted in Proto-Germanic "bōks," linked to beech wood used for writing tablets.',
  'house': 'From Old English "hūs," stemming from Proto-Germanic "hūsan," possibly related to the idea of shelter or covering.',
  'love': 'Originates from Old English "lufu," from Proto-Germanic "lubō," connected to Sanskrit "lubh," meaning desire or affection.'
};

app.post('/etymology', async (req, res) => {
  const word = req.body.word?.trim().toLowerCase();
  
  if (!word) {
    return res.status(400).json({ error: 'No word provided' });
  }

  try {
    const apiKey = process.env.XAI_API_KEY;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: [{
          role: 'user',
          content: `Provide the etymology of the word "${word}". Include its origin, historical development, and any relevant linguistic roots in a concise format suitable for a short story.`
        }],
        max_tokens: 300
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      return res.json({ etymology: localEtymology[word] || 'No etymology data available.' });
    }

    const etymology = data.choices[0].message.content.trim();
    if (!etymology || etymology.toLowerCase().includes('not found')) {
      return res.json({ etymology: localEtymology[word] || 'No etymology data available.' });
    }

    res.json({ etymology });
  } catch (error) {
    console.error(error);
    res.json({ etymology: localEtymology[word] || 'No etymology data available.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});