# 4팀 프로젝트 저장소

## 멤버: 민재홍 장재훈 정윤아

## project2 - 인사이드아웃 감정 기반 음악 추천 웹앱 🎧

Disney·Pixar **인사이드아웃** 캐릭터(기쁨이, 슬픔이, 버럭이, 까칠이, 소심이, 불안이, 부럽이, 따분이, 당황이)의 구슬을 클릭하거나 직접 감정을 입력하면 **OpenAI GPT**가 감정에 어울리는 **한국어 노래 3 곡**을 추천해 주는 웹 애플리케이션입니다.

- **Frontend:** HTML · CSS · JavaScript  
- **Backend:** Node.js (Express) · OpenAI Chat API  
- **특징:** 캐릭터 네온 UI · 스마트폰 프레임 · 반응형 · 실시간 YouTube Music 검색 링크

---

## 📁 주요 파일 구조

```text
insideout-music/
│  server.js          # Express 서버 (API 라우트)
│  .env               # OpenAI API 키 등 환경 변수
│  package.json       # Node.js 의존성
│  README.md          # 프로젝트 설명 (본 파일)
│
├─public/             # 정적 파일 루트
│   index.html        # 메인 페이지
│   style.css         # 스타일 (index.html 내 인라인인 경우 없음)
│   script.js         # 프런트 JS (index.html 내 스크립트일 수도 있음)
│
├─public/fonts/       # GmarketSans TTF 3종
│   GmarketSansTTFLight.ttf
│   GmarketSansTTFMedium.ttf
│   GmarketSansTTFBold.ttf
│
└─public/images/      # 캐릭터 & UI 이미지
    joy.png
    sadness.png
    anger.png
    disgust.png
    fear.png
    anxiety.png
    envy.png
    boredom.png
    embarrassment.png
    chat.png
    backgrouund.jpg
```

> **경로 주의** : `server.js`에서  
> ```js
> app.use(express.static(path.join(__dirname, 'public')));
> ```  
> 로 정적 폴더를 지정하므로 `index.html`, `fonts/`, `images/`는 `public/` 하위에 위치해야 합니다.

---

## 🌟 주요 기능

| 기능 | 설명 |
|------|------|
| 🎯 **감정 구슬 클릭** | 캐릭터 구슬 클릭 → `/api/recommend` 호출 → 감정별 노래 3곡 추천 |
| ✏️ **직접 감정 입력** | “내 감정이 없어요” → 문장 입력 → `/api/emotion`으로 감정 키워드 추출 후 추천 |
| 🎵 **추천 결과 카드** | 곡 **제목 – 아티스트** + 🎧 music play 링크(**YouTube Music 검색 페이지**) |
| 📱 **반응형 UI** | 스마트폰 모양 프레임, 캐릭터별 네온 Glow, 모바일·데스크톱 모두 자연스러운 레이아웃 |

---

## 🛠️ 사전 준비

1. **Node.js 18+** 설치  
2. 저장소 클론 후 의존성 설치  
   ```bash
   npm install
   ```  
3. **OpenAI API Key** 발급 → 저장소 루트에 `.env` 생성  
   ```env
   OPENAI_API_KEY=sk-xxxx...
   ```

---

## ▶️ 실행 방법

```bash
node server.js        # ➜ http://localhost:3000
```

브라우저에서 `http://localhost:3000` 접속 → 캐릭터 클릭 또는 감정 입력 → 추천 결과 확인.

---

## 🔧 커스터마이징

| 항목 | 위치 · 방법 |
|------|-------------|
| 추천 톤 변경 | `server.js` > `emotionPrompts` 객체의 프롬프트 수정 |
| 추천 곡 수 조정 | `lines.slice(0, 3)` → 원하는 숫자로 수정 |
| UI 색상·폰트 | `public/index.html` 내 `<style>` 또는 별도 `style.css` |
| 검색 방식 | `script.js` → `https://music.youtube.com/search?q=…` 부분을 일반 YouTube 링크 또는 다른 스트리밍 API로 변경 |

