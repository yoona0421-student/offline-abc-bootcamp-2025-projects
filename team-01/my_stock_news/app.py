# app.py (뉴스 피드 기능이 추가된 최종 완성 버전)

import requests
import json
from flask import Flask, render_template, request, jsonify
from datetime import datetime
import pytz
from bs4 import BeautifulSoup
import time
import threading
import os

from config import MY_TICKERS, EXCHANGE_RATE_API_KEY

app = Flask(__name__)
TICKERS_FILE = 'tickers.json'
DATA_CACHE_FILE = 'data_cache.json'
LATEST_NEWS_FILE = 'latest_news.json' # (NEW) 새로운 뉴스 저장 파일

# === 종목 목록 관리 함수 (변경 없음) ===
def get_tickers():
    if not os.path.exists(TICKERS_FILE):
        with open(TICKERS_FILE, 'w') as f: json.dump(MY_TICKERS, f)
        return MY_TICKERS
    else:
        with open(TICKERS_FILE, 'r') as f: return json.load(f)

def add_ticker(ticker):
    tickers = get_tickers()
    if ticker not in tickers:
        tickers.append(ticker)
        with open(TICKERS_FILE, 'w') as f: json.dump(tickers, f)
        return True
    return False

def remove_ticker(ticker):
    tickers = get_tickers()
    if ticker in tickers:
        tickers.remove(ticker)
        with open(TICKERS_FILE, 'w') as f: json.dump(tickers, f)
        return True
    return False

# === 크롤러 기능 ===
def get_stock_data(ticker):
    # ... (이전과 동일) ...
    url = f"https://finviz.com/quote.ashx?t={ticker}"
    headers = {'User-Agent': 'Mozilla/5.0'}
    stock_data = {"price": "N/A", "news": []}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'lxml')
        price_elements = soup.find_all('td', class_='snapshot-td2')
        if len(price_elements) > 11: stock_data['price'] = f"$ {price_elements[11].text}"
        news_table = soup.find(id='news-table')
        for row in news_table.findAll('tr', limit=5):
            stock_data['news'].append({'time': row.td.get_text().strip(), 'title': row.a.get_text(), 'link': row.a['href']})
        return stock_data
    except Exception as e:
        print(f"[{ticker}] 데이터 수집 오류: {e}")
        return stock_data

# (MODIFIED) '새로운 뉴스'를 감지하도록 대폭 수정된 크롤러 메인 함수
def crawl_and_save_all_data():
    tickers_to_crawl = get_tickers()
    print(f"백그라운드 크롤링 시작 ({len(tickers_to_crawl)} 종목): {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # 1. 크롤링 전, 이전 뉴스의 URL들을 모두 읽어옴
    old_news_urls = set()
    try:
        with open(DATA_CACHE_FILE, 'r', encoding='utf-8') as f:
            old_data = json.load(f)
            for ticker_data in old_data.values():
                for news_item in ticker_data.get('news', []):
                    old_news_urls.add(news_item['link'])
    except (FileNotFoundError, json.JSONDecodeError):
        pass # 파일이 없으면 그냥 넘어감

    # 2. 크롤링 진행
    all_data = {}
    for ticker in tickers_to_crawl:
        all_data[ticker] = get_stock_data(ticker)
        time.sleep(1)

    # 3. (NEW) 새로운 뉴스를 감지하고 별도로 저장
    newly_found_news = []
    for ticker, ticker_data in all_data.items():
        for news_item in ticker_data.get('news', []):
            if news_item['link'] not in old_news_urls:
                # 이전에 없던 뉴스 링크라면 '새로운 뉴스'로 간주
                new_item = news_item.copy()
                new_item['ticker'] = ticker # 어떤 종목의 뉴스인지 표시
                newly_found_news.append(new_item)
    
    # 새로운 뉴스를 파일에 저장 (최신 뉴스가 맨 위로 오도록 역순 저장)
    with open(LATEST_NEWS_FILE, 'w', encoding='utf-8') as f:
        json.dump(newly_found_news[::-1], f, ensure_ascii=False, indent=4)
    if newly_found_news:
        print(f"새로운 뉴스 {len(newly_found_news)}건 발견!")

    # 4. 전체 크롤링 데이터를 캐시 파일에 저장
    with open(DATA_CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=4)
    print("백그라운드 크롤링 및 파일 저장 완료!")

def run_scheduler():
    while True:
        crawl_and_save_all_data()
        time.sleep(600)

# === 웹 서버 기능 및 API ===
@app.route('/')
def index():
    # ... (이전과 동일) ...
    utc_now = datetime.utcnow().replace(tzinfo=pytz.utc)
    kst_time = utc_now.astimezone(pytz.timezone('Asia/Seoul')).strftime('%Y-%m-%d %H:%M:%S')
    et_time = utc_now.astimezone(pytz.timezone('America/New_York')).strftime('%Y-%m-%d %H:%M:%S')
    try:
        with open(DATA_CACHE_FILE, 'r', encoding='utf-8') as f: all_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError): all_data = {}
    return render_template('index.html', kst_time=kst_time, et_time=et_time, all_stock_data=all_data)

@app.route('/api/search/<ticker>')
def search_ticker(ticker):
    return jsonify(get_stock_data(ticker.upper()))

@app.route('/api/add_ticker', methods=['POST'])
def api_add_ticker():
    # ... (이전과 동일) ...
    data = request.get_json(); ticker = data.get('ticker')
    if not ticker: return jsonify({'status': 'error', 'message': '티커가 없습니다.'}), 400
    if add_ticker(ticker.upper()):
        threading.Thread(target=crawl_and_save_all_data).start()
        return jsonify({'status': 'success', 'message': f'{ticker}가 추가되었습니다.'})
    else: return jsonify({'status': 'error', 'message': '이미 존재하는 티커입니다.'})

@app.route('/api/remove_ticker', methods=['POST'])
def api_remove_ticker():
    # ... (이전과 동일) ...
    data = request.get_json(); ticker = data.get('ticker')
    if not ticker: return jsonify({'status': 'error', 'message': '티커가 없습니다.'}), 400
    if remove_ticker(ticker.upper()):
        threading.Thread(target=crawl_and_save_all_data).start()
        return jsonify({'status': 'success', 'message': f'{ticker}가 제거되었습니다.'})
    else: return jsonify({'status': 'error', 'message': '목록에 없는 티커입니다.'})

# (NEW) 새로운 뉴스 피드를 제공하는 API
@app.route('/api/latest_news')
def get_latest_news():
    """latest_news.json 파일의 내용을 반환하는 API"""
    try:
        with open(LATEST_NEWS_FILE, 'r', encoding='utf-8') as f:
            latest_news = json.load(f)
        return jsonify(latest_news)
    except (FileNotFoundError, json.JSONDecodeError):
        return jsonify([]) # 파일이 없으면 빈 리스트 반환

# --- 프로그램 실행 부분 ---
if __name__ == '__main__':
    # 프로그램 시작 시, 최신 뉴스 파일을 비움
    if os.path.exists(LATEST_NEWS_FILE): os.remove(LATEST_NEWS_FILE)
    
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    app.run(debug=False, port=5001)