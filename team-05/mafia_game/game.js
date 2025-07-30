const socket = io();
let currentPhase = "waiting";
let myRole = null;
let gameStarted = false;

// 타이머 관련 변수들
let timerInterval = null;
let currentTimer = 0;

// 닉네임 입력 및 게임 참가
const nickname = prompt("닉네임을 입력하세요");
if (nickname) {
    socket.emit("join", { nickname });
}

// DOM 요소들
const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const voteBtn = document.getElementById("voteBtn");
const chat = document.getElementById("chat");

// 페이지 로드 후 타이머 요소 확인 및 생성
document.addEventListener('DOMContentLoaded', function() {
    console.log('페이지 로드됨, 타이머 요소 확인 중...');
    
    setTimeout(() => {
        ensureTimerElements();
    }, 1000);
});

// 타이머 요소 확인 및 생성 함수
function ensureTimerElements() {
    let timerContainer = document.getElementById('timer-container');
    
    if (!timerContainer) {
        console.log('타이머 요소가 없어서 생성합니다...');
        createTimerElement();
    } else {
        console.log('타이머 요소 확인됨:', timerContainer);
    }
}

// 타이머 요소 동적 생성 (애니메이션 제거)
function createTimerElement() {
    console.log('타이머 요소 동적 생성 중...');
    
    const timerContainer = document.createElement('div');
    timerContainer.id = 'timer-container';
    timerContainer.style.cssText = `
        display: none;
        text-align: center;
        margin: 10px 0;
        padding: 15px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        font-size: 18px;
        font-weight: bold;
        transition: all 0.3s ease;
    `;
    
    const timerDisplay = document.createElement('div');
    timerDisplay.id = 'timer-display';
    timerDisplay.innerHTML = '⏰ 남은 시간: <span id="timer-seconds" style="font-size: 24px; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">0</span>초';
    
    timerContainer.appendChild(timerDisplay);
    
    const phaseElement = document.getElementById('phase');
    if (phaseElement) {
        phaseElement.parentNode.insertBefore(timerContainer, phaseElement.nextSibling);
        console.log('타이머 요소가 phase 다음에 추가됨');
    } else {
        const gameArea = document.querySelector('.game-area') || document.body;
        gameArea.appendChild(timerContainer);
        console.log('타이머 요소가 게임 영역에 추가됨');
    }
    
    // 깔끔한 CSS 스타일만 추가 (애니메이션 없음)
    if (!document.getElementById('timer-styles')) {
        const style = document.createElement('style');
        style.id = 'timer-styles';
        style.textContent = `
            .timer-warning {
                color: #ff4444 !important;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }
}

// 이벤트 리스너 설정
sendBtn.onclick = () => {
    const msg = messageInput.value.trim();
    if (msg) {
        if (mafiaMode && myRole === 'mafia') {
            // 마피아 전용 채팅
            socket.emit("mafia_chat", { message: msg });
        } else {
            // 일반 채팅
            socket.emit("chat", { message: msg });
        }
        messageInput.value = "";
    }
};

// 엔터키로 메시지 전송
messageInput.onkeypress = (event) => {
    if (event.key === 'Enter') {
        sendBtn.click();
    }
};

// 마피아 채팅 수신 이벤트
socket.on("mafia_chat", (data) => {
    const messageDiv = document.createElement("div");
    messageDiv.className = 'chat-message mafia-message';
    messageDiv.innerHTML = `<strong style="color: #dc3545;">🔴 [마피아] ${data.nickname}:</strong> <span style="color: #721c24;">${data.message}</span>`;
    messageDiv.style.cssText = `
        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        border: 2px solid #dc3545;
        padding: 10px;
        margin: 6px 0;
        border-radius: 6px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
    `;
    
    chat.appendChild(messageDiv);
    chat.scrollTop = chat.scrollHeight;
});

// 게임 시작
startBtn.onclick = () => {
    socket.emit("start_game");
};

// 투표
voteBtn.onclick = () => {
    showVoteDialog();
};

// 투표 다이얼로그 표시
function showVoteDialog() {
    const alivePlayers = Array.from(document.querySelectorAll('.player-card.alive:not(.you):not(.spectator)'))
        .map(card => card.textContent.replace(' (나)', '').replace(' 💀', '').replace(' ❤️', '').replace(' 👀', '').trim());
    
    if (alivePlayers.length === 0) {
        alert("투표할 수 있는 대상이 없습니다.");
        return;
    }

    const target = prompt(`투표할 대상을 선택하세요:\n${alivePlayers.join(', ')}`);
    if (target && alivePlayers.includes(target)) {
        socket.emit("vote", { target });
    }
}

// 밤 행동
function nightAction(target, action) {
    socket.emit("night_action", { target, action });
    document.getElementById("nightActions").classList.add("hidden");
}

// ================================
// 타이머 관련 함수들 (애니메이션 제거)
// ================================

// 타이머 시작 이벤트
socket.on('timer', function(data) {
    console.log('타이머 시작 이벤트 수신:', data);
    currentTimer = data.duration;
    
    ensureTimerElements();
    
    let timerContainer = document.getElementById('timer-container');
    let timerSeconds = document.getElementById('timer-seconds');
    
    if (!timerContainer || !timerSeconds) {
        console.log('타이머 요소가 없어서 재생성합니다...');
        createTimerElement();
        timerContainer = document.getElementById('timer-container');
        timerSeconds = document.getElementById('timer-seconds');
    }
    
    if (timerContainer && timerSeconds) {
        console.log('타이머 시작:', currentTimer, '초');
        timerContainer.style.display = 'block';
        timerSeconds.textContent = currentTimer;
        
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        timerInterval = setInterval(() => {
            currentTimer--;
            timerSeconds.textContent = Math.max(0, currentTimer);
            
            console.log('타이머 업데이트:', currentTimer);
            
            if (currentTimer <= 30) {
                timerSeconds.style.color = '#ff4444';
                timerSeconds.style.fontWeight = 'bold';
                timerSeconds.classList.add('timer-warning');
            } else {
                timerSeconds.style.color = '#fff';
                timerSeconds.style.fontWeight = 'bold';
                timerSeconds.classList.remove('timer-warning');
            }
            
            if (currentTimer <= 0) {
                console.log('타이머 종료');
                clearInterval(timerInterval);
                timerInterval = null;
                timerContainer.style.display = 'none';
            }
        }, 1000);
    } else {
        console.error('타이머 요소를 찾거나 생성할 수 없습니다!');
    }
});

// 타이머 업데이트 이벤트
socket.on('timer_update', function(data) {
    console.log('타이머 업데이트 수신:', data.remaining);
    currentTimer = data.remaining;
    
    const timerSeconds = document.getElementById('timer-seconds');
    const timerContainer = document.getElementById('timer-container');
    
    if (timerSeconds) {
        timerSeconds.textContent = Math.max(0, currentTimer);
        
        if (currentTimer <= 0) {
            if (timerContainer) {
                timerContainer.style.display = 'none';
            }
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        }
    }
});

// UI 업데이트 이벤트
socket.on("ui_update", (data) => {
    updateTheme(data.phase);
});

// 테마 변경 함수 (애니메이션 제거)
function updateTheme(phase) {
    const body = document.body;
    const gameContainer = document.querySelector('.game-container');
    
    body.classList.remove('day-theme', 'night-theme', 'waiting-theme');
    
    switch(phase) {
        case 'day':
            body.classList.add('day-theme');
            if (gameContainer) {
                gameContainer.style.background = 'linear-gradient(135deg, #fff9c4 0%, #ffcc70 100%)';
                gameContainer.style.boxShadow = '0 10px 30px rgba(255,204,112,0.3)';
            }
            break;
        case 'night':
            body.classList.add('night-theme');
            if (gameContainer) {
                gameContainer.style.background = 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)';
                gameContainer.style.boxShadow = '0 10px 30px rgba(44,62,80,0.5)';
                gameContainer.style.color = '#ecf0f1';
            }
            break;
        default:
            body.classList.add('waiting-theme');
            if (gameContainer) {
                gameContainer.style.background = 'white';
                gameContainer.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
                gameContainer.style.color = '#333';
            }
            break;
    }
    
    // 애니메이션 없이 깔끔한 테마 변경을 위한 CSS 추가
    if (!document.getElementById('clean-theme-styles')) {
        const style = document.createElement('style');
        style.id = 'clean-theme-styles';
        style.textContent = `
            .night-theme {
                background: linear-gradient(135deg, #0c1445 0%, #1e3c72 100%) !important;
                color: #ecf0f1 !important;
                transition: all 0.5s ease;
            }
            .night-theme .chat-message {
                background-color: rgba(255,255,255,0.9) !important;
                color: #333 !important;
                border: 1px solid rgba(255,255,255,0.3);
            }
            .night-theme .info-panel {
                background: rgba(255,255,255,0.95) !important;
                color: #333 !important;
                border: 1px solid rgba(255,255,255,0.5) !important;
            }
            .night-theme .player-card {
                background: rgba(255,255,255,0.9) !important;
                color: #333 !important;
                border: 1px solid rgba(255,255,255,0.5) !important;
            }
            .night-theme .role-panel {
                background: rgba(255,255,255,0.95) !important;
                color: #333 !important;
                border: 1px solid rgba(255,255,255,0.5) !important;
            }
            .night-theme .phase-indicator {
                background: rgba(255,255,255,0.9) !important;
                color: #333 !important;
                border: 1px solid rgba(255,255,255,0.5) !important;
            }
            .night-theme .system-message {
                background-color: rgba(255, 243, 205, 0.95) !important;
                color: #856404 !important;
                border: 1px solid #ffeaa7 !important;
            }
            .night-theme .moderator-message {
                background: linear-gradient(135deg, rgba(230, 230, 250, 0.95) 0%, rgba(221, 160, 221, 0.95) 100%) !important;
                color: #4B0082 !important;
                border: 2px solid #8B00FF !important;
            }
            .day-theme {
                background: linear-gradient(135deg, #fff9c4 0%, #ffcc70 100%) !important;
                transition: all 0.5s ease;
            }
        `;
        document.head.appendChild(style);
    }
}

// 마피아 채팅 관련 변수
let mafiaMode = false;

// 마피아 채팅 토글 함수
function toggleMafiaChat() {
    if (myRole !== 'mafia') return;
    
    mafiaMode = !mafiaMode;
    const toggleBtn = document.getElementById('mafia-chat-toggle');
    const chatInput = document.getElementById('message');
    
    if (mafiaMode) {
        toggleBtn.textContent = '🔴 마피아 채팅 (ON)';
        toggleBtn.style.background = '#dc3545';
        chatInput.placeholder = '마피아 전용 채팅 (동료들만 볼 수 있습니다)';
        chatInput.style.background = '#ffe6e6';
    } else {
        toggleBtn.textContent = '🔴 마피아 채팅 (OFF)';
        toggleBtn.style.background = '#6c757d';
        chatInput.placeholder = '메시지를 입력하세요...';
        chatInput.style.background = 'white';
    }
}

// 마피아 채팅 버튼 생성
function createMafiaChatButton() {
    if (myRole !== 'mafia') return;
    
    const inputArea = document.querySelector('.input-area');
    if (!inputArea || document.getElementById('mafia-chat-toggle')) return;
    
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'mafia-chat-toggle';
    toggleBtn.textContent = '🔴 마피아 채팅 (OFF)';
    toggleBtn.className = 'btn btn-secondary';
    toggleBtn.style.cssText = `
        background: #6c757d;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 10px;
        white-space: nowrap;
        transition: all 0.2s ease;
    `;
    toggleBtn.onclick = toggleMafiaChat;
    
    inputArea.appendChild(toggleBtn);
}

// ================================
// 소켓 이벤트들
// ================================

// 채팅 메시지 수신 (애니메이션 제거)
socket.on("chat", (data) => {
    const messageDiv = document.createElement("div");
    
    if (data.is_moderator) {
        // 사회자 메시지 스타일 (애니메이션 제거)
        messageDiv.className = 'chat-message moderator-message';
        messageDiv.innerHTML = `<strong style="color: #8B00FF; font-size: 16px;">🎭 ${data.nickname}:</strong> <span style="color: #4B0082; font-weight: bold;">${data.message}</span>`;
        messageDiv.style.cssText = `
            background: linear-gradient(135deg, #E6E6FA 0%, #DDA0DD 100%);
            border: 2px solid #8B00FF;
            padding: 12px;
            margin: 8px 0;
            border-radius: 8px;
            font-weight: bold;
            box-shadow: 0 4px 8px rgba(139, 0, 255, 0.3);
        `;
    } else {
        // 일반 플레이어 메시지
        messageDiv.className = 'chat-message player-message';
        messageDiv.innerHTML = `<strong>${data.nickname}:</strong> ${data.message}`;
        messageDiv.style.cssText = `
            padding: 8px;
            margin: 4px 0;
            border-radius: 4px;
            background-color: #f8f9fa;
        `;
    }
    
    chat.appendChild(messageDiv);
    chat.scrollTop = chat.scrollHeight;
});

// 시스템 메시지 수신
socket.on("system", (msg) => {
    const messageDiv = document.createElement("div");
    messageDiv.className = "chat-message system-message";
    messageDiv.innerHTML = msg;
    messageDiv.style.cssText = `
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
        padding: 8px;
        margin: 5px 0;
        border-radius: 4px;
        text-align: center;
        font-weight: bold;
    `;
    chat.appendChild(messageDiv);
    chat.scrollTop = chat.scrollHeight;
});

// 역할 정보 수신
socket.on("your_role", (roleData) => {
    myRole = roleData.role;
    const rolePanel = document.getElementById("rolePanel");
    const roleInfo = document.getElementById("roleInfo");
    
    rolePanel.className = `info-panel role-panel ${myRole}`;
    
    let roleText = "";
    switch(myRole) {
        case 'mafia':
            roleText = `당신은 <strong style="color: #dc3545;">마피아</strong>입니다.`;
            break;
        case 'doctor':
            roleText = `당신은 <strong style="color: #28a745;">의사</strong>입니다.`;
            break;
        case 'police':
            roleText = `당신은 <strong style="color: #007bff;">경찰</strong>입니다.`;
            break;
        default:
            roleText = `당신은 <strong style="color: #6c757d;">시민</strong>입니다.`;
            break;
    }
    
    if (myRole === 'mafia' && roleData.teammates.length > 0) {
        roleText += `<br>동료 마피아: ${roleData.teammates.join(', ')}`;
        roleText += `<br><small style="color: #dc3545;">💡 마피아 전용 채팅을 사용할 수 있습니다!</small>`;
    }
    
    roleInfo.innerHTML = roleText;
    gameStarted = true;
    
    // 마피아라면 전용 채팅 버튼 생성
    if (myRole === 'mafia') {
        setTimeout(createMafiaChatButton, 500);
    }
    
    updateUI();
});

// 게임 단계 변경
socket.on("phase", (data) => {
    currentPhase = data.phase;
    const phaseElement = document.getElementById("phase");
    
    phaseElement.className = `phase-indicator phase-${currentPhase}`;
    
    switch(currentPhase) {
        case "waiting":
            phaseElement.textContent = "게임 대기 중...";
            const timerContainer = document.getElementById('timer-container');
            if (timerContainer) {
                timerContainer.style.display = 'none';
            }
            break;
        case "day":
            phaseElement.textContent = "🌞 낮 - 토론 및 투표 시간";
            break;
        case "night":
            phaseElement.textContent = "🌙 밤 - 특수 역할 행동 시간";
            break;
    }
    
    ensureTimerElements();
    updateTheme(currentPhase);
    updateUI();
});

// 플레이어 목록 업데이트
socket.on("player_list", (players) => {
    const playersDiv = document.getElementById("players");
    
    if (players.length === 0) {
        playersDiv.innerHTML = "참여자가 없습니다.";
        return;
    }
    
    const playerCards = players.map(player => {
        const statusIcon = player.alive ? "❤️" : "💀";
        const youIndicator = player.you ? " (나)" : "";
        const spectatorIcon = player.is_spectator ? ' 👀' : '';
        const spectatorClass = player.is_spectator ? 'spectator' : '';
        const cardClass = `player-card ${player.alive ? 'alive' : 'dead'} ${player.you ? 'you' : ''} ${spectatorClass}`;
        
        return `<div class="${cardClass}">${player.nickname}${youIndicator}${spectatorIcon} ${statusIcon}</div>`;
    }).join('');
    
    playersDiv.innerHTML = `<div class="player-list">${playerCards}</div>`;
});

// 밤 대상 목록 수신
socket.on("night_targets", (data) => {
    const targets = data.targets;
    const action = data.action;
    
    const nightActions = document.getElementById("nightActions");
    const nightTargets = document.getElementById("nightTargets");
    
    let actionText = "";
    let buttonClass = "";
    
    switch(action) {
        case "kill":
            actionText = "제거할 대상을 선택하세요 (마피아):";
            buttonClass = "kill-btn";
            break;
        case "heal":
            actionText = "치료할 대상을 선택하세요 (의사):";
            buttonClass = "heal-btn";
            break;
        case "investigate":
            actionText = "조사할 대상을 선택하세요 (경찰):";
            buttonClass = "investigate-btn";
            break;
    }
    
    const actionTitle = document.createElement("h3");
    actionTitle.textContent = actionText;
    actionTitle.style.color = action === "kill" ? "#dc3545" : action === "heal" ? "#28a745" : "#007bff";
    
    nightTargets.innerHTML = "";
    nightTargets.appendChild(actionTitle);
    
    targets.forEach(target => {
        const button = document.createElement("button");
        button.textContent = target;
        button.className = `target-btn ${buttonClass}`;
        button.onclick = () => nightAction(target, action);
        nightTargets.appendChild(button);
    });
    
    nightActions.classList.remove("hidden");
});

// 게임 리셋
socket.on("game_reset", () => {
    myRole = null;
    gameStarted = false;
    currentPhase = "waiting";
    mafiaMode = false; // 마피아 모드 리셋
    
    document.getElementById("roleInfo").innerHTML = "게임이 시작되면 역할이 공개됩니다.";
    document.getElementById("rolePanel").className = "info-panel role-panel";
    document.getElementById("nightActions").classList.add("hidden");
    document.getElementById("chat").innerHTML = "";
    
    // 마피아 채팅 버튼 제거
    const mafiaChatBtn = document.getElementById('mafia-chat-toggle');
    if (mafiaChatBtn) {
        mafiaChatBtn.remove();
    }
    
    // 입력창 초기화
    const chatInput = document.getElementById('message');
    if (chatInput) {
        chatInput.placeholder = '메시지를 입력하세요...';
        chatInput.style.background = 'white';
    }
    
    const timerContainer = document.getElementById('timer-container');
    if (timerContainer) {
        timerContainer.style.display = 'none';
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    updateTheme("waiting");
    updateUI();
});

// UI 업데이트
function updateUI() {
    const startBtn = document.getElementById("startBtn");
    const voteBtn = document.getElementById("voteBtn");
    const nightActions = document.getElementById("nightActions");
    
    // 게임 시작 버튼
    startBtn.classList.toggle("hidden", gameStarted);
    
    // 투표 버튼
    if (currentPhase === "day" && gameStarted) {
        voteBtn.classList.remove("hidden");
    } else {
        voteBtn.classList.add("hidden");
    }
    
    // 밤 행동 패널
    if (currentPhase !== "night" || !gameStarted) {
        nightActions.classList.add("hidden");
    }
}

// 디버깅 함수들
function checkTimerElements() {
    console.log('=== 타이머 요소 상태 확인 ===');
    console.log('timer-container:', document.getElementById('timer-container'));
    console.log('timer-seconds:', document.getElementById('timer-seconds'));
    console.log('phase:', document.getElementById('phase'));
    console.log('현재 게임 상태:', currentPhase);
    console.log('게임 시작됨:', gameStarted);
    console.log('현재 타이머:', currentTimer);
}

function testTimer() {
    console.log('타이머 테스트 시작');
    ensureTimerElements();
    
    const timerContainer = document.getElementById('timer-container');
    const timerSeconds = document.getElementById('timer-seconds');
    
    if (timerContainer && timerSeconds) {
        timerContainer.style.display = 'block';
        
        let testTime = 10;
        timerSeconds.textContent = testTime;
        
        const testInterval = setInterval(() => {
            testTime--;
            timerSeconds.textContent = Math.max(0, testTime);
            
            if (testTime <= 3) {
                timerSeconds.style.color = '#ff4444';
                timerSeconds.classList.add('timer-warning');
            }
            
            if (testTime <= 0) {
                clearInterval(testInterval);
                timerContainer.style.display = 'none';
                timerSeconds.style.color = '#fff';
                timerSeconds.classList.remove('timer-warning');
                console.log('타이머 테스트 완료');
            }
        }, 1000);
    } else {
        console.error('타이머 요소를 찾을 수 없습니다!');
    }
}

// 전역 함수로 등록
window.checkTimerElements = checkTimerElements;
window.testTimer = testTimer;
window.ensureTimerElements = ensureTimerElements;

// 페이지 로드 시 타이머 정보 요청
socket.emit('get_timer');

// 초기 UI 설정
updateUI();