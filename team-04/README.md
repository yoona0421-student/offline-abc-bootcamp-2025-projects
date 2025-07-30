# 4팀 프로젝트 저장소

## 멤버: 민재홍 장재훈 정윤아

# project4- Emotion Detective 웹앱 설명서

# 사용자 설명서

## 1. 백엔드 실행

cd emotion-detector/backend
python -m venv venv
#Windows
venv\Scripts\activate
#macOS/Linux
source venv/bin/activate
pip install flask python-dotenv flask-cors openai
python app.py
확인:
터미널에 Running on http://0.0.0.0:5000/ 메시지가 출력되는지 확인하세요.

## 2. 프론트엔드 실행
bash
복사
편집
cd emotion-detector/frontend
python -m http.server 8000
브라우저에서 http://localhost:8000 을 열어 챗 UI가 표시되는지 확인합니다.

## 3. 동작 테스트
페이지가 열리면 자동으로 GPT의 첫 번째 질문이 표시됩니다.

입력창에 답변을 적고 전송 버튼을 누르면 다음 질문이 내려옵니다.

총 7회 질문 후, 마지막에 “현재 사용자의 감정”이 한 문장으로 출력됩니다.

# 팁 & 체크리스트
.env 파일에 OPENAI_API_KEY를 정확히 입력했나요?

flask-cors가 설치되어 있고, app.py에 CORS(app) 설정이 반영되었나요?

HTTP 서버(python -m http.server)로 열었나요? (file:// 로 열면 CORS 문제가 발생합니다)

OpenAI 패키지를 최신 버전으로 업그레이드(pip install --upgrade openai)했나요?

터미널(백엔드)와 브라우저 DevTools(Network/Console)에서 에러 메시지를 확인하세요.
