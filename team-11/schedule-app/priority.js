document.addEventListener('DOMContentLoaded', () => {
    const priorityList = document.getElementById('priorityList');
    const currentDate = document.getElementById('current-date');
    const currentWeather = document.getElementById('current-weather');
    const memoModal = document.getElementById('memoModal');
    const memoContent = document.getElementById('memoContent');
    const saveMemo = document.getElementById('saveMemo');
    const closeMemo = document.getElementById('closeMemo');

    // 오늘 날짜 표시
    const today = new Date();
    currentDate.textContent = `오늘 날짜: ${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    // 날씨 정보 가져오기 (예: OpenWeatherMap API 사용)
    /*
    fetch('https://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=<사용자의_실제_API_키>&lang=kr')
        .then(response => response.json())
        .then(data => {
            const weather = data.weather[0].description;
            const temp = (data.main.temp - 273.15).toFixed(1); // 켈빈을 섭씨로 변환
            currentWeather.textContent = `현재 날씨: ${weather}, 온도: ${temp}°C`;
        })
        .catch(() => {
            currentWeather.textContent = '날씨 정보를 가져올 수 없습니다.';
        });
    */

    const weatherUrl = "https://api.open-meteo.com/v1/forecast?latitude=37.555451&longitude=126.970413&current=temperature_2m,weathercode,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,weathercode,wind_speed_10m";

    fetch(weatherUrl)
        .then(response => response.json())
        .then(data => {
            const weather = getWeatherLabel(data);
            const tempValue = data.current.temperature_2m;            // 34.2
            const tempUnit  = data.current_units.temperature_2m;      // "°C"
            currentWeather.textContent = `현재 날씨: ${weather}, 온도: ${tempValue}${tempUnit}`;
        })

    // 로컬 스토리지에서 일정 데이터 가져오기
    const schedules = JSON.parse(localStorage.getItem('schedules')) || [];

    // 일정 표시
    schedules.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `[${item.type}] ${item.task} - 예상 ${item.duration}분`;
        const memoBtn = document.createElement('button');
        memoBtn.textContent = '메모';
        memoBtn.onclick = () => {
            memoContent.value = item.memo || '';
            memoModal.classList.remove('hidden');
            saveMemo.onclick = () => {
                item.memo = memoContent.value;
                localStorage.setItem('schedules', JSON.stringify(schedules));
                memoModal.classList.add('hidden');
            };
        };
        li.appendChild(memoBtn);
        priorityList.appendChild(li);
    });

    closeMemo.onclick = () => {
        memoModal.classList.add('hidden');
    };

    document.getElementById('showMySchedule').addEventListener('click', () => {
        const myScheduleDiv = document.getElementById('mySchedule');
        const schedules = JSON.parse(localStorage.getItem('schedules')) || [];
        myScheduleDiv.innerHTML = '<ul>';
        schedules.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `[${item.type}] ${item.task} - 예상 ${item.duration}분`;
            myScheduleDiv.appendChild(li);
        });
        myScheduleDiv.innerHTML += '</ul>';
        myScheduleDiv.classList.remove('hidden');
    });
});

// WMO Weather‑Code ↔ 한글 설명 매핑
const WEATHER_LABEL = {
  0:  "맑음",                       // Clear sky :contentReference[oaicite:0]{index=0}
  1:  "대체로 맑음",                // Mainly clear :contentReference[oaicite:1]{index=1}
  2:  "부분적으로 흐림",            // Partly cloudy :contentReference[oaicite:2]{index=2}
  3:  "흐림",                       // Overcast :contentReference[oaicite:3]{index=3}
  45: "옅은 안개",                  // Fog :contentReference[oaicite:4]{index=4}
  48: "상고대 안개",                // Rime fog :contentReference[oaicite:5]{index=5}
  51: "약한 이슬비",               // Light drizzle :contentReference[oaicite:6]{index=6}
  53: "이슬비",                     // Moderate drizzle :contentReference[oaicite:7]{index=7}
  55: "강한 이슬비",               // Dense drizzle :contentReference[oaicite:8]{index=8}
  56: "약한 언 이슬비",            // Light freezing drizzle :contentReference[oaicite:9]{index=9}
  57: "강한 언 이슬비",            // Heavy freezing drizzle :contentReference[oaicite:10]{index=10}
  61: "약한 비",                   // Light rain :contentReference[oaicite:11]{index=11}
  63: "비",                         // Moderate rain :contentReference[oaicite:12]{index=12}
  65: "강한 비",                   // Heavy rain :contentReference[oaicite:13]{index=13}
  66: "약한 언 비",                // Light freezing rain :contentReference[oaicite:14]{index=14}
  67: "강한 언 비",                // Heavy freezing rain :contentReference[oaicite:15]{index=15}
  71: "약한 눈",                   // Light snow :contentReference[oaicite:16]{index=16}
  73: "눈",                         // Moderate snow :contentReference[oaicite:17]{index=17}
  75: "강한 눈",                   // Heavy snow :contentReference[oaicite:18]{index=18}
  77: "눈알",                       // Snow grains (code 77) :contentReference[oaicite:19]{index=19}
  80: "약한 소나기비",             // Light rain showers :contentReference[oaicite:20]{index=20}
  81: "소나기비",                   // Moderate rain showers :contentReference[oaicite:21]{index=21}
  82: "강한 소나기비",             // Violent rain showers :contentReference[oaicite:22]{index=22}
  85: "약한 소나기눈",             // Light snow showers :contentReference[oaicite:23]{index=23}
  86: "강한 소나기눈",             // Heavy snow showers :contentReference[oaicite:24]{index=24}
  95: "뇌우",                       // Thunderstorm :contentReference[oaicite:25]{index=25}
  96: "약한 우박 동반 뇌우",       // Thunderstorm with slight hail :contentReference[oaicite:26]{index=26}
  99: "강한 우박 동반 뇌우"        // Thunderstorm with heavy hail :contentReference[oaicite:27]{index=27}
};

/**
 * JSON 응답(data)에서 날씨 레이블을 추출한다.
 * @param {object} data - Open‑Meteo API JSON
 * @returns {string}   - 한글 날씨 설명
 */
function getWeatherLabel(data) {
    console.log("getWeatherLabel called with data:", data);
  // current.weathercode 또는 current_weather.weathercode 둘 중 하나에 있을 수 있음
  const code =
    data?.current?.weathercode ??
    data?.current_weather?.weathercode;

  // 매핑표에 없으면 기본 문구 반환
  return WEATHER_LABEL[code] || "알 수 없는 날씨";
}
