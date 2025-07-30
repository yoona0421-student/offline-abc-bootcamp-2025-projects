# 4팀 프로젝트 저장소

## 멤버: 민재홍 장재훈 정윤아

## project3 - 🗺️ AI 여행 일정 추천기 - 사용 설명서

AI 여행 일정 추천기는 사용자의 감정, 예산, 출발지, 인원 수, 여행 테마 등을 바탕으로 현실적인 여행 일정을 생성해주는 웹 애플리케이션입니다. ChatGPT (GPT-4) API를 사용하여 스트리밍 방식으로 결과를 빠르게 제공합니다.

---

## 📦 구성 파일

| 파일명         | 설명                                       |
|----------------|--------------------------------------------|
| `index.html`   | 프론트엔드 UI / 사용자 입력 및 결과 표시 화면 |
| `gpt_proxy.py` | Flask 기반 백엔드 / GPT API 프록시 및 스트리밍 처리 |
| `.env`         | OpenAI API 키 저장용 (직접 생성 필요)         |

---

## ⚙️ 시스템 요구 사항

- Python 3.8 이상
- 설치 패키지:
  - `flask`
  - `flask-cors`
  - `openai`
  - `python-dotenv`
- 프론트엔드는 순수 HTML/JS로 동작
- Chart.js로 예산 분배 시각화

---

## 📁 설치 및 실행 방법

### 1. 환경 변수 설정

`.env` 파일 생성 후 아래 내용 입력:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. 패키지 설치

```bash
pip install flask flask-cors python-dotenv openai
```

### 3. 백엔드 실행

```bash
python gpt_proxy.py
```

서버가 성공적으로 실행되면:

```
🚀 GPT 스트리밍 서버 시작: http://localhost:5000/generate/stream
```

### 4. 프론트엔드 실행

로컬에서 HTML 열기 또는 Python 내장 서버 사용:

```bash
python -m http.server 8000
```

브라우저에서 접속:

```
http://localhost:8000/index.html
```

---

### 🧑‍💻 입력 항목 설명

| 항목             | 입력 예시             | 설명                                  |
|------------------|------------------------|---------------------------------------|
| 예산 (KRW)       | `2000000`              | 전체 여행 예산                        |
| 인원 수          | `2`                    | 여행 참여 인원                        |
| 여행 기간 (일)   | `3`                    | 총 여행 일수                          |
| 테마 감정        | `설렘`, `힐링`, `모험` | 여행에서 원하는 감정 키워드           |
| 출발지           | `서울`, `대전`         | 여행 시작 위치                        |
| 여행 테마        | `힐링`, `미식` 등      | 여행 스타일 선택                      |
| 추천 방식        | `랜덤`, `조건`         | AI 조건 기반 or 무작위 추천 선택     |
| 여행 타입        | `국내`, `해외`         | 국내 or 해외 여부                     |

---

### 🔁 기능 요약

- 사용자의 조건을 기반으로 GPT가 여행지와 일정을 생성
- 여행 일정은 날짜별 HTML 테이블 형식으로 제공
- 예산 분배는 숨김 JSON 형식으로 GPT 응답에 포함
- Chart.js를 활용하여 예산을 파이 차트로 시각화
- 응답은 Flask에서 스트리밍으로 받아 실시간 표시

---

### 🎨 GPT 응답 형식 예시

GPT에게 다음과 같은 형식을 강제합니다:

\`\`\`
1. 추천 여행지 소개 (도시명 + 설명)
2. 날짜별 상세 일정 (🗓️ Day 1 ~ N 형식 + HTML <table>)
3. 숨겨진 예산 분배 JSON
   <!--BUDGET_JSON_START-->
   {
     "항공": 400000,
     "숙박": 600000,
     "식사": 200000,
     "활동": 300000,
     "기타": 100000
   }
   <!--BUDGET_JSON_END-->
\`\`\`

---

### 📉 예산 시각화 처리 흐름

1. GPT 응답 중 `<!--BUDGET_JSON_START-->` 구간 추출
2. JSON 파싱
3. Chart.js로 원형 차트 렌더링
4. 결과는 `"예산 분배"` 제목으로 하단 표시

---

### 🛠️ 주의 사항

- `.env` 파일이 없으면 API 호출 실패
- 예산, 인원, 기간, 출발지 등 필수 항목 미입력 시 경고 알림 발생
- GPT 응답 형식이 틀릴 경우 일정 표나 예산 차트가 제대로 렌더링되지 않을 수 있음
- Flask는 로컬 테스트 용도로만 사용하며 배포 시 보안 설정 필요

---

### 📌 기타 정보

- 백엔드 포트: `5000`
- 프론트엔드 테스트 포트 (선택): `8000`
- Chart.js CDN 사용 (`https://cdn.jsdelivr.net/npm/chart.js`)
- 모든 JS 코드는 `index.html`에 인라인으로 포함되어 있음

---

> 문의 또는 개선 제안은 GitHub Issue 또는 이메일로 전달해주세요.


## project4- Emotion Detective 웹앱 설명서
### 1. 백엔드 실행

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

### 2. 프론트엔드 실행
cd emotion-detector/frontend

python -m http.server 8000

브라우저에서 http://localhost:8000 을 열어 챗 UI가 표시되는지 확인합니다.

### 3. 동작 테스트
페이지가 열리면 자동으로 GPT의 첫 번째 질문이 표시됩니다.

입력창에 답변을 적고 전송 버튼을 누르면 다음 질문이 내려옵니다.

총 7회 질문 후, 마지막에 “현재 사용자의 감정”이 한 문장으로 출력됩니다.

### 팁 & 체크리스트
.env 파일에 OPENAI_API_KEY를 정확히 입력했나요?

flask-cors가 설치되어 있고, app.py에 CORS(app) 설정이 반영되었나요?

HTTP 서버(python -m http.server)로 열었나요? (file:// 로 열면 CORS 문제가 발생합니다)

OpenAI 패키지를 최신 버전으로 업그레이드(pip install --upgrade openai)했나요?

터미널(백엔드)와 브라우저 DevTools(Network/Console)에서 에러 메시지를 확인하세요.
