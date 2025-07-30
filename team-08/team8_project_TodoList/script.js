
document.addEventListener('DOMContentLoaded', () => {
  // --- DOM 요소 변수 선언 ---
  const calendarTitle = document.getElementById('calendarTitle');
  const calendar = document.getElementById('calendar');
  const prevMonthBtn = document.getElementById('prevMonth');
  const nextMonthBtn = document.getElementById('nextMonth');
  
  // 모달 관련
  const todoModal = document.getElementById('todoModal');
  const closeModalBtn = document.getElementById('closeModal');
  const modalDate = document.getElementById('modalDate');
  const taskCount = document.getElementById('taskCount');
  const todoList = document.getElementById('todoList');
  
  // 할 일 추가 폼 관련
  const addTodoBtn = document.getElementById('addTodoBtn');
  const todoForm = document.getElementById('todoForm');
  const todoTitle = document.getElementById('todoTitle');
  const todoStart = document.getElementById('todoStart');
  const todoEnd = document.getElementById('todoEnd');
  const todoPriority = document.getElementById('todoPriority');
  const todoEveryday = document.getElementById('todoEveryday');
  const setTimeCheckbox = document.getElementById('setTimeCheckbox');
  const timeInputContainer = document.getElementById('timeInputContainer');

  // 오늘 할 일 리스트 (왼쪽 사이드)
  const todayTodoBox = document.getElementById('todayTodoBox');

  // 캐릭터 관련
  const character = document.getElementById('character');
  const characterLevel = document.getElementById('characterLevel');
  const characterTab = document.getElementById('characterTab');
  const charModal = document.getElementById('charModal');
  const closeCharModal = document.getElementById('closeCharModal');
  const charModalEmoji = document.getElementById('charModalEmoji');
  const charModalLevel = document.getElementById('charModalLevel');
  const charModalExp = document.getElementById('charModalExp');
  const charModalDesc = document.getElementById('charModalDesc');

  // 통계/알림 바
  const statsText = document.getElementById('statsText');
  const alertText = document.getElementById('alertText');

  // --- 데이터 및 상태 변수 ---
  let today = new Date();
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth(); // 0~11
  let currentModalDate = '';

  const STORAGE_KEY = 'todoListAppV1';
  const CHAR_KEY = 'todoListCharV1';
  
  let todoData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  let charData = JSON.parse(localStorage.getItem(CHAR_KEY) || '{"level":1,"exp":0}');
  
  const charEmojis = ["🧑‍💻", "🧑🏻‍💼", "🏋🏻‍♀️", "🧙", "🧙‍♂️", "🦹🏼‍♀️"];
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  // --- 함수 선언 ---

  // 날짜 유틸리티
  function getDateStr(date) {
    return date.toISOString().slice(0, 10);
  }

  function getWeekDates(date) {
    const d = new Date(date);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    return Array.from({length: 7}, (_, i) => {
      const dt = new Date(start);
      dt.setDate(start.getDate() + i);
      return getDateStr(dt);
    });
  }

  function getMonthDates(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({length: daysInMonth}, (_, i) => {
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
    });
  }

  // HTML 이스케이프
  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[tag]));
  }

  // 데이터 저장
  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todoData));
    renderTodayTodoList();
    renderCalendar(currentYear, currentMonth);
    updateStatsAndAlerts();
  }

  function saveChar() {
    localStorage.setItem(CHAR_KEY, JSON.stringify(charData));
    updateCharacterUI();
  }
  
  // 캐릭터 UI 업데이트
  function updateCharacterUI() {
    const emoji = charEmojis[Math.min(charData.level - 1, charEmojis.length - 1)];
    character.textContent = emoji;
    characterLevel.textContent = `Lv.${charData.level} (${charData.exp}/${charData.level * 100} EXP)`;
  }
  
  /**
   * 경험치를 업데이트하고 레벨 업/다운을 처리하는 함수
   * @param {number} amount - 변경할 경험치 양 (양수: 추가, 음수: 차감)
   */
  function updateExp(amount) {
    let leveledUp = false;
    charData.exp += amount;

    // 레벨 업 처리
    while (charData.exp >= charData.level * 100) {
      charData.exp -= charData.level * 100;
      charData.level++;
      leveledUp = true;
    }

    // 레벨 다운 처리
    while (charData.level > 1 && charData.exp < 0) {
      charData.level--; // 레벨을 먼저 내림
      charData.exp += charData.level * 100; // 내린 레벨의 필요 경험치를 더해줌
    }

    // 레벨 1일 때 경험치가 0 미만으로 내려가지 않도록 보정
    if (charData.level === 1 && charData.exp < 0) {
      charData.exp = 0;
    }
    
    saveChar();
    
    if (leveledUp) {
      character.classList.add('animate-bounce');
      setTimeout(() => character.classList.remove('animate-bounce'), 800);
    }
  }


  // 달력 렌더링
  function renderCalendar(year, month) {
    calendar.innerHTML = '';
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    weekDays.forEach((d, i) => {
      const th = document.createElement('div');
      th.textContent = d;
      th.className = 'font-bold py-1';
      if (i === 0) th.classList.add('text-red-500');
      if (i === 6) th.classList.add('text-blue-500');
      calendar.appendChild(th);
    });

    for (let i = 0; i < startDay; i++) {
      calendar.appendChild(document.createElement('div'));
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateBtn = document.createElement('button');
      dateBtn.textContent = d;
      dateBtn.className = 'py-3 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg transition-all relative';
      
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      if (dateStr === getDateStr(new Date())) {
        dateBtn.classList.add('bg-blue-200', 'font-bold');
      }

      if (todoData[dateStr] && todoData[dateStr].length > 0) {
        const hasUndone = todoData[dateStr].some(t => !t.done);
        const dot = document.createElement('span');
        dot.className = `block w-2 h-2 rounded-full mx-auto mt-1 ${hasUndone ? 'bg-red-400' : 'bg-indigo-400'}`;
        dateBtn.appendChild(dot);
      }
      
      dateBtn.addEventListener('click', () => openTodoModal(year, month, d));
      calendar.appendChild(dateBtn);
    }
    
    calendarTitle.textContent = `${year}년 ${month + 1}월`;
  }
  
  // 모달 내 할 일 목록 렌더링
  function renderTodoList(dateStr) {
    const todos = todoData[dateStr] || [];
    todoList.innerHTML = '';
    taskCount.textContent = `${todos.length} task${todos.length !== 1 ? 's' : ''}`;

    if (todos.length === 0) {
      todoList.innerHTML = '<div class="text-gray-400 text-center py-8">할 일이 없습니다.</div>';
      return;
    }
    
    todos.forEach(todo => {
      const row = document.createElement('div');
      row.className = 'flex items-center gap-3 py-2 group';

      const check = document.createElement('button');
      check.className = `w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mr-1 ${todo.done ? 'border-indigo-400 bg-indigo-400' : 'border-gray-300 bg-white'} transition-all`;
      check.innerHTML = todo.done ? '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : '';
      check.addEventListener('click', () => {
        todo.done = !todo.done; // 상태 먼저 변경
        updateExp(todo.done ? 20 : -20); // 변경된 상태에 따라 경험치 업데이트
        saveTodos();
        renderTodoList(dateStr);
      });
      row.appendChild(check);

      const info = document.createElement('div');
      info.className = 'flex-1 min-w-0';
      info.innerHTML = `<span class="${todo.done ? 'line-through text-gray-400' : 'font-medium text-gray-800'}">${escapeHtml(todo.title)}</span>`;
      if (todo.start) {
        info.innerHTML += `<span class="ml-2 text-xs text-gray-400 float-right">${todo.start}${todo.end ? ' ~ ' + todo.end : ''}</span>`;
      }
      row.appendChild(info);

      const priorityColors = { '1': 'bg-gray-300', '2': 'bg-yellow-300', '3': 'bg-red-400' };
      const prio = document.createElement('span');
      prio.className = `w-2 h-2 rounded-full ml-2 ${priorityColors[todo.priority]}`;
      row.appendChild(prio);

      const delBtn = document.createElement('button');
      delBtn.className = 'ml-2 text-gray-300 hover:text-red-400 text-xl opacity-0 group-hover:opacity-100 transition-all';
      delBtn.innerHTML = '&times;';
      delBtn.addEventListener('click', () => {
        // 모든 삭제는 팝업을 통해 일관되게 처리
        showDeletePopup(todo, dateStr);
      });
      row.appendChild(delBtn);

      todoList.appendChild(row);
    });
  }

  // 오늘 할 일 리스트 렌더링
  function renderTodayTodoList() {
    const todayStr = getDateStr(new Date());
    const todos = todoData[todayStr] || [];
    todayTodoBox.innerHTML = '';

    if (todos.length === 0) {
      todayTodoBox.innerHTML = '<div class="text-gray-400 text-center py-4">오늘 할 일이 없습니다.</div>';
      return;
    }

    todos.forEach(todo => {
      const row = document.createElement('div');
      row.className = 'flex items-center gap-2 py-1 group';
      
      const check = document.createElement('button');
      check.className = `w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${todo.done ? 'border-indigo-400 bg-indigo-400' : 'border-gray-300 bg-white'} transition-all`;
      check.innerHTML = todo.done ? '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : '';
      check.addEventListener('click', () => {
        todo.done = !todo.done; // 상태 먼저 변경
        updateExp(todo.done ? 20 : -20); // 변경된 상태에 따라 경험치 업데이트
        saveTodos();
        if(currentModalDate === todayStr) renderTodoList(todayStr);
      });
      row.appendChild(check);

      const info = document.createElement('div');
      info.className = 'flex-1 min-w-0';
      let html = `<span class="${todo.done ? 'line-through text-gray-400' : 'font-medium text-gray-800'}">${escapeHtml(todo.title)}</span>`;
      if(todo.everyday) html += ' <span class="px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-500 rounded-full">매일</span>';
      if (todo.start) html += `<span class="ml-2 text-xs text-gray-400 float-right">${todo.start}</span>`;
      info.innerHTML = html;
      row.appendChild(info);

      const delBtn = document.createElement('button');
      delBtn.className = 'ml-1 text-gray-300 hover:text-red-400 text-lg opacity-0 group-hover:opacity-100';
      delBtn.innerHTML = '&times;';
      delBtn.addEventListener('click', () => showDeletePopup(todo, todayStr));
      row.appendChild(delBtn);
      
      todayTodoBox.appendChild(row);
    });
  }

  // 할 일 삭제 팝업
  function showDeletePopup(todo, dateStr) {
    if (document.getElementById('deletePopup')) return;
    
    const isRecurring = todo.everyday;
    const popup = document.createElement('div');
    popup.id = 'deletePopup';
    popup.className = 'fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50';
    
    let buttonsHtml = `<button class="px-4 py-2 bg-red-500 text-white rounded" id="delThis">삭제</button>
                       <button class="px-4 py-2 bg-gray-300 text-gray-700 rounded" id="delCancel">취소</button>`;
    if (isRecurring) {
      buttonsHtml = `<button class="px-4 py-2 bg-red-500 text-white rounded" id="delAll">전체 반복 삭제</button>
                     <button class="px-4 py-2 bg-blue-500 text-white rounded" id="delThis">오늘만 삭제</button>
                     <button class="px-4 py-2 bg-gray-300 text-gray-700 rounded" id="delCancel">취소</button>`;
    }
    
    popup.innerHTML = `<div class="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-3 items-center">
      <div class="text-lg font-bold mb-2">할 일 삭제</div>
      <div class="text-base">${isRecurring ? "반복되는 할 일입니다. 어떻게 삭제하시겠습니까?" : "삭제하시겠습니까?"}</div>
      <div class="flex gap-3 mt-2">${buttonsHtml}</div>
    </div>`;
    document.body.appendChild(popup);
    
    const removePopup = () => document.body.removeChild(popup);

    if (isRecurring) {
      popup.querySelector('#delAll').onclick = () => {
        let completedCount = 0;
        Object.keys(todoData).forEach(key => {
          const recurringTasks = todoData[key].filter(t => t.title === todo.title && t.everyday);
          recurringTasks.forEach(t => {
            if (t.done) completedCount++;
          });
        });
        if (completedCount > 0) updateExp(-20 * completedCount);
        
        Object.keys(todoData).forEach(key => {
          todoData[key] = todoData[key].filter(t => !(t.title === todo.title && t.everyday));
        });
        
        saveTodos();
        if(currentModalDate) renderTodoList(currentModalDate);
        removePopup();
      };
    }

    popup.querySelector('#delThis').onclick = () => {
      const taskToDelete = (todoData[dateStr] || []).find(t => t.id === todo.id);
      if (taskToDelete && taskToDelete.done) {
        updateExp(-20);
      }

      todoData[dateStr] = (todoData[dateStr] || []).filter(t => t.id !== todo.id);
      
      saveTodos();
      if(currentModalDate) renderTodoList(currentModalDate);
      removePopup();
    };
    
    popup.querySelector('#delCancel').onclick = removePopup;
  }

  // 팝업 열기
  function openTodoModal(year, month, day) {
    todoModal.classList.remove('hidden');
    currentModalDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const d = new Date(currentModalDate);
    modalDate.textContent = d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    
    todoForm.reset();
    todoForm.classList.add('hidden');
    addTodoBtn.classList.remove('hidden');
    timeInputContainer.classList.add('hidden');
    setTimeCheckbox.checked = false;

    renderTodoList(currentModalDate);
  }
  
  // 통계/알림 업데이트
  function updateStatsAndAlerts() {
    const weekDates = getWeekDates(new Date());
    let weekTotal = 0, weekDone = 0;
    weekDates.forEach(dateStr => {
      if (todoData[dateStr]) {
        weekTotal += todoData[dateStr].length;
        weekDone += todoData[dateStr].filter(t => t.done).length;
      }
    });
    const weekRate = weekTotal ? Math.round(weekDone / weekTotal * 100) : 0;

    const monthDates = getMonthDates(new Date());
    let monthTotal = 0, monthDone = 0;
    monthDates.forEach(dateStr => {
      if (todoData[dateStr]) {
        monthTotal += todoData[dateStr].length;
        monthDone += todoData[dateStr].filter(t => t.done).length;
      }
    });
    const monthRate = monthTotal ? Math.round(monthDone / monthTotal * 100) : 0;
    
    statsText.innerHTML = `이번 주: <b>${weekRate}%</b> (${weekDone}/${weekTotal}) / 이번 달: <b>${monthRate}%</b> (${monthDone}/${monthTotal})`;

    let alerts = [];
    const todayStr = getDateStr(new Date());
    const now = new Date();
    if (todoData[todayStr]) {
      const undone = todoData[todayStr].filter(t => !t.done);
      if(undone.length > 0) alerts.push(`오늘 할 일이 ${undone.length}개 남았어요!`);

      undone.forEach(t => {
        if (t.start) {
          const [h,m] = t.start.split(':');
          const taskTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), +h, +m);
          const diff = (taskTime - now) / 60000;
          if (diff >= 0 && diff <= 60) {
            alerts.push(`곧 시작: ${t.title} (${t.start})`);
          }
        }
      });
    } else {
      alerts.push('오늘 할 일을 추가해보세요!');
    }
    alertText.innerHTML = alerts.join('<br>');
  }

  // 캐릭터 모달 열기/닫기
  function openCharModal() {
    charModalEmoji.textContent = charEmojis[Math.min(charData.level-1, charEmojis.length-1)];
    charModalLevel.textContent = `Lv.${charData.level}`;
    charModalExp.textContent = `${charData.exp} / ${charData.level*100} EXP`;
    charModalDesc.textContent = '할 일을 완료해서 캐릭터를 성장시켜보세요!';
    charModal.classList.remove('hidden');
  }

  // --- 이벤트 리스너 ---

  prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar(currentYear, currentMonth);
  });
  nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar(currentYear, currentMonth);
  });

  closeModalBtn.addEventListener('click', () => todoModal.classList.add('hidden'));
  todoModal.addEventListener('click', (e) => {
    if (e.target === todoModal) todoModal.classList.add('hidden');
  });

  addTodoBtn.addEventListener('click', () => {
    addTodoBtn.classList.add('hidden');
    todoForm.classList.remove('hidden');
    todoTitle.focus();
  });
  
  setTimeCheckbox.addEventListener('change', () => {
    timeInputContainer.classList.toggle('hidden', !setTimeCheckbox.checked);
  });

  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTodo = {
      id: Date.now(),
      title: todoTitle.value,
      start: setTimeCheckbox.checked ? todoStart.value : '',
      end: setTimeCheckbox.checked ? todoEnd.value : '',
      priority: todoPriority.value,
      done: false,
      everyday: todoEveryday.checked,
      createdAt: new Date().toISOString()
    };
    
    if (newTodo.everyday) {
      const d = new Date(currentYear, currentMonth, 1);
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        if (!todoData[dateStr]) todoData[dateStr] = [];
        todoData[dateStr].push({ ...newTodo, id: Date.now() + i }); 
      }
    } else {
      if (!todoData[currentModalDate]) todoData[currentModalDate] = [];
      todoData[currentModalDate].push(newTodo);
    }

    saveTodos();
    renderTodoList(currentModalDate);
    
    todoForm.classList.add('hidden');
    addTodoBtn.classList.remove('hidden');
    todoForm.reset();
    timeInputContainer.classList.add('hidden');
  });
  
  characterTab.addEventListener('click', openCharModal);
  closeCharModal.addEventListener('click', () => charModal.classList.add('hidden'));
  charModal.addEventListener('click', (e) => {
      if (e.target === charModal) charModal.classList.add('hidden');
  });

  // --- 최초 실행 ---
  renderCalendar(currentYear, currentMonth);
  renderTodayTodoList();
  updateCharacterUI();
  updateStatsAndAlerts();
  setInterval(updateStatsAndAlerts, 60000);
});