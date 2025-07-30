# ===============================================================
# 웹 기반 마피아 게임 코드 (최종 기능 완성판)
# 기능 포함: 모든 플레이어가 투표를 완료하면 즉시 개표 단계로 진행
# ===============================================================

import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template_string, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import random
from threading import Lock
import html

# --- 기본 설정 ---
app = Flask(__name__)
app.config['SECRET_KEY'] = 'the-perfect-mafia-game-is-finally-here!'
socketio = SocketIO(app, async_mode='eventlet')

# --- 전역 변수 ---
players, game_state, thread = {}, {}, None
thread_lock = Lock()
skip_to_vote_flag, skip_to_result_flag = False, False # [투표 스킵 기능 1] 개표 스킵을 위한 플래그
MAFIA_ROOM = 'mafia_room'
TIME_CONFIG = {'NIGHT': 30, 'DAY': 60, 'VOTING': 30}
ROLES_CONFIG = {
    4: ['마피아', '의사', '경찰', '시민'], 5: ['마피아', '의사', '경찰', '시민', '시민'],
    6: ['마피아', '마피아', '의사', '경찰', '시민', '시민'],
    7: ['마피아', '마피아', '의사', '경찰', '시민', '시민', '시민'],
    8: ['마피아', '마피아', '의사', '경찰', '시민', '시민', '시민', '시민'],
}

def reset_game_data():
    """모든 게임 데이터를 초기화하는 함수"""
    global players, game_state, thread, skip_to_vote_flag, skip_to_result_flag
    for sid in list(players.keys()): leave_room(MAFIA_ROOM, sid)
    players.clear()
    game_state.update({
        'phase': 'WAITING', 'day_count': 0, 'timer': 0, 'message': '참가자를 기다리는 중입니다...',
        'game_over_message': ''
    })
    skip_to_vote_flag, skip_to_result_flag = False, False
    with thread_lock: thread = None

