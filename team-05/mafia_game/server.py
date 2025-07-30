# server.py - 의사/경찰 기능 강화 및 경찰 채팅 추가

from flask import Flask, render_template, request
from flask_socketio import SocketIO
import random
import threading
import time
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
socketio = SocketIO(app, cors_allowed_origins="*", ping_timeout=60, ping_interval=10)

# 역할 정의
ROLES = {
    'citizen': '시민',
    'mafia': '마피아', 
    'doctor': '의사',
    'police': '경찰'
}

# 게임 상태 변수들
players = {}
roles = {}
phase = "waiting"
votes = {}
night_actions = {}
doctor_actions = {}
police_actions = {}
nicknames = {}
game_started = False
day_count = 1

# 타이머 관련 변수들
phase_timer = None
phase_end_time = None
DAY_DURATION = 180  # 3분
NIGHT_DURATION = 60  # 1분

# 사회자
MODERATOR_NAME = "🎭 게임 사회자"

@app.route("/")
def index():
    return render_template("index.html")

def send_moderator_message(message):
    """사회자 메시지 전송"""
    socketio.emit("chat", {
        "nickname": MODERATOR_NAME,
        "message": message,
        "is_ai": False,
        "is_moderator": True
    })

def start_phase_timer(duration):
    """페이즈 타이머 시작"""
    global phase_timer, phase_end_time
    
    if phase_timer:
        phase_timer.cancel()
    
    phase_end_time = time.time() + duration
    socketio.emit("timer", {"duration": duration, "phase": phase})
    
    # 사회자 안내
    time_text = f"{duration//60}분" if duration >= 60 else f"{duration}초"
    if phase == "day":
        send_moderator_message(f"💬 토론 시간이 시작되었습니다! ({time_text})")
        threading.Timer(duration - 30, lambda: send_moderator_message("⚠️ 투표 마감까지 30초!")).start()
    else:
        send_moderator_message(f"🌙 특수 역할 행동 시간입니다. ({time_text})")
    
    phase_timer = threading.Timer(duration, end_phase)
    phase_timer.start()
    threading.Thread(target=update_timer, daemon=True).start()

def update_timer():
    """타이머 업데이트"""
    while phase_end_time and time.time() < phase_end_time and game_started:
        remaining = int(phase_end_time - time.time())
        if remaining >= 0:
            socketio.emit("timer_update", {"remaining": remaining})
        time.sleep(1)

def end_phase():
    """페이즈 종료"""
    global phase_timer, phase_end_time
    
    phase_timer = None
    phase_end_time = None
    
    if phase == "day":
        send_moderator_message("⏰ 투표 시간이 종료되었습니다!")
        threading.Timer(2.0, process_day_votes).start()
    else:
        send_moderator_message("🌅 밤이 끝났습니다!")
        threading.Timer(1.0, process_night_actions).start()

@socketio.on("join")
def handle_join(data):
    global game_started
    sid = request.sid
    nickname = data["nickname"]
    
    if nickname in nicknames.values() or not nickname.strip():
        socketio.emit("system", "이미 사용 중이거나 올바르지 않은 닉네임입니다.", room=sid)
        return
    
    nicknames[sid] = nickname
    
    if game_started:
        players[sid] = {"nickname": nickname, "alive": False, "is_spectator": True}
        send_moderator_message(f"👀 {nickname}님이 관전자로 입장했습니다.")
    else:
        players[sid] = {"nickname": nickname, "alive": True, "is_spectator": False}
        send_moderator_message(f"👋 {nickname}님이 게임에 참가했습니다. (현재 {len(players)}명)")
    
    socketio.emit("player_list", get_player_list(sid))

