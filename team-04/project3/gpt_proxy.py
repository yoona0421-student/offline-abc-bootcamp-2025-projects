from flask import Flask, request, Response
import openai
import os
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()
app = Flask(__name__)
CORS(app)

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route("/generate/stream", methods=["POST"])
def generate_stream():
    data = request.get_json()
    messages = data["messages"]
    print("📨 메시지 수신 완료")

    def stream():
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                temperature=0.7,
                max_tokens=1500,
                stream=True
            )
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"[ERROR]: {str(e)}"

    return Response(stream(), content_type="text/plain")

if __name__ == "__main__":
    print("🚀 GPT 스트리밍 서버 시작: http://localhost:5000/generate/stream")
    app.run(debug=True)
