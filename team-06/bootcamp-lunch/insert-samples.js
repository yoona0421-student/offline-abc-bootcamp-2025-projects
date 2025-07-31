const db = require('./database.js');
const bcrypt = require('bcrypt');

// 샘플 호스트 사용자 생성
async function createSampleData() {
  try {
    // 샘플 사용자 생성
    const password = await bcrypt.hash('test123', 10);
    db.run('INSERT OR IGNORE INTO users (name, password) VALUES (?, ?)', ['샘플호스트', password]);

    // 샘플 파티 데이터
    const parties = [
      {
        title: '김치찌개 먹으러 가실 분!',
        location: 'ABC 부트캠프 근처 한식당',
        category: '한식',
        host_name: '샘플호스트',
        meet_time: '12:30',
        max_members: 4,
        current_members: 1
      },
      {
        title: '로제파스타 맛집 탐방',
        location: '부트캠프 뒷길 파스타집',
        category: '양식',
        host_name: '샘플호스트',
        meet_time: '12:00',
        max_members: 6,
        current_members: 1
      },
      {
        title: '오늘은 초밥 어때요?',
        location: '역 앞 스시히로',
        category: '일식',
        host_name: '샘플호스트',
        meet_time: '11:45',
        max_members: 3,
        current_members: 1
      }
    ];

    // 파티 데이터 삽입
    parties.forEach(party => {
      db.run(
        `INSERT INTO parties (title, location, category, host_name, meet_time, max_members, current_members)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [party.title, party.location, party.category, party.host_name, party.meet_time, party.max_members, party.current_members],
        function(err) {
          if (err) {
            console.error('파티 생성 실패:', err);
            return;
          }

          // 파티 생성자를 party_members에 추가
          const partyId = this.lastID;
          db.run('INSERT INTO party_members (party_id, user_name) VALUES (?, ?)',
            [partyId, party.host_name],
            (err) => {
              if (err) {
                console.error('파티 멤버 추가 실패:', err);
              }
            }
          );
        }
      );
    });

    console.log('샘플 데이터가 성공적으로 추가되었습니다.');
    console.log('샘플 계정 - 이름: 샘플호스트, 비밀번호: test123');

    // 5초 후 프로그램 종료
    setTimeout(() => process.exit(), 5000);
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  }
}

createSampleData();
