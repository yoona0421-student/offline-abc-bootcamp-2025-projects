document.addEventListener('DOMContentLoaded', () => {
  const emotionData = {
    '행복': { color: ['#fceabb', '#f8b500'], emoji: '😄', message: '오늘도 활짝 웃는 하루였어요!', effectEmoji: '✨', effectColor: 'yellow' },
    '화남': { color: ['#ff6b6b', '#ff4e50'], emoji: '😡', message: '오늘은 화가 나는 일이 있었어요.', effectEmoji: '🔥', effectColor: 'red' },
    '평온': { color: ['#74ebd5', '#acb6e5'], emoji: '😌', message: '오늘은 마음이 고요하고 차분했어요.', effectEmoji: '🍃', effectColor: 'lightgreen' },
    '불안': { color: ['#bdc3c7', '#2c3e50'], emoji: '😟', message: '불안한 하루였지만 잘 버텼어요.', effectEmoji: '💭', effectColor: 'gray' },
    '피곤': { color: ['#b2fefa', '#0ed2f7'], emoji: '😩', message: '몸도 마음도 많이 지친 하루예요.', effectEmoji: '😴', effectColor: 'skyblue' },
    '설렘': { color: ['#fbc2eb', '#a6c1ee'], emoji: '😍', message: '설레는 일이 있었던 하루예요!', effectEmoji: '💓', effectColor: 'pink' },
    '외로움': { color: ['#536976', '#292e49'], emoji: '😔', message: '오늘은 조금 외로운 하루였어요.', effectEmoji: '🌙', effectColor: '#4b6584' },
    '활력': { color: ['#f5f7fa', '#c3cfe2'], emoji: '💪', message: '에너지가 넘치는 하루였어요!', effectEmoji: '⚡', effectColor: '#00cec9' },
    '걱정': { color: ['#89f7fe', '#66a6ff'], emoji: '😰', message: '걱정이 많았던 하루였어요.', effectEmoji: '💧', effectColor: '#0984e3' },
    '지루함': { color: ['#dcdde1', '#a4b0be'], emoji: '😐', message: '특별한 일 없이 조용히 지나간 하루예요.', effectEmoji: '😑', effectColor: 'silver' }
  };

  const encouragementMessages = [
    "오늘 하루도 수고했어요 🌟", "당신의 감정은 소중해요 💖", "지금 이대로도 충분히 잘하고 있어요!",
    "감정을 표현한 당신, 정말 용감해요!", "당신의 하루를 응원해요 💪", "하루하루가 모여 멋진 내가 돼요 ✨",
    "감정은 흘러가고, 당신은 더 단단해져요.", "오늘도 나에게 집중해줘서 고마워요 🧠"
  ];

  const dailyQuotes = [
    "감정은 지나가고, 나 자신은 남는다. – Eckhart Tolle",
    "당신이 느끼는 감정은 당신이 살아 있다는 증거입니다.",
    "감정을 억누르지 마세요. 감정은 소중한 나의 일부입니다.",
    "행복은 감정이 아니라 습관입니다.",
    "기분은 바뀌어도, 나의 가치는 변하지 않아요.",
    "불안은 나를 지키기 위한 몸의 반응일 뿐이에요.",
    "감정은 나의 방향이지, 나의 운명이 아니에요. – Brené Brown"
  ];

  const buttons = document.querySelectorAll('.emotion');
  const velocities = [];

  buttons.forEach((button, index) => {
    const emotion = button.dataset.emotion;
    const data = emotionData[emotion];

    // 무작위 위치, 느린 속도
    button.style.position = 'absolute';
    button.style.left = `${Math.random() * (window.innerWidth - 100)}px`;
    button.style.top = `${Math.random() * (window.innerHeight - 100)}px`;

    velocities[index] = {
      dx: (Math.random() * 0. + 0.1) * (Math.random() < 0.5 ? -1 : 1),
      dy: (Math.random() * 0.4 + 0.1) * (Math.random() < 0.5 ? -1 : 1)
    };

    // 감정 클릭 시 화면 전환
    button.addEventListener('click', () => {
      showEmotion(data);
      document.querySelector('.emotion-buttons').style.display = 'none';
      document.querySelector('.emotion-display').style.display = 'block';
    });

    // 마우스 hover 시 폭죽 효과 반복
    let hoverInterval;
    button.addEventListener('mouseenter', () => {
      hoverInterval = setInterval(() => explodeParticles(button, data), 300);
    });
    button.addEventListener('mouseleave', () => {
      clearInterval(hoverInterval);
    });
  });

  function moveButtons() {
    buttons.forEach((btn, i) => {
      let x = parseFloat(btn.style.left);
      let y = parseFloat(btn.style.top);
      const rect = btn.getBoundingClientRect();

      if (x + velocities[i].dx < 0 || x + rect.width + velocities[i].dx > window.innerWidth)
        velocities[i].dx *= -1;
      if (y + velocities[i].dy < 0 || y + rect.height + velocities[i].dy > window.innerHeight)
        velocities[i].dy *= -1;

      x += velocities[i].dx;
      y += velocities[i].dy;
      btn.style.left = `${x}px`;
      btn.style.top = `${y}px`;
    });
    requestAnimationFrame(moveButtons);
  }
  moveButtons();

  function showEmotion(data) {
    document.body.style.background = `linear-gradient(to bottom, ${data.color[0]}, ${data.color[1]})`;
    document.getElementById('emoji').textContent = data.emoji;
    document.getElementById('message').textContent = data.message;
    document.getElementById('cheer').textContent = randomPick(encouragementMessages);
    document.getElementById('quote').textContent = randomPick(dailyQuotes);
    launchFloatingEmojis(data.effectEmoji);
  }

  function launchFloatingEmojis(emoji) {
    for (let i = 0; i < 15; i++) {
      const el = document.createElement('div');
      el.className = 'floating-emoji';
      el.textContent = emoji;
      el.style.left = `${Math.random() * window.innerWidth}px`;
      el.style.top = `${Math.random() * window.innerHeight}px`;
      el.style.fontSize = `${Math.random() * 24 + 24}px`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }
  }

  function explodeParticles(button, data) {
    const centerX = button.getBoundingClientRect().left + button.offsetWidth / 2;
    const centerY = button.getBoundingClientRect().top + button.offsetHeight / 2;

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'emoji-particle';
      particle.textContent = data.effectEmoji;
      particle.style.left = `${centerX}px`;
      particle.style.top = `${centerY}px`;
      particle.style.color = data.effectColor;

      document.body.appendChild(particle);

      // 폭죽 각도와 거리
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * 80 + 30;
      const dx = distance * Math.cos(angle);
      const dy = distance * Math.sin(angle);

      // 이동 효과
      requestAnimationFrame(() => {
        particle.style.transform = `translate(${dx}px, ${dy}px) scale(1.5)`;
        particle.style.opacity = '0';
      });

      setTimeout(() => particle.remove(), 1200);
    }
  }

  function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
});

