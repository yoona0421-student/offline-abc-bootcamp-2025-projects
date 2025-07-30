
import tkinter as tk
from tkinter import ttk, messagebox
import requests

# --- 웹 앱 로직을 Python으로 변환 ---

ROLE_PRIORITY = {
    'elementary': {'keyword': '공부', 'priority': 2},
    'middle': {'keyword': '공부', 'priority': 3},
    'high': {'keyword': '공부', 'priority': 4},
    'university': {'keyword': '리포트', 'priority': 3},
    'graduate': {'keyword': '연구', 'priority': 4},
    'worker': {'keyword': '업무', 'priority': 3},
    'freelancer': {'keyword': '프로젝트', 'priority': 3},
    'etc': {'keyword': '기타', 'priority': 1}
}

def predict_time(task):
    if '수학' in task: return 60
    if '사회' in task: return 40
    if '영어' in task: return 30
    if '리포트' in task: return 90
    if '업무' in task: return 80
    if '독서' in task: return 45
    if len(task) >= 10: return 60
    return 30

# --- GUI 애플리케이션 ---

class ScheduleApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("오늘의 일정 우선순위 앱")
        self.geometry("700x600")

        # 공유 데이터
        self.schedules = []

        # 페이지를 담을 컨테이너
        container = tk.Frame(self)
        container.pack(side="top", fill="both", expand=True)
        container.grid_rowconfigure(0, weight=1)
        container.grid_columnconfigure(0, weight=1)

        self.frames = {}
        for F in (MainPage, PriorityPage, EmotionPage):
            page_name = F.__name__
            frame = F(parent=container, controller=self)
            self.frames[page_name] = frame
            frame.grid(row=0, column=0, sticky="nsew")

        self.show_frame("MainPage")

    def show_frame(self, page_name):
        frame = self.frames[page_name]
        frame.tkraise()
        # 페이지 전환 시 데이터 업데이트가 필요한 경우
        if hasattr(frame, 'on_show'):
            frame.on_show()

class MainPage(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent)
        self.controller = controller
        self.task_entries = []

        label = ttk.Label(self, text="TODO LIST", font=("Helvetica", 18, "bold"))
        label.pack(pady=20)

        # 직종 선택
        role_frame = ttk.Frame(self)
        role_frame.pack(pady=10)
        ttk.Label(role_frame, text="직종 선택:").pack(side="left", padx=5)
        self.role_select = ttk.Combobox(role_frame, values=list(ROLE_PRIORITY.keys()))
        self.role_select.pack(side="left")
        self.role_select.set('worker') # 기본값

        # 일정 입력
        self.tasks_frame = ttk.Frame(self)
        self.tasks_frame.pack(pady=10)
        ttk.Label(self.tasks_frame, text="일정 입력:").pack()
        
        self.add_task_input() # 초기 입력란 1개

        # 버튼
        btn_frame = ttk.Frame(self)
        btn_frame.pack(pady=20)

        add_task_btn = ttk.Button(btn_frame, text="일정 입력란 추가", command=self.add_task_input)
        add_task_btn.pack(side="left", padx=5)

        priority_btn = ttk.Button(btn_frame, text="우선순위 보기", command=self.show_priority)
        priority_btn.pack(side="left", padx=5)

        emotion_btn = ttk.Button(btn_frame, text="감정분석 계획", command=lambda: controller.show_frame("EmotionPage"))
        emotion_btn.pack(side="left", padx=5)

    def add_task_input(self):
        task_wrapper = ttk.Frame(self.tasks_frame)
        task_wrapper.pack(pady=2)
        
        entry = ttk.Entry(task_wrapper, width=40)
        entry.pack(side="left", padx=5)
        
        remove_btn = ttk.Button(task_wrapper, text="삭제", command=lambda w=task_wrapper: self.remove_task_input(w))
        remove_btn.pack(side="left")
        
        self.task_entries.append((task_wrapper, entry))

    def remove_task_input(self, wrapper):
        for i, (w, e) in enumerate(self.task_entries):
            if w == wrapper:
                w.destroy()
                self.task_entries.pop(i)
                break

    def show_priority(self):
        role = self.role_select.get()
        if not role:
            messagebox.showwarning("입력 오류", "직종을 선택하세요.")
            return

        self.controller.schedules = []
        for _, entry in self.task_entries:
            task = entry.get().strip()
            if not task:
                continue
            
            duration = predict_time(task)
            role_info = ROLE_PRIORITY.get(role, ROLE_PRIORITY['etc'])
            self.controller.schedules.append({
                'role': role,
                'task': task,
                'duration': duration,
                'priority': role_info['priority'],
                'type': role_info['keyword'],
                'memo': ''
            })

        if not self.controller.schedules:
            messagebox.showinfo("정보", "처리할 일정이 없습니다.")
            return
            
        # 우선순위에 따라 정렬
        self.controller.schedules.sort(key=lambda x: (-x['priority'], x['duration']))
        
        self.controller.show_frame("PriorityPage")


