const form = document.getElementById('scheduleForm');
const roleSelect = document.getElementById('role');
const priorityList = document.getElementById('priorityList');
const tasksDiv = document.getElementById('tasks');
const addTaskBtn = document.getElementById('addTask');

let schedules = [];

// 신분별 중요도 및 유형
const rolePriority = {
    elementary: { keyword: '공부', priority: 2 },
    middle: { keyword: '공부', priority: 3 },
    high: { keyword: '공부', priority: 4 },
    university: { keyword: '리포트', priority: 3 },
    graduate: { keyword: '연구', priority: 4 },
    worker: { keyword: '업무', priority: 3 },
    freelancer: { keyword: '프로젝트', priority: 3 },
    etc: { keyword: '기타', priority: 1 }
};

// 일정명에 따라 예상 시간 자동 추정 (간단 예시)
function predictTime(task) {
    if (task.includes('수학')) return 60;
    if (task.includes('사회')) return 40;
    if (task.includes('영어')) return 30;
    if (task.includes('리포트')) return 90;
    if (task.includes('업무')) return 80;
    if (task.includes('독서')) return 45;
    if (task.length >= 10) return 60;
    return 30;
}

// 일정 입력란 추가 함수
function addTaskInput(value = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'task-input-wrapper';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-input';
    input.placeholder = '일정을 입력하세요';
    input.value = value;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '삭제';
    removeBtn.onclick = () => tasksDiv.removeChild(wrapper);
    wrapper.appendChild(input);
    wrapper.appendChild(removeBtn);
    tasksDiv.appendChild(wrapper);
}

addTaskBtn.addEventListener('click', () => addTaskInput());

// 최초 1개 입력란 생성
addTaskInput();

form.addEventListener('submit', function(e) {
    e.preventDefault();
    const role = roleSelect.value;
    const taskInputs = Array.from(document.querySelectorAll('.task-input'));
    schedules = [];
    taskInputs.forEach(input => {
        const task = input.value.trim();
        if (!task) return;
        const duration = predictTime(task);
        const { keyword, priority } = rolePriority[role] || { keyword: '기타', priority: 1 };
        schedules.push({ role, task, duration, priority, type: keyword });
    });

    // 우선순위에 따라 정렬
    schedules.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.duration - b.duration;
    });

    // 로컬 스토리지에 일정 데이터 저장
    localStorage.setItem('schedules', JSON.stringify(schedules));
    // 새로운 페이지로 이동
    window.location.href = 'priority.html';
});

function renderList() {
    // 중요도, 소요시간 기준 정렬
    schedules.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.duration - b.duration;
    });
    priorityList.innerHTML = '';
    schedules.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `[${item.type}] ${item.task} - 예상 ${item.duration}분`;
        priorityList.appendChild(li);
    });
}

document.getElementById('goToPriorityPage').addEventListener('click', () => {
    window.location.href = 'emotion-analysis.html';
});

document.getElementById('showMySchedule').addEventListener('click', () => {
    const myScheduleDiv = document.getElementById('mySchedule');
    const schedules = JSON.parse(localStorage.getItem('schedules')) || [];
    myScheduleDiv.innerHTML = '';
    schedules.forEach(item => {
        const p = document.createElement('p');
        p.textContent = `[${item.type}] ${item.task} - 예상 ${item.duration}분`;
        myScheduleDiv.appendChild(p);
    });
    myScheduleDiv.classList.remove('hidden');
});

