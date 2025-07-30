const API_URL = "http://localhost:5000/generate";
// 초기 메시지 배열
const messages = [
  { role: "system", content: "당신은 사용자의 현재 감정을 추측하는 감정 탐정 역할입니다. 친절하고 공감 어린 어조로 7개의 질문을 던지세요." },
  { role: "system", content: "총 7개의 질문을 모두 마친 뒤, 마지막에 사용자 감정을 한 문장으로 추측해 알려주세요." },
  { role: "user",   content: "안녕하세요. 제 감정을 맞춰주세요." }
];
let questionCount = 0;
const msgContainer = document.getElementById("messages");
const inputField   = document.getElementById("user-input");
const sendBtn      = document.getElementById("send-btn");

function appendMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.innerText = text;
  msgContainer.append(div);
  msgContainer.scrollTop = msgContainer.scrollHeight;
}

// 첫 질문 요청 함수
async function getFirstQuestion() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    appendMessage(data.reply, "bot");
    messages.push({ role: "assistant", content: data.reply });
  } catch (e) {
    appendMessage(`Error: ${e.message}`, "bot");
    console.error(e);
  }
}

// 유저 답변 → 다음 질문
async function chat() {
  const userText = inputField.value.trim();
  if (!userText) return;
  appendMessage(userText, "user");
  inputField.value = "";
  messages.push({ role: "user", content: userText });
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    appendMessage(data.reply, "bot");
    messages.push({ role: "assistant", content: data.reply });
    questionCount++;
    if (questionCount >= 7) {
      inputField.disabled = true;
      sendBtn.disabled = true;
    }
  } catch (e) {
    appendMessage(`Error: ${e.message}`, "bot");
    console.error(e);
  }
}

sendBtn.addEventListener("click", chat);
inputField.addEventListener("keydown", e => {
  if (e.key === "Enter") chat();
});

// 페이지 로드시 첫 질문 실행
window.onload = getFirstQuestion;