class PriorityPage(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent)
        self.controller = controller

        label = ttk.Label(self, text="TODO LIST", font=("Helvetica", 18, "bold"))
        label.pack(pady=20)

        # 날짜 및 날씨 정보
        self.date_weather_label = ttk.Label(self, text="", font=("Helvetica", 10))
        self.date_weather_label.pack(pady=10)

        # 일정 목록
        self.list_frame = ttk.Frame(self)
        self.list_frame.pack(pady=10, fill="x", padx=20)

        # 메인으로 돌아가기 버튼
        back_btn = ttk.Button(self, text="메인으로", command=lambda: controller.show_frame("MainPage"))
        back_btn.pack(pady=20)

    def on_show(self):
        # 이 페이지가 표시될 때마다 호출됨
        self.update_date_weather()
        self.render_list()

    def update_date_weather(self):
        # 날짜 표시
        from datetime import datetime
        today = datetime.now()
        date_str = f"오늘 날짜: {today.strftime('%Y년 %m월 %d일')}"

        # 날씨 정보 가져오기
        weather_str = "날씨 정보를 가져올 수 없습니다."
        try:
            weather_url = "https://api.open-meteo.com/v1/forecast?latitude=37.555451&longitude=126.970413&current=temperature_2m,weathercode"
            response = requests.get(weather_url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                temp = data['current']['temperature_2m']
                weather_code = data['current']['weathercode']
                weather_desc = self.get_weather_label(weather_code)
                weather_str = f"현재 날씨: {weather_desc}, 온도: {temp}°C"
        except requests.RequestException:
            pass # 오류 발생 시 기본 메시지 사용
        
        self.date_weather_label.config(text=f"{date_str} | {weather_str}")

    def render_list(self):
        # 기존 목록 삭제
        for widget in self.list_frame.winfo_children():
            widget.destroy()

        # 새 목록 생성
        for i, item in enumerate(self.controller.schedules):
            item_frame = ttk.Frame(self.list_frame)
            item_frame.pack(fill="x", pady=2)
            
            text = f"[{item['type']}] {item['task']} - 예상 {item['duration']}분"
            ttk.Label(item_frame, text=text).pack(side="left", padx=10)
            
            memo_btn = ttk.Button(item_frame, text="메모", command=lambda index=i: self.open_memo(index))
            memo_btn.pack(side="right")

    def open_memo(self, index):
        item = self.controller.schedules[index]
        
        memo_win = tk.Toplevel(self)
        memo_win.title("메모 작성")
        memo_win.geometry("300x200")

        content = tk.Text(memo_win, height=8)
        content.pack(pady=10, padx=10, fill="both", expand=True)
        content.insert("1.0", item.get('memo', ''))

        def save_and_close():
            self.controller.schedules[index]['memo'] = content.get("1.0", "end-1c").strip()
            memo_win.destroy()

        save_btn = ttk.Button(memo_win, text="저장", command=save_and_close)
        save_btn.pack(pady=5)

    def get_weather_label(self, code):
        WEATHER_LABEL = {
            0: "맑음", 1: "대체로 맑음", 2: "부분적으로 흐림", 3: "흐림",
            45: "옅은 안개", 48: "상고대 안개", 51: "약한 이슬비", 53: "이슬비",
            55: "강한 이슬비", 61: "약한 비", 63: "비", 65: "강한 비",
            71: "약한 눈", 73: "눈", 75: "강한 눈", 80: "약한 소나기",
            81: "소나기", 82: "강한 소나기", 95: "뇌우"
        }
        return WEATHER_LABEL.get(code, "알 수 없는 날씨")


class EmotionPage(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent)
        self.controller = controller
        self.questions = [
            "1. 아침에 상쾌하게 일어났나요?", "2. 현재 에너지는 충분한가요?",
            "3. 오늘 집중이 잘 될 것 같나요?", "4. 몸 상태가 가볍고 좋은가요?",
            "5. 마음이 평온하고 안정적인가요?", "6. 최근 수면 상태는 원활한가요?",
            "7. 최근 식사는 규칙적으로 이루어지고 있나요?", "8. 지금 컨디션은 좋은 편인가요?",
            "9. 외출할 의향이 있나요?", "10. 오늘 하루에 기대가 되시나요?"
        ]
        self.vars = [tk.IntVar(value=3) for _ in self.questions]

        label = ttk.Label(self, text="🧠 집중력 기반 하루 추천기", font=("Helvetica", 16, "bold"))
        label.pack(pady=20)
        
        # 질문 프레임
        q_frame = ttk.Frame(self)
        q_frame.pack(pady=10, padx=20)

        for i, q_text in enumerate(self.questions):
            ttk.Label(q_frame, text=q_text).grid(row=i, column=0, sticky="w", pady=2)
            options_frame = ttk.Frame(q_frame)
            options_frame.grid(row=i, column=1, sticky="w")
            for val, text in enumerate(["전혀 아님", "아님", "보통", "그렇다", "완전 그렇다"], 1):
                ttk.Radiobutton(options_frame, text=text, variable=self.vars[i], value=val).pack(side="left")

        # 결과
        self.result_label = ttk.Label(self, text="", font=("Helvetica", 12, "bold"))
        self.result_label.pack(pady=20)

        # 버튼
        btn_frame = ttk.Frame(self)
        btn_frame.pack(pady=10)
        submit_btn = ttk.Button(btn_frame, text="오늘 일정 추천받기", command=self.show_result)
        submit_btn.pack(side="left", padx=5)
        back_btn = ttk.Button(btn_frame, text="메인으로", command=lambda: controller.show_frame("MainPage"))
        back_btn.pack(side="left", padx=5)

    def show_result(self):
        total_score = sum(var.get() for var in self.vars)
        
        if total_score <= 10: message = "😵 컨디션 최악입니다. 휴식을 최우선으로 하세요."
        elif total_score <= 20: message = "😟 에너지가 낮습니다. 가벼운 활동만 시도해보세요."
        elif total_score <= 30: message = "🙂 평균적인 컨디션입니다. 오전 중심으로 활동해보세요."
        elif total_score <= 40: message = "💪 꽤 좋은 상태입니다! 효율적으로 활동할 수 있어요."
        else: message = "🚀 최고의 컨디션입니다! 적극적으로 활동해보세요."
        
        self.result_label.config(text=message)


if __name__ == "__main__":
    app = ScheduleApp()
    app.mainloop()
