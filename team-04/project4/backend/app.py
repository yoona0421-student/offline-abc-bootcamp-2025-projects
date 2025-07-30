import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import openai
import traceback

# .env 파일 로드
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)
CORS(app)  # 모든 출처의 요청 허용

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    messages = data.get("messages", [])
    if not messages:
        return jsonify({"error": "messages 필드가 필요합니다."}), 400
    try:
        # openai>=1.0.0 인터페이스로 변경
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.6,
            stream=False
        )
        reply = response.choices[0].message.content
        return jsonify({"reply": reply})
    except Exception as e:
        traceback.print_exc()
        err = str(e) or "Internal Server Error"
        return jsonify({"error": err}), 500

if __name__ == "__main__":
    # 개발 모드: 디버그 켜고 포트 5000에서 실행
    app.run(host="0.0.0.0", port=5000, debug=True)
