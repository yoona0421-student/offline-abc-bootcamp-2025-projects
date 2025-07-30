from flask import Flask, request, Response, send_from_directory
import openai
import os
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()
app = Flask(__name__, static_folder='static')
CORS(app)

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route("/")
def serve_index():
    return send_from_directory('static', 'index.html')

@app.route("/generate/stream", methods=["POST"])
def generate_stream():
    data = request.get_json()

    # 🎯 구체적 시간 + 설명 포함 일정 요청 프롬프트
    prompt = f"""
사용자가 입력한 정보를 바탕으로 **시간 단위의 구체적인 여행 일정을 계획**해줘.

- 예산: {data.get('budget')}원
- 인원: {data.get('people')}명
- 기간: {data.get('days')}일
- 출발지: {data.get('departure')}
- 테마 감정: {data.get('themeEmotion')}
- 여행 테마: {data.get('theme')}
- 추천 방식: {data.get('regionPref')}
- 여행 타입: {data.get('travelType')}

**아래 형식의 JSON으로만 응답해줘 (문장 추가하지 말고 JSON만 출력)**:
{{
  "summary": "2명이 3일간 힐링 여행을 서울에서 출발합니다.",
  "budget": {{
    "숙박": 600000,
    "교통": 300000,
    "식비": 200000,
    "기타": 100000
  }},
  "tableHTML": "<table><thead><tr><th>시간</th><th>활동</th><th>설명</th></tr></thead><tbody><tr><td>09:00</td><td>호텔 조식</td><td>현지 뷔페에서 아침 식사</td></tr>...</tbody></table>"
}}
"""

    def stream():
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    { "role": "system", "content": "너는 여행 일정을 추천하는 AI야." },
                    { "role": "user", "content": prompt }
                ],
                temperature=0.7,
                max_tokens=1500,
                stream=True
            )

            for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            yield f'[ERROR]: {str(e)}'

    return Response(stream(), content_type='text/plain')

if __name__ == "__main__":
    print("🚀 서버 실행 중: http://localhost:5000")
    app.run(debug=True)
