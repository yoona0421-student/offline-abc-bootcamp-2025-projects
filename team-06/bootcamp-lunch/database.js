const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./bootcamp_lunch.db', (err) => {
  if (err) {
    console.error('데이터베이스 연결 실패:', err.message);
  } else {
    console.log('SQLite 데이터베이스에 성공적으로 연결되었습니다.');
  }
});

db.serialize(() => {
  // users 테이블 (name은 고유값, password 추가)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error('users 테이블 생성 실패:', err.message);
    }
  });

  // parties 테이블 (location, category 추가)
  db.run(`CREATE TABLE IF NOT EXISTS parties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    location TEXT,
    category TEXT,
    host_name TEXT NOT NULL,
    meet_time TEXT NOT NULL,
    max_members INTEGER NOT NULL,
    current_members INTEGER DEFAULT 1
  )`, (err) => {
    if (err) {
      console.error('parties 테이블 생성 실패:', err.message);
    }
  });

  // party_members 테이블 생성
  db.run(`CREATE TABLE IF NOT EXISTS party_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    party_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (party_id) REFERENCES parties (id),
    FOREIGN KEY (user_name) REFERENCES users (name),
    UNIQUE(party_id, user_name)
  )`, (err) => {
    if (err) {
      console.error('party_members 테이블 생성 실패:', err.message);
    }
  });

  // comments 테이블 생성
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    party_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (party_id) REFERENCES parties (id),
    FOREIGN KEY (user_name) REFERENCES users (name)
  )`, (err) => {
    if (err) {
      console.error('comments 테이블 생성 실패:', err.message);
    }
  });

  // reactions 테이블 생성
  db.run(`CREATE TABLE IF NOT EXISTS reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    party_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    reaction_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (party_id) REFERENCES parties (id),
    FOREIGN KEY (user_name) REFERENCES users (name),
    UNIQUE(party_id, user_name, reaction_type)
  )`, (err) => {
    if (err) {
      console.error('reactions 테이블 생성 실패:', err.message);
    }
  });
});

module.exports = db;
