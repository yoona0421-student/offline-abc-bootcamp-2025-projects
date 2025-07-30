# 2팀 프로젝트 저장소 - 가상 피팅룸

## 프로젝트 소개
웹 기반 가상 피팅룸 애플리케이션입니다. 사용자가 전신 사진을 업로드하고 다양한 옷 스티커를 드래그해서 가상으로 입어볼 수 있습니다.

## 주요 기능
- 📸 전신 사진 업로드 및 배경 설정
- 👗 다양한 옷 아이템 선택 (JSON 데이터 기반)
- 🎨 Fabric.js를 활용한 드래그, 크기 조절, 회전 기능
- 💾 완성된 피팅 이미지 PNG 다운로드
- 📱 반응형 디자인 (모바일 친화적)
- ✨ 종이 질감 배경과 손글씨 폰트로 아날로그 감성

## 기술 스택
- **Frontend**: HTML5, JavaScript (ES6+), CSS3
- **라이브러리**: 
  - Fabric.js (캔버스 조작)
  - Tailwind CSS (스타일링)
  - Google Fonts (Caveat, Kalam)
- **데이터**: JSON 파일 기반 옷 아이템 관리

## 폴더 구조
```
team-02/
├── index.html              # 메인 페이지
├── js/
│   └── app.js              # 메인 애플리케이션 로직
├── css/
│   └── style.css           # 커스텀 스타일
├── assets/
│   └── clothes/            # 옷 이미지 파일들
│       ├── white_shirt.png
│       ├── blue_tshirt.png
│       ├── classic_jeans.png
│       ├── pleats_skirt.png
│       ├── summer_dress.png
│       ├── leather_jacket.png
│       ├── knit_sweater.png
│       └── denim_shorts.png
├── clothes.json            # 옷 아이템 데이터
└── README.md
```

## 사용 방법
1. `index.html` 파일을 브라우저에서 열기
2. "전신 사진 업로드" 버튼을 클릭하여 배경 이미지 설정
3. 가상 옷장에서 원하는 옷 아이템 클릭
4. 캔버스에서 옷을 드래그하여 위치 조정
5. 모서리를 드래그하여 크기 조절
6. "저장하기" 버튼으로 완성된 이미지 다운로드

## 주요 클래스 및 메서드
### VirtualFittingRoom 클래스
- `init()`: 애플리케이션 초기화
- `initCanvas()`: Fabric.js 캔버스 설정
- `loadClothesData()`: JSON에서 옷 데이터 로드
- `handlePhotoUpload()`: 사진 업로드 처리
- `addClothToCanvas()`: 캔버스에 옷 추가
- `downloadImage()`: 이미지 다운로드

## 키보드 단축키
- `Delete`: 선택된 옷 아이템 삭제
- `Ctrl/Cmd + Z`: 선택된 객체 삭제 (간단한 실행취소)

## 브라우저 호환성
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 개발 노트
- SVG 형태의 예시 이미지가 포함되어 있습니다. 실제 사용 시 PNG 이미지로 교체하세요.
- `clothes.json` 파일을 수정하여 새로운 옷 아이템을 추가할 수 있습니다.
- 반응형 디자인으로 모바일에서도 사용 가능합니다.

## 현재 구현 상태 vs 목표 사용자 흐름

### ✅ 구현 완료
- [x] 전신 사진 업로드 및 배경 설정
- [x] 웹 제공 의류 카탈로그 보기 (JSON 기반)
- [x] 피팅 룩 구성 & 조정 (드래그, 크기, 회전)
- [x] PNG 이미지 저장 및 다운로드

### ❌ 누락된 기능 (개선 필요)
- [ ] **사용자 의류 이미지 업로드 기능**
- [ ] **배경 제거 처리** (Selfie Segmentation/White Removal)
- [ ] **의류 선택 방법 선택 화면** (업로드 vs 카탈로그)
- [ ] **레이어 순서 조정** (앞으로/뒤로 보내기)
- [ ] **얼굴 모자이크 옵션**
- [ ] **SNS 공유 기능**

## 개선 계획

### Phase 1: 핵심 기능 확장 (즉시 구현)
1. **사용자 의류 업로드 섹션 추가**
   - 의류 이미지 업로드 UI 추가
   - 업로드된 이미지를 캔버스에 추가하는 기능
   
2. **레이어 관리 기능**
   - 객체 레이어 순서 조정 버튼 (앞으로/뒤로)
   - 선택된 객체 정보 표시

### Phase 2: 고급 기능 (중기)
1. **배경 제거 기술 도입**
   - Canvas API 기반 화이트 배경 제거
   - 또는 TensorFlow.js Selfie Segmentation 적용
   
2. **얼굴 보호 기능**
   - 얼굴 영역 자동 감지 및 모자이크 처리

### Phase 3: 소셜 기능 (장기)
1. **공유 시스템**
   - 이미지 임시 저장 서버
   - 공유용 단축 URL 생성
   - SNS 연동 (카카오톡, 인스타그램 등)

## 멤버

