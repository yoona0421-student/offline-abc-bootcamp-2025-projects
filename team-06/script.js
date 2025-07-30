document.addEventListener('DOMContentLoaded', () => {
    // --- 상태, 상수 및 모의 데이터 ---
    let currentMukpatId = null;
    // 서버 대신 사용할 로컬 모의(Mock) 데이터
    let mockMukpats = [
        {
            "_id": "1", "title": "점심에 텐동 드실 분!", "description": "바삭한 텐동과 함께 즐거운 점심시간 보내실 분 구합니다. 이야기 나누는 것도 환영해요!",
            "paymentInfo": { "paymentMethod": "DUTCH_PAY", "estimatedCost": 15000 }, "mood": "수다 환영",
            "date": "2025-08-15", "time": "12:30", "place": "강남역 텐동집",
            "maxAttendees": 4, "currentAttendees": 2, "ageMin": 20, "ageMax": 35,
            "kakaoLink": "https://open.kakao.com/o/gABCDEFG", "tags": ["점심", "일식", "강남"], "status": "RECRUITING", "createdAt": "2025-07-29T12:00:00.000Z"
        },
        {
            "_id": "2", "title": "저녁에 치맥 하실 분 찾아요!", "description": "프로젝트 끝나고 시원하게 치맥 한잔 하실 분? 제가 쏩니다!",
            "paymentInfo": { "paymentMethod": "CREATOR_PAYS", "estimatedCost": 25000 }, "mood": "활기찬",
            "date": "2025-08-16", "time": "19:00", "place": "홍대입구역 치킨집",
            "maxAttendees": 6, "currentAttendees": 6, "ageMin": 25, "ageMax": 40,
            "kakaoLink": "https://open.kakao.com/o/gHIJKLMN", "tags": ["저녁", "치맥", "홍대"], "status": "FULL", "createdAt": "2025-07-28T18:00:00.000Z"
        },
        {
            "_id": "3", "title": "주말에 같이 코딩하고 커피 마셔요", "description": "조용한 카페에서 각자 코딩하고 커피 마시면서 개발 이야기 나눌 분들 모십니다.",
            "paymentInfo": { "paymentMethod": "DUTCH_PAY", "estimatedCost": 8000 }, "mood": "스터디 위주",
            "date": "2025-08-17", "time": "14:00", "place": "판교 스타벅스",
            "maxAttendees": 5, "currentAttendees": 3, "ageMin": 20, "ageMax": 99,
            "kakaoLink": "https://open.kakao.com/o/gOPQRSTU", "tags": ["주말", "스터디", "커피"], "status": "RECRUITING", "createdAt": "2025-07-27T10:00:00.000Z"
        }
    ];

    // --- DOM 요소 캐싱 ---
    const views = { list: document.getElementById('list-view'), form: document.getElementById('form-view'), detail: document.getElementById('detail-view'), };
    const mukpatList = document.getElementById('mukpat-list');
    const mukpatForm = document.getElementById('mukpat-form');
    const formTitle = document.getElementById('form-title');
    const filterForm = document.getElementById('filter-form');

    // --- 유틸리티 함수 ---
    const switchView = (viewName, mukpatId = null) => {
        currentMukpatId = mukpatId;
        Object.keys(views).forEach(key => views[key].classList.toggle('active', key === viewName));
        window.scrollTo(0, 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '날짜 미정';
        return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(dateString));
    };

    const getStatusInfo = (mukpat) => {
        if (mukpat.status === 'FULL' || mukpat.currentAttendees >= mukpat.maxAttendees) return { text: '모집완료', className: 'full' };
        return { text: '모집중', className: 'recruiting' };
    };

    // --- 렌더링 함수 ---
    const renderMukpatList = (mukpats) => {
        mukpatList.innerHTML = '';
        if (mukpats.length === 0) {
            mukpatList.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">조건에 맞는 잇팟이 없어요. 첫 잇팟을 만들어보세요!</p>';
            return;
        }
        mukpats.forEach(mukpat => {
            const status = getStatusInfo(mukpat);
            const item = document.createElement('div');
            item.className = 'card-item';
            item.dataset.id = mukpat._id;
            item.innerHTML = `
                <div class="card-header">
                    <span class="status-badge ${status.className}">${status.text}</span>
                    <span style="font-size:0.8rem; color:var(--text-secondary);">${new Date(mukpat.createdAt).toLocaleDateString()}</span>
                </div>
                <h3>${mukpat.title}</h3>
                <p><i class="fa-regular fa-calendar"></i> ${formatDate(mukpat.date)} ${mukpat.time}</p>
                <p><i class="fa-solid fa-location-dot"></i> ${mukpat.place}</p>
                <p><i class="fa-solid fa-users"></i> ${mukpat.currentAttendees} / ${mukpat.maxAttendees}명</p>`;
            mukpatList.appendChild(item);
        });
    };

    const renderDetailView = (mukpat) => {
        const paymentMethodText = mukpat.paymentInfo.paymentMethod === 'DUTCH_PAY' ? 'N빵' : '방장이 쏜다!';
        
        views.detail.innerHTML = `
            <header class="view-header"><button class="back-btn"><i class="fa-solid fa-arrow-left"></i></button></header>
            <main class="glass-card">
                <div class="map-placeholder">
                    <img src="map-image.jpg" alt="잇팟 모임 장소 대표 이미지">
                </div>
                <div class="detail-content">
                    <h2>${mukpat.title}</h2>
                    <p class="description">${mukpat.description || '상세 설명이 없습니다.'}</p>
                    <div class="detail-info-grid">
                        <div class="info-item"><span class="label">날짜</span><div class="value"><i class="fa-regular fa-calendar"></i>${formatDate(mukpat.date)} ${mukpat.time}</div></div>
                        <div class="info-item"><span class="label">장소</span><div class="value"><i class="fa-solid fa-location-dot"></i>${mukpat.place}</div></div>
                        <div class="info-item"><span class="label">모집 현황</span><div class="value"><i class="fa-solid fa-users"></i>${mukpat.currentAttendees} / ${mukpat.maxAttendees}명</div></div>
                        <div class="info-item"><span class="label">나이</span><div class="value"><i class="fa-solid fa-user-group"></i>${mukpat.ageMin}세 ~ ${mukpat.ageMax}세</div></div>
                        <div class="info-item"><span class="label">결제</span><div class="value"><i class="fa-solid fa-credit-card"></i>${paymentMethodText} (약 ${mukpat.paymentInfo.estimatedCost.toLocaleString()}원)</div></div>
                        <div class="info-item"><span class="label">분위기</span><div class="value"><i class="fa-regular fa-face-smile"></i>${mukpat.mood}</div></div>
                    </div>
                </div>
                <div class="actions">
                    <a href="${mukpat.kakaoLink}" target="_blank" id="kakao-btn" class="action-btn kakao-btn"><i class="fa-solid fa-comment"></i>채팅방 참여하기</a>
                    <button id="join-btn" class="action-btn primary-btn">참여하기</button>
                    <button id="edit-btn" class="action-btn secondary-btn">수정하기</button>
                </div>
            </main>`;
    };
    
    const populateForm = (mukpat) => {
        document.getElementById('title').value = mukpat.title;
        document.getElementById('description').value = mukpat.description;
        document.querySelector(`input[name="paymentMethod"][value="${mukpat.paymentInfo.paymentMethod}"]`).checked = true;
        document.getElementById('estimatedCost').value = mukpat.paymentInfo.estimatedCost;
        document.getElementById('mood').value = mukpat.mood;
        document.getElementById('date').value = mukpat.date ? new Date(mukpat.date).toISOString().split('T')[0] : '';
        document.getElementById('time').value = mukpat.time;
        document.getElementById('place').value = mukpat.place;
        document.getElementById('maxAttendees').value = mukpat.maxAttendees;
        document.getElementById('ageMin').value = mukpat.ageMin;
        document.getElementById('ageMax').value = mukpat.ageMax;
        document.getElementById('kakaoLink').value = mukpat.kakaoLink;
        document.getElementById('tags').value = mukpat.tags.join(', ');
    };

    // --- API 호출 대신 모의 데이터 사용 ---
    const fetchMukpats = (filters = {}) => {
        mukpatList.innerHTML = `<div class="card-item skeleton"></div><div class="card-item skeleton"></div><div class="card-item skeleton"></div>`;
        setTimeout(() => { // 로딩 효과
            let filtered = mockMukpats.filter(m => m.status !== 'ARCHIVED');
            if (filters.place) {
                filtered = filtered.filter(m => m.place.includes(filters.place));
            }
            renderMukpatList(filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        }, 500);
    };

    const fetchSingleMukpat = (id) => new Promise(resolve => setTimeout(() => resolve(mockMukpats.find(m => m._id === id)), 300));

    // --- 이벤트 핸들러 ---
    const handleShowDetail = async (id) => {
        views.detail.innerHTML = '<main class="glass-card"><div class="card-item skeleton" style="height: 600px;"></div></main>';
        switchView('detail', id);
        const mukpat = await fetchSingleMukpat(id);
        if (mukpat) renderDetailView(mukpat);
    };

    const handleShowForm = async (id = null) => {
        formTitle.textContent = id ? '잇팟 정보 수정' : '새로운 잇팟 만들기';
        mukpatForm.reset();
        if (id) {
            const mukpat = await fetchSingleMukpat(id);
            if (mukpat) populateForm(mukpat);
        }
        switchView('form', id);
    };

    const handleFormSubmit = (event) => {
        event.preventDefault();
        const submitBtn = mukpatForm.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = '저장 중...';

        const formData = {
            title: document.getElementById('title').value, description: document.getElementById('description').value,
            paymentInfo: { paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value, estimatedCost: parseInt(document.getElementById('estimatedCost').value) || 0, },
            mood: document.getElementById('mood').value, date: document.getElementById('date').value, time: document.getElementById('time').value, place: document.getElementById('place').value,
            maxAttendees: parseInt(document.getElementById('maxAttendees').value), ageMin: parseInt(document.getElementById('ageMin').value) || 20, ageMax: parseInt(document.getElementById('ageMax').value) || 99,
            kakaoLink: document.getElementById('kakaoLink').value, tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(Boolean),
        };

        setTimeout(() => { // 가짜 저장
            if (currentMukpatId) {
                const index = mockMukpats.findIndex(m => m._id === currentMukpatId);
                if (index !== -1) mockMukpats[index] = { ...mockMukpats[index], ...formData };
                handleShowDetail(currentMukpatId);
            } else {
                const newMukpat = { ...formData, _id: String(Date.now()), currentAttendees: 1, status: 'RECRUITING', createdAt: new Date().toISOString() };
                mockMukpats.push(newMukpat);
                switchView('list');
                fetchMukpats();
            }
            submitBtn.disabled = false;
            submitBtn.textContent = '완료';
        }, 500);
    };

    const handleJoin = async () => {
        const joinBtn = document.getElementById('join-btn');
        joinBtn.disabled = true;
        joinBtn.textContent = '처리 중...';
        
        setTimeout(async () => {
            const mukpat = mockMukpats.find(m => m._id === currentMukpatId);
            if (mukpat && mukpat.currentAttendees < mukpat.maxAttendees) {
                mukpat.currentAttendees++;
                alert('참여 완료! 채팅방 링크를 통해 대화를 시작하세요.');
                await renderDetailView(mukpat);
            } else {
                alert('모집이 마감되었거나, 참여할 수 없습니다.');
                joinBtn.textContent = '참여하기';
                joinBtn.disabled = false;
            }
        }, 500);
    };

    // --- 이벤트 리스너 설정 ---
    document.body.addEventListener('click', (e) => {
        const cardItem = e.target.closest('.card-item');
        const backBtn = e.target.closest('.back-btn');

        if (cardItem && cardItem.dataset.id) handleShowDetail(cardItem.dataset.id);
        else if (backBtn) currentMukpatId && views.form.classList.contains('active') ? handleShowDetail(currentMukpatId) : switchView('list');
        else if (e.target.id === 'edit-btn') handleShowForm(currentMukpatId);
        else if (e.target.id === 'join-btn') handleJoin();
    });

    document.getElementById('show-create-view-btn').addEventListener('click', () => handleShowForm());
    mukpatForm.addEventListener('submit', handleFormSubmit);
    filterForm.addEventListener('submit', (e) => { e.preventDefault(); fetchMukpats({ place: document.getElementById('place-filter').value }); });
    document.getElementById('clear-filter-btn').addEventListener('click', () => { filterForm.reset(); fetchMukpats(); });
    document.querySelectorAll('.stepper-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById('maxAttendees');
            let val = parseInt(input.value) + parseInt(btn.dataset.step);
            if (val >= 2) input.value = val;
        });
    });

    // --- 초기화 ---
    fetchMukpats();
});