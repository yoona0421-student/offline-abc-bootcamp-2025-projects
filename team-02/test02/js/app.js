// 가상 피팅룸 애플리케이션
class VirtualFittingRoom {
    constructor() {
        this.canvas = null;
        this.clothesData = [];
        this.backgroundImage = null;
        this.init();
    }

    // 초기화
    async init() {
        try {
            // Fabric.js 캔버스 초기화
            this.initCanvas();
            
            // 이벤트 리스너 등록
            this.initEventListeners();
            
            // 옷 데이터 로드
            await this.loadClothesData();
            
            console.log('가상 피팅룸이 초기화되었습니다.');
        } catch (error) {
            console.error('초기화 중 오류가 발생했습니다:', error);
            this.showError('애플리케이션 초기화에 실패했습니다.');
        }
    }

    // Fabric.js 캔버스 초기화
    initCanvas() {
        this.canvas = new fabric.Canvas('fittingCanvas', {
            backgroundColor: '#ffffff',
            selection: true,
            preserveObjectStacking: true
        });

        // 캔버스 기본 설정
        this.canvas.setDimensions({
            width: 600,
            height: 700
        });

        // 객체 선택 시 컨트롤 스타일 설정 (모던한 블루 테마)
        fabric.Object.prototype.set({
            transparentCorners: false,
            cornerColor: '#3b82f6',
            cornerStrokeColor: '#1d4ed8',
            borderColor: '#3b82f6',
            cornerSize: 10,
            padding: 8,
            cornerStyle: 'circle',
            borderDashArray: [5, 5]
        });
    }

    // 이벤트 리스너 등록
    initEventListeners() {
        // 사진 업로드
        const photoUpload = document.getElementById('photoUpload');
        photoUpload.addEventListener('change', (e) => this.handlePhotoUpload(e));

        // 옷 업로드
        const clothUpload = document.getElementById('clothUpload');
        clothUpload.addEventListener('change', (e) => this.handleClothUpload(e));

        // 탭 전환
        const catalogTab = document.getElementById('catalogTab');
        const uploadTab = document.getElementById('uploadTab');
        catalogTab.addEventListener('click', () => this.switchTab('catalog'));
        uploadTab.addEventListener('click', () => this.switchTab('upload'));

        // 배경 제거 버튼
        const removeBackground = document.getElementById('removeBackground');
        removeBackground.addEventListener('click', () => this.removeBackground());

        // 레이어 관리 버튼들
        const bringToFront = document.getElementById('bringToFront');
        const sendToBack = document.getElementById('sendToBack');
        bringToFront.addEventListener('click', () => this.bringToFront());
        sendToBack.addEventListener('click', () => this.sendToBack());

        // 캔버스 초기화 버튼
        const clearCanvas = document.getElementById('clearCanvas');
        clearCanvas.addEventListener('click', () => this.clearCanvas());

        // 이미지 다운로드 버튼
        const downloadImage = document.getElementById('downloadImage');
        downloadImage.addEventListener('click', () => this.downloadImage());

        // 캔버스 객체 이벤트
        this.canvas.on('object:added', () => this.updateCanvasState());
        this.canvas.on('object:removed', () => this.updateCanvasState());
        this.canvas.on('selection:created', () => this.updateLayerButtons());
        this.canvas.on('selection:updated', () => this.updateLayerButtons());
        this.canvas.on('selection:cleared', () => this.updateLayerButtons());
    }