---

## 📜 라이선스

- **코드** : MIT  
- **이미지** : Disney / Pixar 인사이드아웃 팬아트 또는 공개 사용 가능 리소스 (배포 시 저작권 확인 필요)  
- **폰트** : GmarketSans (㈜지마켓 무료 배포, 상업적 사용 가능)  
- **API** : OpenAI 사용 약관 준수 필수

---

## 🤝 기여

Issue / PR을 통한 버그 제보와 기능 제안을 환영합니다. 😊



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


## Project4 : 감정 스무고개 웹앱 🔮🕵️‍♂️

사용자가 **예 / 아니오** 형식으로 답하면 **OpenAI GPT**가 최대 7 개의 질문(스무고개 축약판) 안에 현재 감정을 추측하는 웹 애플리케이션입니다.  
프런트엔드는 순수 **HTML / CSS / JS**, 백엔드는 **Flask + OpenAI API**로 구성했습니다.

---

## 📁 주요 파일 구조 및 역할

| 파일/폴더            | 설명 |
|----------------------|------|
| `app.py`             | Flask 서버. 세션 관리 · OpenAI API 연동 |
| `requirements.txt`   | Python 의존성 목록 |
| `.env`               | `OPENAI_API_KEY` 저장 (직접 생성 필요) |
| `static/index.html`  | 메인 페이지. 질문/답변 UI |
| `static/style.css`   | 전반적인 스타일, 그라디언트·네온 효과 |
| `static/script.js`   | 프런트 로직 (fetch, 상태·UI 업데이트) |
| `static/fonts/`      | GmarketSans TTF 3종 |
| `README.md`          | 프로젝트 설명 (본 파일) |

---

## 🌟 주요 기능

| 기능                | 설명 |
|---------------------|------|
| 🎲 **게임 시작**      | “게임 시작” 버튼 클릭 시 GPT가 첫 질문 생성 |
| 🙋‍♀️ **예 / 아니오 / 모름** | 버튼 한 번으로 답변, 7 개 이하 질문으로 감정 추측 |
| 🔍 **감정 추측 & 결과** | `내가 생각한 감정은 ___ 맞아?` 형식으로 추측 · 결과 표시 |
| 📱 **반응형 UI**      | 모바일·데스크톱 모두 자연스럽게 동작, 네온 강조 효과 |

---

## 🛠️ 사전 준비

1. **Python 3.9+** 설치  
2. (선택) 가상 환경 생성  
   ```bash
   python -m venv venv
   source venv/bin/activate      # Windows: venv\Scripts\activate
   ```
3. **OpenAI API Key** 발급 → 저장소 루트에 `.env` 작성  
   ```env
   OPENAI_API_KEY=sk-xxxx...
   ```

---

## ▶️ 실행 방법

```bash
# 1) 의존성 설치
pip install -r requirements.txt

# 2) 서버 실행
python app.py          # http://localhost:5000
```

> Flask가 정적 파일(`static/`)을 함께 서빙하므로 별도 프런트 서버가 필요 없습니다.  
> VS Code “Live Server”로 `index.html`을 열 경우 도메인이 달라져 CORS 설정이 필요할 수 있습니다.

---

## 🔧 커스터마이징

| 항목         | 위치 · 수정 방법 |
|--------------|-----------------|
| 질문 최대 수 | `static/script.js` → `if (questionCount >= 7)` 숫자 조정 |
| GPT 모델·온도 | `app.py` → `model="gpt-4o-mini", temperature=0.6` 등 |
| 색상·폰트     | `static/style.css` (CSS 변수 또는 클래스) |

---

## 📜 라이선스

- **코드** : MIT  
- **폰트** : GmarketSans — ㈜지마켓 무료 배포 (상업적 사용 가능)  
- **API** : OpenAI 사용 약관 준수 필수

---

## 🤝 기여

Pull Request와 Issue를 환영합니다! ✨
