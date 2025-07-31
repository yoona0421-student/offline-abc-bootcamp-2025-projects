from flask import Flask, render_template, jsonify, request
import os
import json
import requests
from urllib.parse import quote

app = Flask(__name__)

# 무신사 API 설정
MUSINSA_API_URL = "https://api.musinsa.com/api2/dp/v1/plp/goods"
MUSINSA_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "Referer": "https://www.musinsa.com/"
}

def fetch_musinsa_clothes(keyword="티셔츠", page=1, size=12):
    """무신사 API에서 옷 데이터를 가져오는 함수"""
    try:
        encoded_keyword = quote(keyword.encode('utf-8'))
        params = {
            'gf': 'A',
            'keyword': encoded_keyword,
            'sortCode': 'POPULAR',
            'page': str(page),
            'size': str(size),
            'caller': 'SEARCH'
        }
        
        response = requests.get(MUSINSA_API_URL, params=params, headers=MUSINSA_HEADERS, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('data') and data['data'].get('list'):
                clothes_list = []
                for item in data['data']['list']:
                    # 카테고리 추정 (키워드 기반)
                    name = item['goodsName'].lower()
                    if any(word in name for word in ['티셔츠', '티', 'tee', '반팔']):
                        category = '상의'
                    elif any(word in name for word in ['바지', '팬츠', 'pants', '청바지', '조거']):
                        category = '하의'
                    elif any(word in name for word in ['원피스', 'dress', '드레스']):
                        category = '원피스'
                    elif any(word in name for word in ['자켓', 'jacket', '코트', '아우터', '후드']):
                        category = '아우터'
                    else:
                        category = '상의'  # 기본값
                    
                    clothes_list.append({
                        'id': item['goodsNo'],
                        'name': item['goodsName'],
                        'category': category,
                        'price': item['price'],
                        'image': item['thumbnail'],
                        'brand': item['brandName'],
                        'goodsUrl': item['goodsLinkUrl'],
                        'reviewCount': item.get('reviewCount', 0),
                        'saleRate': item.get('saleRate', 0)
                    })
                
                return {
                    'clothes': clothes_list,
                    'total': data['data']['pagination']['totalCount'],
                    'page': page,
                    'per_page': size,
                    'total_pages': data['data']['pagination']['totalPages']
                }
        
        return None
    except Exception as e:
        print(f"무신사 API 오류: {e}")
        return None

# 정적 이미지 데이터
CLOTHES_DATA = [
    {"id": 1, "name": "화이트 셔츠", "category": "상의", "price": 29000, "image": "/static/clothes/white_shirt.png", "brand": "기본"},
    {"id": 2, "name": "블루 티셔츠", "category": "상의", "price": 19000, "image": "/static/clothes/blue_tshirt.png", "brand": "기본"},
    {"id": 3, "name": "니트 스웨터", "category": "상의", "price": 45000, "image": "/static/clothes/knit_sweater.png", "brand": "기본"},
    {"id": 4, "name": "클래식 청바지", "category": "하의", "price": 59000, "image": "/static/clothes/classic_jeans.png", "brand": "기본"},
    {"id": 5, "name": "데님 쇼츠", "category": "하의", "price": 35000, "image": "/static/clothes/denim_shorts.png", "brand": "기본"},
    {"id": 6, "name": "플리츠 스커트", "category": "하의", "price": 39000, "image": "/static/clothes/pleats_skirt.png", "brand": "기본"},
    {"id": 7, "name": "서머 드레스", "category": "원피스", "price": 69000, "image": "/static/clothes/summer_dress.png", "brand": "기본"},
    {"id": 8, "name": "가죽 자켓", "category": "아우터", "price": 120000, "image": "/static/clothes/leather_jacket.png", "brand": "기본"},
    # 추가 상의들
    {"id": 9, "name": "01 상의", "category": "상의", "price": 25000, "image": "/static/clothes/01_up.png", "brand": "컬렉션"},
    {"id": 10, "name": "02 상의", "category": "상의", "price": 28000, "image": "/static/clothes/02_up.png", "brand": "컬렉션"},
    {"id": 11, "name": "03 상의", "category": "상의", "price": 32000, "image": "/static/clothes/03_up.png", "brand": "컬렉션"},
    {"id": 12, "name": "04 상의", "category": "상의", "price": 30000, "image": "/static/clothes/04_up.png", "brand": "컬렉션"},
    {"id": 13, "name": "05 상의", "category": "상의", "price": 27000, "image": "/static/clothes/05_up.png", "brand": "컬렉션"},
    # 추가 하의들
    {"id": 14, "name": "01 바지", "category": "하의", "price": 45000, "image": "/static/clothes/01_pants.png", "brand": "컬렉션"},
    {"id": 15, "name": "02 바지", "category": "하의", "price": 48000, "image": "/static/clothes/02_pants.png", "brand": "컬렉션"},
    {"id": 16, "name": "03 바지", "category": "하의", "price": 52000, "image": "/static/clothes/03_pants.png", "brand": "컬렉션"},
    {"id": 17, "name": "04 바지", "category": "하의", "price": 50000, "image": "/static/clothes/04_pants.png", "brand": "컬렉션"},
    {"id": 18, "name": "05 바지", "category": "하의", "price": 47000, "image": "/static/clothes/05_pants.png", "brand": "컬렉션"},
    {"id": 19, "name": "06 바지", "category": "하의", "price": 55000, "image": "/static/clothes/06_pants.png", "brand": "컬렉션"},
    {"id": 20, "name": "07 바지", "category": "하의", "price": 49000, "image": "/static/clothes/07_pants.png", "brand": "컬렉션"},
    {"id": 21, "name": "08 바지", "category": "하의", "price": 46000, "image": "/static/clothes/08_pants.png", "brand": "컬렉션"},
    # 원피스들
    {"id": 22, "name": "01 드레스", "category": "원피스", "price": 75000, "image": "/static/clothes/01_dress.png", "brand": "컬렉션"},
    {"id": 23, "name": "02 드레스", "category": "원피스", "price": 78000, "image": "/static/clothes/02_dress.png", "brand": "컬렉션"},
    {"id": 24, "name": "03 드레스", "category": "원피스", "price": 82000, "image": "/static/clothes/03_dress.png", "brand": "컬렉션"},
    {"id": 25, "name": "04 드레스", "category": "원피스", "price": 80000, "image": "/static/clothes/04_dress.png", "brand": "컬렉션"},
    {"id": 26, "name": "05 드레스", "category": "원피스", "price": 77000, "image": "/static/clothes/05_dress.png", "brand": "컬렉션"},
    # 아우터들
    {"id": 27, "name": "01 아우터", "category": "아우터", "price": 95000, "image": "/static/clothes/01_out.png", "brand": "컬렉션"},
    {"id": 28, "name": "02 아우터", "category": "아우터", "price": 98000, "image": "/static/clothes/02_out.png", "brand": "컬렉션"},
    {"id": 29, "name": "03 아우터", "category": "아우터", "price": 102000, "image": "/static/clothes/03_out.png", "brand": "컬렉션"},
    {"id": 30, "name": "04 아우터", "category": "아우터", "price": 100000, "image": "/static/clothes/04_out.png", "brand": "컬렉션"},
    {"id": 31, "name": "05 아우터", "category": "아우터", "price": 97000, "image": "/static/clothes/05_out.png", "brand": "컬렉션"},
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/musinsa-search')
def musinsa_search():
    """무신사 API 검색 엔드포인트"""
    keyword = request.args.get('keyword', '티셔츠')
    page = int(request.args.get('page', 1))
    size = int(request.args.get('size', 12))
    
    musinsa_data = fetch_musinsa_clothes(keyword, page, size)
    
    if musinsa_data:
        return jsonify({
            'success': True,
            'data': musinsa_data['clothes'],
            'pagination': {
                'page': musinsa_data['page'],
                'total': musinsa_data['total'],
                'total_pages': musinsa_data['total_pages']
            }
        })
    else:
        # 무신사 API 실패 시 샘플 데이터 반환
        sample_data = [
            {
                "id": 5069232,
                "name": "그루브라임 썸머 그래픽 티셔츠",
                "image": "https://image.msscdn.net/images/goods_img/20250428/5069232/5069232_17461538318924_500.jpg",
                "price": 29000,
                "brand": "그루브라임",
                "category": "상의"
            },
            {
                "id": 1356896,
                "name": "M-Logo 그래픽 반팔 티",
                "image": "https://image.msscdn.net/images/goods_img/20200318/1356896/1356896_17477222815980_500.jpg",
                "price": 35100,
                "brand": "지프",
                "category": "상의"
            },
            {
                "id": 1876212,
                "name": "ARCH LOGO TEE",
                "image": "https://image.msscdn.net/images/goods_img/20210401/1876212/1876212_1_500.jpg",
                "price": 19500,
                "brand": "이스트쿤스트",
                "category": "상의"
            },
            {
                "id": 5182568,
                "name": "RIDING BIKE CAT 오버핏 반팔 티셔츠",
                "image": "https://image.msscdn.net/images/goods_img/20250613/5182568/5182568_17497786695276_500.jpg",
                "price": 22800,
                "brand": "오언더알",
                "category": "상의"
            },
            {
                "id": 4716623,
                "name": "피그먼트 크롭 반팔티셔츠",
                "image": "https://image.msscdn.net/images/goods_img/20250113/4716623/4716623_17537516325475_500.jpg",
                "price": 15900,
                "brand": "무아무아",
                "category": "상의"
            }
        ]
        
        return jsonify({
            'success': True,
            'data': sample_data,
            'pagination': {
                'page': 1,
                'total': len(sample_data),
                'total_pages': 1
            },
            'note': 'Sample data used (API connection failed)'
        })

@app.route('/api/clothes')
def get_clothes():
    category = request.args.get('category', '')
    search = request.args.get('search', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 12))
    
    # 무신사 API에서 먼저 시도
    musinsa_keyword = search if search else "옷"
    if category and category != '전체':
        category_keywords = {
            '상의': '티셔츠',
            '하의': '바지',
            '원피스': '원피스',
            '아우터': '자켓'
        }
        musinsa_keyword = category_keywords.get(category, musinsa_keyword)
    
    musinsa_data = fetch_musinsa_clothes(musinsa_keyword, page, per_page)
    
    if musinsa_data:
        # 카테고리 필터링
        if category and category != '전체':
            musinsa_data['clothes'] = [item for item in musinsa_data['clothes'] if item['category'] == category]
        
        # 검색 필터링
        if search:
            musinsa_data['clothes'] = [item for item in musinsa_data['clothes'] if search.lower() in item['name'].lower()]
        
        return jsonify(musinsa_data)
    
    # 무신사 API 실패 시 로컬 데이터 사용
    filtered_clothes = CLOTHES_DATA
    
    if category and category != '전체':
        filtered_clothes = [item for item in filtered_clothes if item['category'] == category]
    
    if search:
        filtered_clothes = [item for item in filtered_clothes if search.lower() in item['name'].lower()]
    
    # 페이지네이션
    start = (page - 1) * per_page
    end = start + per_page
    paginated_clothes = filtered_clothes[start:end]
    
    return jsonify({
        'clothes': paginated_clothes,
        'total': len(filtered_clothes),
        'page': page,
        'per_page': per_page,
        'total_pages': (len(filtered_clothes) + per_page - 1) // per_page,
        'source': 'local'  # 로컬 데이터 사용 표시
    })

if __name__ == '__main__':
    app.run(debug=True, port=8080)