# --- 프론트엔드 ---
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>마피아 게임 (최종 기능판)</title>
    <style>
        body{font-family:sans-serif;margin:0;padding:20px;background-color:#f0f2f5}#game-container{max-width:800px;margin:auto;background:white;padding:20px;border-radius:8px;box-shadow:0 0 10px rgba(0,0,0,.1)}h1,h2,h3,h4{text-align:center;margin-top:0}#status-bar{padding:15px;background:#333;color:white;text-align:center;border-radius:4px;margin-bottom:20px}#main-content{display:flex;gap:20px}#left-panel{flex:1}#right-panel{flex:2}.player{padding:10px;border:1px solid #ddd;margin-bottom:5px;border-radius:4px;display:flex;justify-content:space-between;align-items:center}.player.dead{text-decoration:line-through;color:#999;background:#f5f5f5}.action-button{background-color:#007bff;color:white;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;margin:2px;transition:background-color .2s}.action-button:hover{background-color:#0056b3}#skip-to-vote-button{background-color:#28a745}.chat-section{border:1px solid #ddd;border-radius:4px;display:flex;flex-direction:column;height:400px}.chat-section.mafia-chat{border-color:#8b0000}.chat-box{flex-grow:1;padding:10px;overflow-y:auto;border-bottom:1px solid #ddd}.chat-input-area{display:flex;padding:5px}.chat-input{flex-grow:1;border:1px solid #ccc;border-radius:4px;padding:8px}.chat-message{margin-bottom:5px;word-wrap:break-word}.chat-message.mafia{color:#8b0000}.chat-message.system{color:#00008b;font-style:italic}
        .action-button:disabled{background-color:#cccccc;cursor:not-allowed}.action-button.selected{background-color:#007bff !important;box-shadow:0 0 8px rgba(0,123,255,.7)}
    </style>
</head>
<body>
    <div id="game-container"><h1>마피아 게임</h1><div id="status-bar"><h2 id="phase"></h2><h3 id="timer"></h3><p id="message"></p></div><div id="role-info"></div><div id="login-section"><h3>이름 입력</h3><input type="text" id="name-input" placeholder="이름을 입력하세요"><button class="action-button" onclick="register()">참가하기</button></div><div id="game-section" style="display:none"><div id="main-content"><div id="left-panel"><h3>참가자 목록</h3><div id="players-list"></div><div id="actions-box"></div></div><div id="right-panel"><div id="public-chat-section" class="chat-section"><h4>공개 대화창</h4><div id="public-chat-box" class="chat-box"></div><div class="chat-input-area"><input type="text" id="public-chat-input" class="chat-input" placeholder="메시지를 입력하세요..."><button class="action-button" onclick="sendPublicChatMessage()">전송</button></div></div><div id="mafia-chat-section" class="chat-section mafia-chat" style="display:none"><h4>마피아 비밀 대화</h4><div id="mafia-chat-box" class="chat-box"></div><div class="chat-input-area"><input type="text" id="mafia-chat-input" class="chat-input" placeholder="팀원에게 메시지 보내기..."><button class="action-button" onclick="sendMafiaChatMessage()">비밀 전송</button></div></div></div></div><div id="bottom-controls" style="text-align:center;margin-top:20px"><button id="ready-button" class="action-button" onclick="playerReady()">준비완료</button><button id="start-button" class="action-button" onclick="startGame()">게임 시작</button><button id="reset-button" class="action-button" onclick="resetGame()" style="display:none">게임 초기화</button><div id="day-actions" style="display:none; margin-top:10px;"><button id="skip-to-vote-button" class="action-button" onclick="skipToVote()">투표 시작하기</button> <span id="skip-status"></span></div></div></div></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>
    <script>
        const socket=io();let mySid=null,myRole=null,myStatus="alive";function register(){const e=document.getElementById("name-input").value;e&&(socket.emit("register_player",{name:e}),document.getElementById("login-section").style.display="none",document.getElementById("game-section").style.display="block")}function sendPublicChatMessage(){const e=document.getElementById("public-chat-input");e.value.trim()&&socket.emit("send_chat",{message:e.value,isMafia:!1}),e.value=""}function sendMafiaChatMessage(){const e=document.getElementById("mafia-chat-input");e.value.trim()&&socket.emit("send_chat",{message:e.value,isMafia:!0}),e.value=""}document.getElementById("public-chat-input").addEventListener("keyup",e=>"Enter"===e.key&&sendPublicChatMessage()),document.getElementById("mafia-chat-input").addEventListener("keyup",e=>"Enter"===e.key&&sendMafiaChatMessage());function startGame(){socket.emit("start_game")}function resetGame(){socket.emit("reset_game")}function performAction(e){socket.emit("night_action",{target:e})}function voteForPlayer(e){socket.emit("submit_vote",{target:e})}function skipToVote(){socket.emit("skip_to_vote")}function playerReady(){socket.emit("player_ready")}socket.on("connect",()=>{mySid=socket.id}),socket.on("error",e=>alert("오류: "+e.message)),socket.on("police_result",e=>alert(`경찰 조사 결과: ${e.target}님은 [${e.role}] 입니다.`)),socket.on("receive_message",e=>{const t=e.isMafia?"mafia-chat-box":"public-chat-box",o=document.getElementById(t),n=document.createElement("div");n.classList.add("chat-message",e.isMafia&&"mafia",e.isSystem&&"system"),n.innerHTML=`<strong>${e.name}:</strong> ${e.message}`,o.appendChild(n),o.scrollTop=o.scrollHeight}),socket.on("game_update",e=>{const t={WAITING:"대기 중",NIGHT:"밤",DAY:"낮",VOTING:"투표",GAMEOVER:"게임 종료"};document.getElementById("phase").innerText=t[e.phase]||e.phase,document.getElementById("timer").innerText=e.timer>0?`남은 시간: ${e.timer}초`:"",document.getElementById("message").innerText=e.message;const o=document.getElementById("start-button"),n=document.getElementById("ready-button");document.getElementById("reset-button").style.display=e.host_sid===mySid&&"GAMEOVER"===e.phase?"inline-block":"none";const a=e.players.find(e=>e.sid===mySid);a&&(myRole=a.role,myStatus=a.alive?"alive":"dead",document.getElementById("role-info").innerHTML=myRole?`<h3>당신의 역할: ${myRole}${myStatus==="dead"?" (사망)":""}</h3>`:"");const l="alive"===myStatus;document.getElementById("public-chat-section").style.display="DAY"===e.phase?"flex":"none",document.getElementById("mafia-chat-section").style.display="NIGHT"===e.phase&&"마피아"===myRole?"flex":"none",document.getElementById("public-chat-input").disabled=!l,document.getElementById("mafia-chat-input").disabled=!l;const i=document.getElementById("day-actions");i.style.display="DAY"===e.phase&&l?"block":"none";const s=document.getElementById("skip-to-vote-button");if("WAITING"===e.phase){const t=e.host_sid===mySid;o.style.display=t?"inline-block":"none",n.style.display=t||!l?"none":"inline-block",o.disabled=!e.all_ready,o.innerText=e.all_ready?"게임 시작":"모두 준비 대기 중",a&&(n.disabled=a.is_ready,n.innerText=a.is_ready?"준비됨 ✓":"준비완료")}else o.style.display="none",n.style.display="none";if("DAY"===e.phase){const t=a?a.ready_for_vote:!1;s.disabled=t,s.innerText=t?"투표 준비 완료":"투표 시작하기",document.getElementById("skip-status").innerText=`(${e.ready_count}/${e.alive_count})`}"WAITING"!==e.phase&&"GAMEOVER"!==e.phase||(document.getElementById("public-chat-box").innerHTML="",document.getElementById("mafia-chat-box").innerHTML="");const c=document.getElementById("players-list");c.innerHTML="",e.players.forEach(e=>{let t=e.name;e.role&&(t+=` <span style="font-style:italic;color:#555">[${e.role}]</span>`),"WAITING"===e.phase&&e.is_ready&&e.sid!==e.host_sid&&(t+=' <span style="color:green;">✓</span>'),"VOTING"===e.phase&&e.voted&&(t+=' <span style="color:green;">✓</span>');const o=document.createElement("div");o.className=e.alive?"player":"player dead",o.innerHTML=t,c.appendChild(o)});const d=document.getElementById("actions-box");if(d.innerHTML="","alive"===myStatus){const r={NIGHT:"밤 행동",VOTING:"투표 대상 선택"}[e.phase];if(r){d.innerHTML=`<h4>${r}</h4>`;const m="NIGHT"===e.phase&&["마피아","의사","경찰"].includes(myRole),p="VOTING"===e.phase,u=a?a.action_target:null;e.players.forEach(e=>{if(p&&e.alive||m&&e.alive&&!("마피아"===myRole&&"마피아"===e.role)){const t=document.createElement("button");t.className="action-button",t.innerText=e.name,t.onclick=p?()=>voteForPlayer(e.name):()=>performAction(e.name),e.name===u&&t.classList.add("selected"),d.appendChild(t)}})}}});
    </script>
</body>
</html>
"""

# --- 백엔드 로직 ---
@app.route('/')
def index(): return render_template_string(HTML_TEMPLATE)

def get_payload(sid):
    my_data=players.get(sid); player_list=[]
    host_sid = list(players.keys())[0] if players else None
    for p_sid, p_data in players.items():
        info = {'sid': p_sid, 'name': p_data['name'], 'alive': p_data['alive'], 'role': None, 'action_target': None, 'ready_for_vote': p_data.get('ready_for_vote', False), 'is_ready': p_data.get('is_ready', False), 'voted': p_data.get('action_target') is not None and game_state.get('phase') == 'VOTING'}
        is_me=p_sid==sid; is_game_over=game_state.get('phase')=='GAMEOVER'; is_my_teammate=my_data and my_data.get('role')=='마피아' and p_data.get('role')=='마피아'
        if is_me or is_game_over or is_my_teammate: info['role'] = p_data['role']
        if is_me: info['action_target'] = p_data.get('action_target')
        player_list.append(info)
    alive_count = sum(1 for p in players.values() if p.get('alive'))
    ready_count = sum(1 for p in players.values() if p.get('alive') and p.get('ready_for_vote'))
    all_ready = all(p.get('is_ready', False) for s, p in players.items() if s != host_sid) if len(players) > 1 else False
    return {**game_state, 'players': player_list, 'host_sid': host_sid, 'alive_count': alive_count, 'ready_count': ready_count, 'all_ready': all_ready}

def broadcast_state():
    for sid in players: socketio.emit('game_update', get_payload(sid), room=sid)

def broadcast_message(name, message, is_mafia=False, is_system=False):
    payload = {'name': name, 'message': message, 'isMafia': is_mafia, 'isSystem': is_system}
    target = MAFIA_ROOM if is_mafia else list(players.keys())
    for sid in (target if isinstance(target, list) else [target]): socketio.emit('receive_message', payload, room=sid)

def game_loop():
    global skip_to_vote_flag, skip_to_result_flag
    while True:
        for p in players.values(): p.update({'action_target': None, 'ready_for_vote': False, 'is_ready': False})
        
        game_state.update({'phase': 'NIGHT', 'day_count': game_state['day_count'] + 1, 'message': f"{game_state['day_count'] + 1}일차 밤. 행동을 선택하세요."})
        broadcast_message("시스템", f"=== {game_state['day_count']}일차 밤입니다. 암살 대상을 논의하세요. ===", is_mafia=True, is_system=True)
        for i in range(TIME_CONFIG['NIGHT'], -1, -1): game_state['timer'] = i; broadcast_state(); socketio.sleep(1)
        
        night_actions={}; game_state['dead_last_night'],game_state['successful_save']=None,None
        for p in players.values():
            if p['alive'] and p.get('action_target'): night_actions[p['role']] = p['action_target']
        kill_target=night_actions.get('마피아'); save_target=night_actions.get('의사')
        if kill_target and kill_target == save_target: game_state['successful_save'] = kill_target
        elif kill_target:
            p_killed = next((p for p in players.values() if p['name'] == kill_target), None)
            if p_killed: p_killed['alive'] = False; game_state['dead_last_night'] = p_killed['name']
        if '경찰' in night_actions:
            p_police_sid = next((sid for sid, p in players.items() if p.get('role') == '경찰' and p.get('alive')), None)
            target = next((p for p in players.values() if p['name'] == night_actions['경찰']), None)
            if p_police_sid and target: role = '마피아' if target.get('role') == '마피아' else '시민팀'; socketio.emit('police_result', {'target': target['name'], 'role': role}, room=p_police_sid)
        if check_win_condition(): break

        skip_to_vote_flag = False;
        for p in players.values(): p.update({'action_target': None, 'ready_for_vote': False})
        game_state['phase'] = 'DAY';
        if game_state.get('successful_save'): game_state['message'] = f"의사가 {game_state['successful_save']}님을 살려냈습니다! 아무도 죽지 않았습니다."
        elif game_state.get('dead_last_night'): game_state['message'] = f"지난밤 {game_state['dead_last_night']}님이 사망했습니다. 토론을 시작하세요."
        else: game_state['message'] = "지난밤은 평화로웠습니다. 토론을 시작하세요."
        broadcast_message("시스템", f"=== {game_state['day_count']}일차 낮 토론 시작 ===", is_system=True)
        for i in range(TIME_CONFIG['DAY'], -1, -1):
            if skip_to_vote_flag: break
            game_state['timer'] = i; broadcast_state(); socketio.sleep(1)

        skip_to_result_flag = False; # [투표 스킵 기능 2] 투표 단계 시작 시 플래그 초기화
        for p in players.values(): p['action_target'] = None
        game_state.update({'phase': 'VOTING', 'message': "투표 시간입니다.", 'votes': {}})
        broadcast_message("시스템", "=== 투표가 시작되었습니다 ===", is_system=True)
        for i in range(TIME_CONFIG['VOTING'], -1, -1):
            if skip_to_result_flag: break # 플래그가 True가 되면 타이머 즉시 중단
            game_state['timer'] = i; broadcast_state(); socketio.sleep(1)

        votes = {};
        for p in players.values():
            if p['alive'] and p.get('action_target'): target = p['action_target']; votes[target] = votes.get(target, 0) + 1
        if votes:
            max_v = max(votes.values()); voted = [name for name, count in votes.items() if count == max_v]
            if len(voted) == 1:
                name = voted[0]; p_voted = next((p for p in players.values() if p['name'] == name), None)
                if p_voted: p_voted['alive'] = False; game_state['message'] = f"투표 결과, {name}({p_voted['role']})님이 처형되었습니다."; broadcast_message("시스템", f"{name}({p_voted['role']})님이 처형되었습니다.", is_system=True)
            else: game_state['message'] = "투표가 동률이라 아무도 처형되지 않았습니다."; broadcast_message("시스템", "투표가 동률로 무효 처리되었습니다.", is_system=True)
        else: game_state['message'] = "투표가 무효 처리되었습니다."; broadcast_message("시스템", "투표가 무효 처리되었습니다.", is_system=True)
        if check_win_condition(): break

    game_state.update({'phase': 'GAMEOVER', 'message': game_state['game_over_message']}); broadcast_state()

def check_win_condition():
    alive = [p for p in players.values() if p.get('alive')]; mafia = [p for p in alive if p.get('role') == '마피아']
    if not mafia: game_state['game_over_message'] = "모든 마피아를 잡았습니다. 시민팀의 승리!"; return True
    if len(mafia) >= len(alive) - len(mafia): game_state['game_over_message'] = "마피아 수가 시민 수 이상입니다. 마피아팀의 승리!"; return True
    return False

# --- 소켓 핸들러들 ---
@socketio.on('connect')
def handle_connect(): print(f"클라이언트 접속: {request.sid}")
@socketio.on('disconnect')
def handle_disconnect():
    if request.sid in players: del players[request.sid]; broadcast_state()
@socketio.on('register_player')
def handle_register(data):
    name = data.get('name', '').strip()
    if not name or any(p['name'] == name for p in players.values()): emit('error', {'message': '이름이 유효하지 않거나 중복됩니다.'}); return
    players[request.sid] = {'name': name, 'role': None, 'alive': True, 'action_target': None, 'ready_for_vote': False, 'is_ready': False}
    broadcast_state()
@socketio.on('start_game')
def handle_start_game():
    if not players or request.sid != list(players.keys())[0] or game_state['phase'] != 'WAITING': return
    host_sid = list(players.keys())[0]
    if not all(p.get('is_ready', False) for s, p in players.items() if s != host_sid): emit('error', {'message': '모든 플레이어가 준비를 완료해야 시작할 수 있습니다.'}); return
    num_players = len(players)
    if num_players not in ROLES_CONFIG: emit('error', {'message': f'{list(ROLES_CONFIG.keys())} 인원만 가능합니다.'}); return
    roles = ROLES_CONFIG[num_players][:]; random.shuffle(roles)
    for i, sid in enumerate(players.keys()): players[sid]['role'] = roles[i];
    if roles[i] == '마피아': join_room(MAFIA_ROOM, sid)
    global thread;
    with thread_lock:
        if thread is None: thread = socketio.start_background_task(target=game_loop)
@socketio.on('send_chat')
def handle_send_chat(data):
    sender = players.get(request.sid);
    if not sender or not sender.get('alive'): return
    is_mafia_chat = data.get('isMafia', False)
    is_day_chat_ok = not is_mafia_chat and game_state['phase'] == 'DAY'
    is_mafia_chat_ok = is_mafia_chat and sender.get('role') == '마피아' and game_state['phase'] == 'NIGHT'
    if is_day_chat_ok or is_mafia_chat_ok:
        message = html.escape(data.get('message', ''))
        if message: broadcast_message(sender['name'], message, is_mafia_chat)
@socketio.on('night_action')
def handle_night_action(data):
    p = players.get(request.sid)
    if p and p.get('alive') and game_state['phase'] == 'NIGHT': p['action_target'] = data.get('target'); broadcast_state()

@socketio.on('submit_vote')
def handle_submit_vote(data): # [투표 스킵 기능 3] 이 함수가 핵심
    global skip_to_result_flag
    p = players.get(request.sid)
    if p and p.get('alive') and game_state['phase'] == 'VOTING':
        p['action_target'] = data.get('target')
        # 모든 생존자가 투표했는지 확인
        alive_players = [pl for pl in players.values() if pl.get('alive')]
        if all(pl.get('action_target') for pl in alive_players):
            skip_to_result_flag = True # 모두 투표했다면 플래그를 True로 변경
        broadcast_state()

@socketio.on('skip_to_vote')
def handle_skip_to_vote():
    global skip_to_vote_flag
    p = players.get(request.sid)
    if p and p.get('alive') and game_state['phase'] == 'DAY' and not p.get('ready_for_vote'):
        p['ready_for_vote'] = True
        alive_count = sum(1 for pl in players.values() if pl.get('alive'))
        ready_count = sum(1 for pl in players.values() if pl.get('alive') and pl.get('ready_for_vote'))
        if ready_count >= (alive_count // 2) + 1:
            skip_to_vote_flag = True
        broadcast_state()
@socketio.on('player_ready')
def handle_player_ready():
    p = players.get(request.sid)
    host_sid = list(players.keys())[0] if players else None
    if p and game_state['phase'] == 'WAITING' and request.sid != host_sid:
        p['is_ready'] = True
        broadcast_state()

@socketio.on('reset_game')
def handle_reset_game():
    if not players or request.sid != list(players.keys())[0]: return
    reset_game_data(); print("호스트에 의해 게임이 초기화되었습니다."); broadcast_state()

if __name__ == '__main__':
    reset_game_data()
    print("마피아 게임 서버를 시작합니다. (최종 기능 완성판)")
    print("http://<당신의 IP 주소>:5000 으로 접속하세요.")
    socketio.run(app, host='0.0.0.0', port=5000)