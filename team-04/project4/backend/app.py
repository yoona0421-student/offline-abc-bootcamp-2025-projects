
# File: app.py
# Flask 기반 프록시 서버로, 클라이언트의 요청을 받아 OpenAI Chat API에 전달합니다.
import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import openai

# .env 파일 로드
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    messages = data.get("messages", [])
    if not messages:
        return jsonify({"error": "messages 필드가 필요합니다."}), 400

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.6,
            stream=False  # 스트리밍 기능이 필요하면 True로 변경 후 프론트엔드 로직 수정
        )
        reply = response.choices[0].message.content
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # 개발 모드: 디버그 켜고 포트 5000에서 실행
    app.run(host="0.0.0.0", port=5000, debug=True)