@socketio.on("start_game")
def handle_start_game():
    global game_started, phase, day_count
    
    if game_started:
        return
    
    active_players = [sid for sid in players.keys() if not players[sid].get("is_spectator", False)]
    
    if len(active_players) < 4:
        send_moderator_message(f"❌ 최소 4명이 필요합니다. (현재 {len(active_players)}명)")
        return
    
    game_started = True
    phase = "day"
    day_count = 1
    
    # 역할 배정
    total = len(active_players)
    num_mafia = max(1, total // 4)
    num_doctor = 1 if total >= 5 else 0
    num_police = min(2, total // 5) if total >= 6 else (1 if total >= 6 else 0)  # 경찰 최대 2명
    
    available = active_players.copy()
    
    # 마피아
    mafia_sids = random.sample(available, num_mafia)
    for sid in mafia_sids:
        roles[sid] = "mafia"
        available.remove(sid)
    
    # 의사
    if num_doctor > 0:
        doctor_sid = random.choice(available)
        roles[doctor_sid] = "doctor"
        available.remove(doctor_sid)
    
    # 경찰
    police_sids = []
    for _ in range(num_police):
        if available:
            police_sid = random.choice(available)
            roles[police_sid] = "police"
            police_sids.append(police_sid)
            available.remove(police_sid)
    
    # 나머지는 시민
    for sid in available:
        roles[sid] = "citizen"
    
    # 역할 정보 전송
    for sid in active_players:
        role_info = {
            "role": roles[sid],
            "teammates": []
        }
        
        if roles[sid] == "mafia":
            role_info["teammates"] = [nicknames[m] for m in mafia_sids if m != sid]
        elif roles[sid] == "police" and len(police_sids) > 1:
            role_info["teammates"] = [nicknames[p] for p in police_sids if p != sid]
        
        socketio.emit("your_role", role_info, room=sid)
    
    # 게임 시작 안내
    role_text = f"마피아 {num_mafia}명, 시민 {len([r for r in roles.values() if r == 'citizen'])}명"
    if num_doctor > 0:
        role_text += f", 의사 {num_doctor}명"
    if num_police > 0:
        role_text += f", 경찰 {num_police}명"
    
    send_moderator_message("🎮 마피아 게임을 시작합니다!")
    send_moderator_message(f"👥 참여자: {total}명 ({role_text})")
    
    socketio.emit("phase", {"phase": phase})
    socketio.emit("player_list", get_player_list())
    start_phase_timer(DAY_DURATION)

@socketio.on("chat")
def handle_chat(data):
    sid = request.sid
    if sid not in players:
        socketio.emit("system", "게임에 참가하지 않은 플레이어입니다.", room=sid)
        return
    
    # 관전자는 채팅 불가
    if players[sid].get("is_spectator", False):
        socketio.emit("system", "관전자는 채팅할 수 없습니다.", room=sid)
        return
        
    # 사망한 플레이어는 채팅 불가
    if not players[sid]["alive"]:
        socketio.emit("system", "사망한 플레이어는 대화할 수 없습니다.", room=sid)
        return
    
    # 낮 시간에만 일반 채팅 가능
    if phase != "day":
        socketio.emit("system", "낮 시간에만 대화할 수 있습니다.", room=sid)
        return
    
    nickname = nicknames.get(sid, "Unknown")
    message = data.get("message", "")
    socketio.emit("chat", {"nickname": nickname, "message": message, "is_ai": False, "is_moderator": False})

@socketio.on("mafia_chat")
def handle_mafia_chat(data):
    sid = request.sid
    if (sid not in players or roles.get(sid) != "mafia" or 
        players[sid].get("is_spectator", False) or not players[sid]["alive"]):
        return
    
    nickname = nicknames.get(sid, "Unknown")
    message = data.get("message", "")
    
    # 살아있는 마피아들에게만 전송
    alive_mafia = [s for s, role in roles.items() if role == "mafia" and players[s]["alive"]]
    for mafia_sid in alive_mafia:
        socketio.emit("mafia_chat", {"nickname": nickname, "message": message}, room=mafia_sid)

@socketio.on("police_chat")
def handle_police_chat(data):
    sid = request.sid
    if (sid not in players or roles.get(sid) != "police" or 
        players[sid].get("is_spectator", False) or not players[sid]["alive"]):
        return
    
    nickname = nicknames.get(sid, "Unknown")
    message = data.get("message", "")
    
    # 살아있는 경찰들에게만 전송
    alive_police = [s for s, role in roles.items() if role == "police" and players[s]["alive"]]
    for police_sid in alive_police:
        socketio.emit("police_chat", {"nickname": nickname, "message": message}, room=police_sid)

@socketio.on("vote")
def handle_vote(data):
    voter_sid = request.sid
    victim_nickname = data.get("target")
    
    if (phase != "day" or voter_sid not in players or not players[voter_sid]["alive"] or 
        players[voter_sid].get("is_spectator", False)):
        return
    
    votes[voter_sid] = victim_nickname
    voter_name = nicknames[voter_sid]
    socketio.emit("system", f"🗳️ {voter_name}님이 {victim_nickname}님에게 투표했습니다.")
    check_voting_complete()

@socketio.on("night_action")
def handle_night_action(data):
    actor_sid = request.sid
    target_nickname = data.get("target")
    action_type = data.get("action", "kill")
    
    if phase != "night":
        return
    
    actor_role = roles.get(actor_sid)
    
    if action_type == "kill" and actor_role == "mafia":
        night_actions[actor_sid] = target_nickname
        socketio.emit("system", f"🔪 {target_nickname}님을 대상으로 선택했습니다.", room=actor_sid)
    elif action_type == "heal" and actor_role == "doctor":
        doctor_actions[actor_sid] = target_nickname
        socketio.emit("system", f"💊 {target_nickname}님을 치료 대상으로 선택했습니다.", room=actor_sid)
    elif action_type == "investigate" and actor_role == "police":
        police_actions[actor_sid] = target_nickname
        socketio.emit("system", f"🔍 {target_nickname}님을 조사 대상으로 선택했습니다.", room=actor_sid)

def check_voting_complete():
    """투표 완료 여부 확인"""
    alive_players = [sid for sid, p in players.items() if p["alive"] and not p.get("is_spectator", False)]
    
    if len(votes) >= len(alive_players):
        send_moderator_message("✅ 모든 플레이어가 투표를 완료했습니다!")
        threading.Timer(3.0, process_day_votes).start()
    else:
        not_voted = [players[sid]["nickname"] for sid in alive_players if sid not in votes]
        socketio.emit("system", f"⏰ 투표 대기 중: {', '.join(not_voted)} ({len(not_voted)}명 남음)")

def process_day_votes():
    global phase, votes, day_count
    
    send_moderator_message("📊 투표 결과를 발표합니다!")
    
    if not votes:
        send_moderator_message("💫 투표가 없어 아무도 제거되지 않았습니다.")
    else:
        vote_count = {}
        for target_name in votes.values():
            vote_count[target_name] = vote_count.get(target_name, 0) + 1
        
        socketio.emit("system", "📊 투표 결과")
        for target, count in sorted(vote_count.items(), key=lambda x: x[1], reverse=True):
            socketio.emit("system", f"🗳️ {target}: {count}표")
        
        max_votes = max(vote_count.values())
        most_voted = [name for name, count in vote_count.items() if count == max_votes]
        
        if len(most_voted) == 1:
            victim_name = most_voted[0]
            victim_sid = next((sid for sid, info in players.items() if info["nickname"] == victim_name), None)
            
            if victim_sid:
                players[victim_sid]["alive"] = False
                victim_role = roles.get(victim_sid, "unknown")
                role_text = ROLES.get(victim_role, victim_role)
                
                socketio.emit("system", f"🪦 {victim_name}님이 제거되었습니다! (역할: {role_text})")
                send_moderator_message(f"🪦 {victim_name}님이 제거되었습니다. (역할: {role_text})")
        else:
            send_moderator_message("💫 동표로 아무도 제거되지 않았습니다.")
    
    votes.clear()
    socketio.emit("player_list", get_player_list())
    show_game_status()
    
    if not check_game_over():
        phase = "night"
        send_moderator_message("🌙 밤이 되었습니다. 특수 역할자들의 시간입니다.")
        socketio.emit("phase", {"phase": phase})
        socketio.emit("ui_update", {"phase": phase})
        handle_night_roles()
        start_phase_timer(NIGHT_DURATION)

def handle_night_roles():
    """밤 특수 역할 처리"""
    for sid, role in roles.items():
        if not players[sid]["alive"] or players[sid].get("is_spectator", False):
            continue
            
        if role == "mafia":
            targets = [p["nickname"] for s, p in players.items() 
                      if p["alive"] and roles.get(s) != "mafia" and not p.get("is_spectator", False)]
            if targets:
                socketio.emit("night_targets", {"targets": targets, "action": "kill"}, room=sid)
        elif role == "doctor":
            targets = [p["nickname"] for s, p in players.items() 
                      if p["alive"] and not p.get("is_spectator", False)]
            if targets:
                socketio.emit("night_targets", {"targets": targets, "action": "heal"}, room=sid)
        elif role == "police":
            targets = [p["nickname"] for s, p in players.items() 
                      if p["alive"] and s != sid and not p.get("is_spectator", False)]
            if targets:
                socketio.emit("night_targets", {"targets": targets, "action": "investigate"}, room=sid)

def process_night_actions():
    global phase, night_actions, doctor_actions, police_actions, day_count
    
    send_moderator_message("🌅 새로운 아침이 밝았습니다...")
    
    # 의사 치료 처리
    healed_players = set()
    if doctor_actions:
        for doctor_sid, target_name in doctor_actions.items():
            if players[doctor_sid]["alive"]:  # 살아있는 의사만
                healed_players.add(target_name)
                send_moderator_message(f"💊 의사가 {target_name}님을 치료했습니다.")
    
    # 경찰 조사 처리
    investigation_results = {}
    if police_actions:
        for police_sid, target_name in police_actions.items():
            if players[police_sid]["alive"]:  # 살아있는 경찰만
                target_sid = next((sid for sid, info in players.items() if info["nickname"] == target_name), None)
                if target_sid:
                    target_role = roles.get(target_sid, "citizen")
                    is_mafia = target_role == "mafia"
                    investigation_results[target_name] = is_mafia
                    
                    result = "🔴 마피아" if is_mafia else "🟢 시민"
                    socketio.emit("system", f"🔍 조사 결과: {target_name}님은 {result}입니다.", room=police_sid)
    
    # 마피아 살해 처리
    killed_players = []
    if night_actions:
        target_count = {}
        for target in night_actions.values():
            target_count[target] = target_count.get(target, 0) + 1
        
        if target_count:
            # 가장 많이 선택된 대상 처리
            victim_name = max(target_count, key=target_count.get)
            
            if victim_name in healed_players:
                send_moderator_message("💊 의사의 치료로 생명을 구했습니다!")
                socketio.emit("system", f"💊 {victim_name}님이 의사의 치료로 살아남았습니다!")
            else:
                victim_sid = next((sid for sid, info in players.items() if info["nickname"] == victim_name), None)
                if victim_sid and players[victim_sid]["alive"]:
                    players[victim_sid]["alive"] = False
                    victim_role = roles.get(victim_sid, "unknown")
                    role_text = ROLES.get(victim_role, victim_role)
                    killed_players.append((victim_name, role_text))
                    
                    socketio.emit("system", f"💀 {victim_name}님이 밤에 제거되었습니다! (역할: {role_text})")
                    send_moderator_message(f"💀 {victim_name}님이 밤에 제거되었습니다. (역할: {role_text})")
    
    # 밤 결과 종합 발표
    if not killed_players and not healed_players and not investigation_results:
        send_moderator_message("🌅 평화로운 밤이었습니다.")
    else:
        send_moderator_message("📋 밤 동안 일어난 일들:")
        if killed_players:
            for name, role in killed_players:
                send_moderator_message(f"💀 {name}님 사망 (역할: {role})")
        if healed_players and not killed_players:
            send_moderator_message("💊 의사가 누군가를 구했습니다!")
        if investigation_results:
            mafia_found = any(investigation_results.values())
            if mafia_found:
                send_moderator_message("🔍 경찰이 마피아를 발견했습니다!")
            else:
                send_moderator_message("🔍 경찰의 조사가 있었지만 마피아를 찾지 못했습니다.")
    
    night_actions.clear()
    doctor_actions.clear()
    police_actions.clear()
    
    socketio.emit("player_list", get_player_list())
    show_game_status()
    
    if not check_game_over():
        day_count += 1
        phase = "day"
        send_moderator_message(f"🌞 {day_count}일차가 시작되었습니다!")
        socketio.emit("phase", {"phase": phase})
        socketio.emit("ui_update", {"phase": phase})
        start_phase_timer(DAY_DURATION)

def show_game_status():
    """게임 상황 표시"""
    alive_players = [p["nickname"] for p in players.values() if p["alive"] and not p.get("is_spectator", False)]
    dead_players = [p["nickname"] for p in players.values() if not p["alive"] and not p.get("is_spectator", False)]
    
    mafia_count = len([sid for sid, role in roles.items() if role == "mafia" and players[sid]["alive"]])
    citizen_count = len([sid for sid, role in roles.items() if role != "mafia" and players[sid]["alive"] and not players[sid].get("is_spectator", False)])
    
    # 생존자 현황
    socketio.emit("system", "=" * 30)
    socketio.emit("system", "📊 현재 상황")
    socketio.emit("system", "=" * 30)
    socketio.emit("system", f"👥 생존자 ({len(alive_players)}명): {', '.join(alive_players)}")
    
    if dead_players:
        socketio.emit("system", f"💀 사망자 ({len(dead_players)}명): {', '.join(dead_players)}")
    
    socketio.emit("system", f"⚖️ 세력 균형: 마피아 {mafia_count}명 vs 시민계열 {citizen_count}명")
    socketio.emit("system", "=" * 30)
    
    # 사회자 안내
    send_moderator_message(f"⚖️ 세력 균형: 마피아 {mafia_count}명 vs 시민계열 {citizen_count}명")
    
    if dead_players:
        send_moderator_message(f"💀 사망자: {', '.join(dead_players)}")
    
    if mafia_count == citizen_count:
        send_moderator_message("🚨 경고! 마피아와 시민이 동수입니다!")
    elif mafia_count == citizen_count - 1:
        send_moderator_message("⚠️ 시민팀 위기! 한 명만 더 제거되면 마피아 승리!")
    elif mafia_count == 1:
        send_moderator_message("⚠️ 마피아가 1명 남았습니다! 시민팀 승리까지 한 걸음!")

def check_game_over():
    global game_started, phase_timer, phase_end_time
    
    mafia_alive = [sid for sid, role in roles.items() if role == "mafia" and players[sid]["alive"]]
    non_mafia_alive = [sid for sid, role in roles.items() if role != "mafia" and players[sid]["alive"] and not players[sid].get("is_spectator", False)]
    
    if not mafia_alive:
        # 시민팀 승리
        send_moderator_message("🎉 게임 종료! 시민팀의 승리입니다!")
        socketio.emit("system", "🎉 시민팀 승리! 모든 마피아가 제거되었습니다!")
        
        game_result_data = prepare_game_result_data("citizen")
        socketio.emit("game_result", game_result_data)
        
        reveal_all_roles()
        reset_game()
        return True
    elif len(mafia_alive) >= len(non_mafia_alive):
        # 마피아팀 승리
        send_moderator_message("💀 게임 종료! 마피아팀의 승리입니다!")
        socketio.emit("system", "💀 마피아팀 승리! 마피아가 시민과 같거나 많아졌습니다!")
        
        game_result_data = prepare_game_result_data("mafia")
        socketio.emit("game_result", game_result_data)
        
        reveal_all_roles()
        reset_game()
        return True
    
    return False

def prepare_game_result_data(win_team):
    """게임 결과 데이터 준비"""
    result_data = {
        "winTeam": win_team,
        "totalPlayers": len([p for p in players.values() if not p.get("is_spectator", False)]),
        "mafiaCount": len([sid for sid, role in roles.items() if role == "mafia"]),
        "citizenCount": len([sid for sid, role in roles.items() if role != "mafia" and not players[sid].get("is_spectator", False)]),
        "roles": {}
    }
    
    for sid, role in roles.items():
        if sid in players and not players[sid].get("is_spectator", False):
            player_name = players[sid]["nickname"]
            result_data["roles"][player_name] = {
                "role": role,
                "alive": players[sid]["alive"]
            }
    
    return result_data

def reveal_all_roles():
    """게임 종료 시 모든 역할 공개"""
    send_moderator_message("📋 최종 역할을 공개합니다!")
    socketio.emit("system", "📋 최종 역할 공개")
    
    for sid, role in roles.items():
        if sid in players:
            player_name = players[sid]["nickname"]
            role_name = ROLES.get(role, role)
            status = "생존" if players[sid]["alive"] else "사망"
            socketio.emit("system", f"🎭 {player_name}: {role_name} ({status})")

def reset_game():
    global phase, roles, votes, night_actions, doctor_actions, police_actions, game_started, day_count, phase_timer, phase_end_time
    
    if phase_timer:
        phase_timer.cancel()
        phase_timer = None
    phase_end_time = None
    
    phase = "waiting"
    game_started = False
    day_count = 1
    roles.clear()
    votes.clear()
    night_actions.clear()
    doctor_actions.clear()
    police_actions.clear()
    
    # 관전자들을 일반 플레이어로 변경
    for sid, player_info in players.items():
        if player_info.get("is_spectator", False):
            player_info["is_spectator"] = False
            player_info["alive"] = True
    
    send_moderator_message("🔄 새로운 게임을 시작할 수 있습니다!")
    socketio.emit("phase", {"phase": phase})
    socketio.emit("player_list", get_player_list())
    socketio.emit("timer_update", {"remaining": 0})
    socketio.emit("ui_update", {"phase": phase})
    socketio.emit("game_reset")

def get_player_list(current_sid=None):
    return [
        {
            "nickname": info["nickname"], 
            "alive": info["alive"],
            "is_ai": False,
            "is_spectator": info.get("is_spectator", False),
            "you": sid == current_sid if current_sid else False
        } 
        for sid, info in players.items()
    ]

@socketio.on("disconnect")
def handle_disconnect():
    sid = request.sid
    if sid in nicknames:
        nickname = nicknames[sid]
        send_moderator_message(f"👋 {nickname}님이 게임을 떠났습니다.")
        
        # 모든 관련 데이터 삭제
        for data_dict in [players, nicknames, roles, votes, night_actions, doctor_actions, police_actions]:
            data_dict.pop(sid, None)
        
        socketio.emit("player_list", get_player_list())
        
        if game_started:
            check_game_over()

@socketio.on("get_timer")
def handle_get_timer():
    if phase_end_time and game_started:
        remaining = max(0, int(phase_end_time - time.time()))
        socketio.emit("timer_update", {"remaining": remaining}, room=request.sid)

if __name__ == "__main__":
    print("\n=== 강화된 마피아 게임 ===")
    print("🌐 로컬 접속: http://localhost:5000")
    print("🌐 네트워크 접속: http://[본인IP]:5000")