    // 옷 데이터 로드
    async loadClothesData() {
        try {
            console.log('옷 데이터 로드 시작...');
            const response = await fetch('./clothes.json');
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('로드된 데이터:', data);
            
            if (data && data.clothes && Array.isArray(data.clothes)) {
                this.clothesData = data.clothes;
                console.log('옷 데이터 로드 완료:', this.clothesData.length, '개 아이템');
                this.renderClothesGrid();
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            console.error('옷 데이터 로드 실패:', error);
            this.renderClothesError();
        }
    }

    // 옷 목록 렌더링
    renderClothesGrid() {
        const clothesList = document.getElementById('clothesList');
        console.log('옷 목록 렌더링 시작, 아이템 수:', this.clothesData.length);
        
        if (!clothesList) {
            console.error('clothesList 요소를 찾을 수 없습니다.');
            return;
        }
        
        if (this.clothesData.length === 0) {
            clothesList.innerHTML = `
                <div class="text-center text-gray-500 col-span-2 py-8">
                    <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    <div class="text-sm">옷장이 비어있습니다.</div>
                </div>
            `;
            return;
        }

        clothesList.innerHTML = this.clothesData.map(cloth => {
            console.log('렌더링 중인 옷:', cloth);
            return `
                <div class="cloth-item group bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-md" data-cloth-id="${cloth.id}">
                    <div class="aspect-square bg-gray-50 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                        <img 
                            src="${cloth.image}" 
                            alt="${cloth.name}"
                            class="max-w-full max-h-full object-contain transition-transform group-hover:scale-110"
                            onload="console.log('이미지 로드 성공:', '${cloth.image}')"
                            onerror="console.error('이미지 로드 실패:', '${cloth.image}'); this.style.display='none'; this.nextElementSibling.style.display='flex';"
                        >
                        <div class="hidden flex-col items-center justify-center text-gray-300">
                            <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            <div class="text-xs">이미지 없음</div>
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="font-medium text-sm text-gray-900 truncate mb-1" title="${cloth.name}">
                            ${cloth.name}
                        </div>
                        <div class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
                            ${cloth.category}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        console.log('옷 목록 HTML 생성 완료');

        // 옷 아이템 클릭 이벤트 등록
        clothesList.addEventListener('click', (e) => {
            const clothItem = e.target.closest('.cloth-item');
            if (clothItem) {
                const clothId = clothItem.dataset.clothId;
                console.log('선택된 옷 ID:', clothId);
                this.addClothToCanvas(clothId);
            }
        });
    }

    // 옷 데이터 로드 실패 시 에러 표시
    renderClothesError() {
        const clothesList = document.getElementById('clothesList');
        clothesList.innerHTML = `
            <div class="text-center text-red-500 col-span-2 py-8">
                <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <div class="text-sm mb-3">옷 데이터를 불러올 수 없습니다.</div>
                <button 
                    onclick="location.reload()" 
                    class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                    다시 시도
                </button>
            </div>
        `;
    }

    // 사진 업로드 처리
    handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 파일 타입 검증
        if (!file.type.startsWith('image/')) {
            this.showError('이미지 파일만 업로드할 수 있습니다.');
            return;
        }

        // 파일 크기 검증 (10MB 제한)
        if (file.size > 10 * 1024 * 1024) {
            this.showError('파일 크기가 너무 큽니다. (최대 10MB)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.setBackgroundImage(e.target.result);
        };
        reader.onerror = () => {
            this.showError('파일을 읽는 중 오류가 발생했습니다.');
        };
        reader.readAsDataURL(file);
    }

    // 옷 이미지 업로드 처리
    handleClothUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 파일 타입 검증
        if (!file.type.startsWith('image/')) {
            this.showError('이미지 파일만 업로드할 수 있습니다.');
            return;
        }

        // 파일 크기 검증 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('파일 크기가 너무 큽니다. (최대 5MB)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.addUserClothToCanvas(e.target.result, file.name);
        };
        reader.onerror = () => {
            this.showError('파일을 읽는 중 오류가 발생했습니다.');
        };
        reader.readAsDataURL(file);
    }

    // 탭 전환
    switchTab(tabName) {
        const catalogTab = document.getElementById('catalogTab');
        const uploadTab = document.getElementById('uploadTab');
        const catalogView = document.getElementById('catalogView');
        const uploadView = document.getElementById('uploadView');

        if (tabName === 'catalog') {
            catalogTab.className = 'flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all bg-white text-blue-600 shadow-sm';
            uploadTab.className = 'flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all text-gray-600 hover:text-gray-900';
            catalogView.classList.remove('hidden');
            uploadView.classList.add('hidden');
        } else {
            uploadTab.className = 'flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all bg-white text-blue-600 shadow-sm';
            catalogTab.className = 'flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all text-gray-600 hover:text-gray-900';
            uploadView.classList.remove('hidden');
            catalogView.classList.add('hidden');
        }
    }

    // 사용자 업로드 옷을 캔버스에 추가
    addUserClothToCanvas(imageUrl, fileName) {
        this.showLoading(`${fileName} 처리 중...`);

        fabric.Image.fromURL(imageUrl, (img) => {
            if (!img.getElement()) {
                this.hideLoading();
                this.showError('이미지를 불러올 수 없습니다.');
                return;
            }

            // 적절한 크기로 조정 (최대 200px)
            const maxSize = 200;
            const scale = Math.min(maxSize / img.width, maxSize / img.height);
            
            img.set({
                left: Math.random() * (this.canvas.width - img.width * scale),
                top: Math.random() * (this.canvas.height - img.height * scale),
                scaleX: scale,
                scaleY: scale,
                selectable: true,
                evented: true,
                hasControls: true,
                hasBorders: true,
                transparentCorners: false
            });

            // 사용자 업로드 정보 저장
            img.clothInfo = {
                id: 'user_' + Date.now(),
                name: fileName.replace(/\.[^/.]+$/, ""), // 확장자 제거
                category: '사용자 업로드',
                isUserUpload: true
            };

            this.canvas.add(img);
            this.canvas.setActiveObject(img);
            this.canvas.renderAll();

            this.hideLoading();
            this.showSuccess(`${fileName}이(가) 추가되었습니다!`);
        }, {
            crossOrigin: 'anonymous'
        });
    }

    // 레이어 버튼 상태 업데이트
    updateLayerButtons() {
        const activeObject = this.canvas.getActiveObject();
        const bringToFront = document.getElementById('bringToFront');
        const sendToBack = document.getElementById('sendToBack');
        
        if (activeObject && activeObject !== this.backgroundImage) {
            bringToFront.disabled = false;
            sendToBack.disabled = false;
        } else {
            bringToFront.disabled = true;
            sendToBack.disabled = true;
        }
    }

    // 선택된 객체를 맨 앞으로
    bringToFront() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && activeObject !== this.backgroundImage) {
            this.canvas.bringToFront(activeObject);
            this.canvas.renderAll();
            this.showSuccess('선택된 옷을 맨 앞으로 이동했습니다.');
        }
    }

    // 선택된 객체를 맨 뒤로 (배경 이미지 위)
    sendToBack() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && activeObject !== this.backgroundImage) {
            this.canvas.sendToBack(activeObject);
            if (this.backgroundImage) {
                this.canvas.sendToBack(this.backgroundImage);
            }
            this.canvas.renderAll();
            this.showSuccess('선택된 옷을 맨 뒤로 이동했습니다.');
        }
    }

    // 배경 이미지 설정
    setBackgroundImage(imageUrl) {
        fabric.Image.fromURL(imageUrl, (img) => {
            // 이미지를 캔버스 크기에 맞게 조정
            const canvasWidth = this.canvas.width;
            const canvasHeight = this.canvas.height;
            
            const scaleX = canvasWidth / img.width;
            const scaleY = canvasHeight / img.height;
            const scale = Math.min(scaleX, scaleY);
            
            img.set({
                scaleX: scale,
                scaleY: scale,
                left: (canvasWidth - img.width * scale) / 2,
                top: (canvasHeight - img.height * scale) / 2,
                selectable: false,
                evented: false,
                excludeFromExport: false
            });

            // 기존 배경 이미지 제거
            if (this.backgroundImage) {
                this.canvas.remove(this.backgroundImage);
            }

            this.backgroundImage = img;
            this.canvas.add(img);
            this.canvas.sendToBack(img);
            this.canvas.renderAll();

            // 배경 제거 버튼 활성화
            document.getElementById('removeBackground').disabled = false;
            
            this.showSuccess('배경 이미지가 설정되었습니다!');
        }, {
            crossOrigin: 'anonymous'
        });
    }

    // 배경 이미지 제거
    removeBackground() {
        if (this.backgroundImage) {
            this.canvas.remove(this.backgroundImage);
            this.backgroundImage = null;
            this.canvas.renderAll();
            
            // 배경 제거 버튼 비활성화
            document.getElementById('removeBackground').disabled = true;
            
            this.showSuccess('배경 이미지가 제거되었습니다.');
        }
    }

    // 캔버스에 옷 추가
    addClothToCanvas(clothId) {
        const cloth = this.clothesData.find(c => c.id === clothId);
        if (!cloth) {
            this.showError('옷 정보를 찾을 수 없습니다.');
            return;
        }

        // 로딩 상태 표시
        this.showLoading(`${cloth.name} 추가 중...`);

        fabric.Image.fromURL(cloth.image, (img) => {
            if (!img.getElement()) {
                this.hideLoading();
                this.showError(`${cloth.name} 이미지를 불러올 수 없습니다.`);
                return;
            }

            // 기본 크기 설정
            const defaultWidth = cloth.defaultSize.width;
            const defaultHeight = cloth.defaultSize.height;
            
            const scaleX = defaultWidth / img.width;
            const scaleY = defaultHeight / img.height;
            
            img.set({
                left: Math.random() * (this.canvas.width - defaultWidth),
                top: Math.random() * (this.canvas.height - defaultHeight),
                scaleX: scaleX,
                scaleY: scaleY,
                selectable: true,
                evented: true,
                hasControls: true,
                hasBorders: true,
                transparentCorners: false
            });

            // 옷 정보를 객체에 저장
            img.clothInfo = cloth;

            this.canvas.add(img);
            this.canvas.setActiveObject(img);
            this.canvas.renderAll();

            this.hideLoading();
            this.showSuccess(`${cloth.name}이(가) 추가되었습니다!`);
        }, {
            crossOrigin: 'anonymous'
        });
    }

    // 캔버스 초기화
    clearCanvas() {
        if (confirm('정말로 모든 옷을 제거하시겠습니까?')) {
            // 배경 이미지를 제외한 모든 객체 제거
            const objects = this.canvas.getObjects().filter(obj => obj !== this.backgroundImage);
            objects.forEach(obj => this.canvas.remove(obj));
            this.canvas.renderAll();
            
            this.showSuccess('캔버스가 초기화되었습니다.');
        }
    }

    // 이미지 다운로드
    downloadImage() {
        try {
            // 캔버스를 이미지로 변환
            const dataURL = this.canvas.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 2 // 고해상도를 위해 2배 크기로 내보내기
            });

            // 다운로드 링크 생성
            const link = document.createElement('a');
            link.download = `virtual-fitting-${new Date().getTime()}.png`;
            link.href = dataURL;
            
            // 다운로드 실행
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showSuccess('이미지가 저장되었습니다!');
        } catch (error) {
            console.error('이미지 다운로드 오류:', error);
            this.showError('이미지 저장에 실패했습니다.');
        }
    }

    // 캔버스 상태 업데이트
    updateCanvasState() {
        // 캔버스에 객체가 있는지 확인하여 UI 상태 업데이트
        const hasObjects = this.canvas.getObjects().length > (this.backgroundImage ? 1 : 0);
        // 필요시 여기에 UI 상태 업데이트 로직 추가
    }

    // 성공 메시지 표시
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // 에러 메시지 표시
    showError(message) {
        this.showNotification(message, 'error');
    }

    // 알림 표시
    showNotification(message, type = 'info') {
        // 기존 알림 제거
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast-notification fixed top-6 right-6 px-6 py-4 rounded-lg shadow-lg z-50 font-inter transform transition-all duration-300 translate-x-full max-w-sm`;
        
        // 타입별 스타일 설정
        const styles = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        
        const icons = {
            success: `<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
            error: `<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
            info: `<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
        };
        
        toast.className += ` ${styles[type] || styles.info}`;
        toast.innerHTML = `
            <div class="flex items-center">
                ${icons[type] || icons.info}
                <span class="text-sm font-medium">${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // 애니메이션으로 표시
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // 4초 후 자동 제거
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    // 로딩 표시
    showLoading(message = '처리 중...') {
        const loading = document.createElement('div');
        loading.id = 'loadingOverlay';
        loading.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loading.innerHTML = `
            <div class="bg-white rounded-xl p-8 text-center font-inter shadow-2xl">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <div class="text-gray-700 font-medium">${message}</div>
            </div>
        `;
        document.body.appendChild(loading);
    }

    // 로딩 숨김
    hideLoading() {
        const loading = document.getElementById('loadingOverlay');
        if (loading) {
            loading.remove();
        }
    }
}

// DOM이 로드된 후 애플리케이션 시작
document.addEventListener('DOMContentLoaded', () => {
    // 브라우저 호환성 체크
    if (typeof fabric === 'undefined') {
        alert('Fabric.js 라이브러리를 불러올 수 없습니다. 인터넷 연결을 확인해주세요.');
        return;
    }

    // 가상 피팅룸 앱 인스턴스 생성
    window.fittingRoom = new VirtualFittingRoom();
});

// 키보드 단축키 추가
document.addEventListener('keydown', (e) => {
    if (!window.fittingRoom) return;

    // Ctrl/Cmd + Z: 실행 취소 (간단한 구현)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        // 선택된 객체 삭제
        const activeObject = window.fittingRoom.canvas.getActiveObject();
        if (activeObject && activeObject !== window.fittingRoom.backgroundImage) {
            window.fittingRoom.canvas.remove(activeObject);
            window.fittingRoom.canvas.renderAll();
        }
    }

    // Delete 키: 선택된 객체 삭제
    if (e.key === 'Delete') {
        const activeObject = window.fittingRoom.canvas.getActiveObject();
        if (activeObject && activeObject !== window.fittingRoom.backgroundImage) {
            window.fittingRoom.canvas.remove(activeObject);
            window.fittingRoom.canvas.renderAll();
        }
    }
});

// 창 크기 변경 시 캔버스 반응형 조정
window.addEventListener('resize', () => {
    if (window.fittingRoom && window.fittingRoom.canvas) {
        // 모바일에서 캔버스 크기 조정
        if (window.innerWidth < 768) {
            const container = document.querySelector('#fittingCanvas').parentElement;
            const containerWidth = container.clientWidth - 32; // 패딩 고려
            const scale = Math.min(containerWidth / 600, 1);
            
            window.fittingRoom.canvas.setZoom(scale);
        } else {
            window.fittingRoom.canvas.setZoom(1);
        }
        window.fittingRoom.canvas.renderAll();
    }
});