// 뒤로가기 버튼 이벤트
document.getElementById('back-button').addEventListener('click', () => {
  document.querySelector('.emotion-buttons').style.display = 'block';
  document.querySelector('.emotion-display').style.display = 'none';
  document.getElementById('emoji').textContent = '';
  document.getElementById('message').textContent = '';
  document.getElementById('cheer').textContent = '';
  document.getElementById('quote').textContent = '';
  document.body.style.background = 'linear-gradient(-45deg, #fceabb, #fbc2eb, #a6c1ee, #8ec5fc)';
});

// 감정 이모지 매핑 (일부만 정의, 나머지는 기본)
const emojiMap = {
  '감동': '🥹',
  '뿌듯함': '😌',
  '두려움': '😱',
  '사랑': '❤️',
  '놀람': '😮',
  '짜증': '😤',
  '긴장': '😬',
  '의욕': '🔥',
};

document.getElementById('add-emotion-button').addEventListener('click', () => {
  const input = document.getElementById('custom-emotion-input');
  const emotionText = input.value.trim();
  if (!emotionText) return;

  // 이모지 매핑이 있으면 가져오고 없으면 기본
  const emoji = emojiMap[emotionText] || '🙂';
  const data = {
    color: ['#fffbd5', '#b20a2c'],
    emoji: emoji,
    message: `오늘은 '${emotionText}'의 감정을 느꼈어요.`,
    effectEmoji: emoji,
    effectColor: 'orange'
  };

  const newBtn = document.createElement('button');
  newBtn.className = 'emotion';
  newBtn.dataset.emotion = emotionText;
  newBtn.textContent = `${emoji} ${emotionText}`;
  document.querySelector('.emotion-buttons').appendChild(newBtn);

  const idx = document.querySelectorAll('.emotion').length - 1;
  newBtn.style.position = 'absolute';
  newBtn.style.left = `${Math.random() * (window.innerWidth - 100)}px`;
  newBtn.style.top = `${Math.random() * (window.innerHeight - 100)}px`;

  velocities[idx] = {
    dx: (Math.random() * 0.5 + 0.1) * (Math.random() < 0.5 ? -1 : 1),
    dy: (Math.random() * 0.4 + 0.1) * (Math.random() < 0.5 ? -1 : 1)
  };

  // 클릭 및 hover 이벤트 부여
  newBtn.addEventListener('click', () => {
    showEmotion(data);
    document.querySelector('.emotion-buttons').style.display = 'none';
    document.querySelector('.emotion-display').style.display = 'block';
  });
  let hoverInterval;
  newBtn.addEventListener('mouseenter', () => {
    hoverInterval = setInterval(() => explodeParticles(newBtn, data), 300);
  });
  newBtn.addEventListener('mouseleave', () => {
    clearInterval(hoverInterval);
  });

  input.value = '';
});

