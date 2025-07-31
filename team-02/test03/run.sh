#!/bin/bash

echo "=== StickerFit 가상 피팅룸 서버 실행 ==="
echo "Python 가상환경 확인 및 패키지 설치..."

# Python 3가 설치되어 있는지 확인
if ! command -v python3 &> /dev/null
then
    echo "Python 3가 설치되지 않았습니다. Python 3를 먼저 설치해주세요."
    exit 1
fi

# 가상환경이 없다면 생성
if [ ! -d "venv" ]; then
    echo "가상환경 생성 중..."
    python3 -m venv venv
fi

# 가상환경 활성화
echo "가상환경 활성화..."
source venv/bin/activate

# 필요한 패키지 설치
echo "필요한 패키지 설치 중..."
pip install -r requirements.txt

echo "서버 시작..."
echo "브라우저에서 http://localhost:8080 으로 접속하세요"
echo "종료하려면 Ctrl+C 를 누르세요"
echo ""

# Flask 앱 실행
python app.py
