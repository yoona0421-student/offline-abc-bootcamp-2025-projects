import requests
from urllib.parse import quote

# 무신사 API 테스트
def test_musinsa_api():
    url = "https://api.musinsa.com/api2/dp/v1/plp/goods"
    
    # 간단한 검색 테스트
    search_keyword = "티셔츠"
    encoded_keyword = quote(search_keyword.encode('utf-8'))
    
    # 파라미터 조정
    params = {
        'gf': 'A',
        'keyword': encoded_keyword,
        'sortCode': 'POPULAR',
        'page': '1',
        'size': '20',
        'caller': 'SEARCH'
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
        "Referer": "https://www.musinsa.com/"
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if 'data' in data and data['data']:
                print("✅ 무신사 API 작동 중")
                return True
            else:
                print("❌ 무신사 API 응답 구조 변경됨")
        else:
            print("❌ 무신사 API 접근 불가")
            
    except Exception as e:
        print(f"❌ 무신사 API 오류: {e}")
        
    return False

if __name__ == "__main__":
    test_musinsa_api()
