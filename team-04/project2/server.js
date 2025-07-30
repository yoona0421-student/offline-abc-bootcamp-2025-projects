// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { OpenAI } = require('openai');

dotenv.config(); // .env 파일에서 OPENAI_API_KEY 읽기

const app = express();
const port = 3000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // 정적 파일 제공 (index.html, fonts 등)

// OpenAI 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔹 감정 분석 API
app.post('/api/emotion', async (req, res) => {
  try {
    const userInput = req.body.input;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: '사용자의 감정을 하나의 감정 키워드(예: 행복, 슬픔, 피곤 등)로 요약해 주세요. 키워드 하나만 반환하세요.',
        },
        { role: 'user', content: `지금 기분: ${userInput}` },
      ],
      temperature: 0.7,
    });

    const emotion = completion.choices?.[0]?.message?.content?.trim();
    console.log('감정 분석 결과:', emotion);
    if (!emotion) throw new Error('GPT 응답이 없습니다.');

    res.json({ emotion });
  } catch (error) {
    console.error('❌ 감정 분석 실패:', error);
    res.status(500).json({ error: '감정 분석 실패', detail: error.message });
  }
});

// 🔹 노래 추천 API
app.post('/api/recommend', async (req, res) => {
  try {
    const emotion = req.body.emotion;
    // 감정별 맞춤 프롬프트
    const emotionPrompts = {
      "기쁨이": '기쁘고 행복한 분위기의 한국어 노래 3곡을 추천해 주세요. 형식은 "제목 - 아티스트"로 해주세요.',
      "슬픔이": '슬프고 우울한 분위기의 한국어 노래 3곡을 추천해 주세요. 형식은 "제목 - 아티스트"로 해주세요.',
      "버럭이": '강렬하고 에너지 넘치는 락 또는 신나는 분위기의 한국어 노래 3곡을 추천해 주세요. 형식은 "제목 - 아티스트"로 해주세요.',
      "까칠이": '까칠하거나 쿨한 분위기의 한국어 노래 3곡을 추천해 주세요. 형식은 "제목 - 아티스트"로 해주세요.',
      "소심이": '잔잔하고 조용한 분위기의 한국어 노래 3곡을 추천해 주세요. 형식은 "제목 - 아티스트"로 해주세요.',
      "불안이": '불안하거나 위로가 필요한 상황에 어울리는 한국어 노래 3곡을 추천해 주세요. 형식은 "제목 - 아티스트"로 해주세요.',
      "부럽이": '부러움이나 동경의 감정에 어울리는 한국어 노래 3곡을 추천해 주세요. 형식은 "제목 - 아티스트"로 해주세요.',
      "따분이": '지루하고 심심할 때 듣기 좋은 한국어 노래 3곡을 추천해 주세요. 형식은 "제목 - 아티스트"로 해주세요.',
      "당황이": '당황스럽거나 어색한 상황에 어울리는 한국어 노래 3곡을 추천해 주세요. 형식은 "제목 - 아티스트"로 해주세요.'
    };
    const prompt = emotionPrompts[emotion] || `감정 "${emotion}"에 어울리는 한국어 노래 3곡을 추천해 주세요. 형식은 "제목 - 아티스트"로 해주세요.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    });

    const responseText = completion.choices?.[0]?.message?.content?.trim();
    if (!responseText) throw new Error('GPT 추천 응답이 비어 있습니다.');

    const lines = responseText
      .split('\n')
      .map(line => {
        const [title, artist] = line.split(' - ');
        return {
          title: title?.trim(),
          artist: artist?.trim(),
        };
      })
      .filter(song => song.title && song.artist);

    res.json(lines.slice(0, 3));
  } catch (error) {
    res.status(500).json({ error: '노래 추천 실패', detail: error.message });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${port}`);
});
