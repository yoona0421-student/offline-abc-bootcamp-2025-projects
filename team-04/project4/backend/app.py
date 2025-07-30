import os
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

# ─── 설정 ───────────────────────────────────────────
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("`.env`에 OPENAI_API_KEY를 설정하세요.")

client = OpenAI(api_key=OPENAI_API_KEY)

app = Flask(__name__)
CORS(app)  # 모든 출처에서 요청 허용

# ─── 동기 챗 완성 엔드포인트 (/generate) ────────────────
@app.route("/generate", methods=["POST"])
def generate():
    data = request.json or {}
    messages = data.get("messages", [])
    if not messages:
        return jsonify({"error": "messages 필드가 필요합니다."}), 400

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.6,
            stream=False
        )
        return jsonify({"reply": resp.choices[0].message.content})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e) or "Internal Server Error"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
