// script.js

document.addEventListener('DOMContentLoaded', () => {
  const emotionData = {
    '행복': { color: ['#fceabb', '#f8b500'], emoji: '😄', message: '오늘도 활짝 웃는 하루였어요!' },
    '화남': { color: ['#ff6b6b', '#ff4e50'], emoji: '😡', message: '오늘은 화가 나는 일이 있었어요.' },
    '평온': { color: ['#74ebd5', '#acb6e5'], emoji: '😌', message: '오늘은 마음이 고요하고 차분했어요.' },
    '불안': { color: ['#bdc3c7', '#2c3e50'], emoji: '😟', message: '불안한 하루였지만 잘 버텼어요.' },
    '피곤': { color: ['#b2fefa', '#0ed2f7'], emoji: '😩', message: '몸도 마음도 많이 지친 하루예요.' },
    '설렘': { color: ['#fbc2eb', '#a6c1ee'], emoji: '😍', message: '설레는 일이 있었던 하루예요!' },
    '외로움': { color: ['#536976', '#292e49'], emoji: '😔', message: '오늘은 조금 외로운 하루였어요.' },
    '활력': { color: ['#f5f7fa', '#c3cfe2'], emoji: '💪', message: '에너지가 넘치는 하루였어요!' },
    '걱정': { color: ['#89f7fe', '#66a6ff'], emoji: '😰', message: '걱정이 많았던 하루였어요.' },
    '지루함': { color: ['#dcdde1', '#a4b0be'], emoji: '😐', message: '특별한 일 없이 조용히 지나간 하루예요.' }
  };

  const encouragementMessages = [
    "오늘 하루도 수고했어요 🌟",
    "당신의 감정은 소중해요 💖",
    "지금 이대로도 충분히 잘하고 있어요!",
    "감정을 표현한 당신, 정말 용감해요!",
    "당신의 하루를 응원해요 💪",
    "하루하루가 모여 멋진 내가 돼요 ✨",
    "감정은 흘러가고, 당신은 더 단단해져요.",
    "오늘도 나에게 집중해줘서 고마워요 🧠"
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
  const container = document.getElementById('floating-words');

  buttons.forEach((button, index) => {
    const selected = button.dataset.emotion;
    const data = emotionData[selected];

    // 무작위 초기 위치 및 속도 설정
    button.style.position = 'absolute';
    button.style.left = `${Math.random() * (window.innerWidth - 100)}px`;
    button.style.top = `${Math.random() * (window.innerHeight - 100)}px`;
    velocities[index] = {
      dx: (Math.random() * 2 + 1) * (Math.random() < 0.5 ? -1 : 1),
      dy: (Math.random() * 2 + 1) * (Math.random() < 0.5 ? -1 : 1)
    };

    button.addEventListener('click', () => {
      const today = new Date().toISOString().slice(0, 10);
      showEmotion(data);
      localStorage.setItem('emotion', selected);
      localStorage.setItem('emotionDate', today);
    });

    let effectInterval;
    button.addEventListener('mouseenter', () => {
      effectInterval = setInterval(() => triggerEffect(button, selected), 400);
    });

    button.addEventListener('mouseleave', () => {
      clearInterval(effectInterval);
    });
  });

  function moveButtons() {
    buttons.forEach((button, i) => {
      const rect = button.getBoundingClientRect();
      let x = rect.left + velocities[i].dx;
      let y = rect.top + velocities[i].dy;

      if (x <= 0 || x + rect.width >= window.innerWidth) velocities[i].dx *= -1;
      if (y <= 0 || y + rect.height >= window.innerHeight) velocities[i].dy *= -1;

      button.style.left = `${x}px`;
      button.style.top = `${y}px`;
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
    launchFloatingEmojis(data.emoji);
    setTimeout(() => {
      document.body.style.background = 'linear-gradient(-45deg, #fceabb, #fbc2eb, #a6c1ee, #8ec5fc)';
    }, 5000);
  }

  function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function launchFloatingEmojis(baseEmoji) {
    for (let i = 0; i < 15; i++) {
      const emoji = document.createElement('div');
      emoji.className = 'floating-emoji';
      emoji.textContent = baseEmoji;
      emoji.style.left = Math.random() * window.innerWidth + 'px';
      emoji.style.top = Math.random() * window.innerHeight + 'px';
      emoji.style.fontSize = (Math.random() * 24 + 24) + 'px';
      document.body.appendChild(emoji);
      setTimeout(() => emoji.remove(), 3000);
    }
  }

  function triggerEffect(button, emotion) {
    const effect = document.createElement('div');
    effect.className = 'emotion-effect';
    effect.style.position = 'fixed';
    effect.style.pointerEvents = 'none';
    effect.style.opacity = 1;
    effect.style.transition = 'opacity 1.5s ease-out';

    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    effect.style.left = `${x - 100}px`;
    effect.style.top = `${y - 100}px`;
    effect.style.width = '200px';
    effect.style.height = '200px';

    if (emotion === '화남') {
      effect.style.background = 'repeating-linear-gradient(45deg, red, red 10px, transparent 10px, transparent 20px)';
    } else if (emotion === '슬픔') {
      effect.style.background = 'radial-gradient(ellipse at top, #a0c4ff 0%, transparent 80%)';
    } else {
      effect.style.background = 'radial-gradient(circle, rgba(255,255,255,0.3), transparent)';
    }

    document.body.appendChild(effect);
    setTimeout(() => {
      effect.style.opacity = 0;
      setTimeout(() => effect.remove(), 1500);
    }, 100);
  }
});