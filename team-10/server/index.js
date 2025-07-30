const express = require('express')
const bodyParser = require('body-parser');
const { OpenAI } = require('openai/index.js');
const path = require('path');
require('dotenv').config();

const app = express()
const port = 3000;

app.use(bodyParser.json());

// ✅ OpenAI 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/wonyoung', async (req, res) => {
  const userText = req.body.text;

  if (!userText) {
    return res.status(400).json({ error: 'No input provided' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are Jang Wonyoung from IVE. Respond in bubbly, sweet Korean using expressions like '로쿠비키', '아하~', '만약에~'. Always be positive and comforting."
        },
        {
          role: "user",
          content: userText
        }
      ],
      temperature: 0.9
    });

    const message = completion.choices?.[0]?.message?.content;
    res.json({ result: message });
  } catch (err) {
    console.error('OpenAI Error:', err);
    res.status(500).json({ error: 'Something went wrong with OpenAI' });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
