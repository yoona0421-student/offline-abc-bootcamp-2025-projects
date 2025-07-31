const express = require('express');
const path = require('path');
const db = require('./database.js');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const port = 3000;

// EJS를 뷰 엔진으로 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 'public' 폴더를 정적 파일 경로로 설정
app.use(express.static(path.join(__dirname, 'public')));

// POST 요청의 body(본문)를 파싱하기 위한 미들웨어 설정
app.use(express.urlencoded({ extended: true }));

// 세션 미들웨어 설정
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

// 모든 템플릿에서 사용자 정보와 파티 정보에 접근할 수 있게 하는 미들웨어
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.message = req.session.message;
  delete req.session.message;
  
  // 로그인한 사용자의 파티 목록 가져오기
  if (req.session.user) {
    db.all(
      `SELECT p.* 
       FROM parties p 
       JOIN party_members pm ON p.id = pm.party_id 
       WHERE pm.user_name = ?`, 
      [req.session.user.name],
      (err, parties) => {
        if (err) {
          console.error('파티 목록 조회 실패:', err);
          res.locals.myParties = [];
        } else {
          res.locals.myParties = parties;
        }
        next();
      }
    );
  } else {
    next();
  }
});

// --- 파티 관련 라우트 ---
app.get('/', (req, res) => {
  const sql = "SELECT * FROM parties ORDER BY id DESC";
  db.all(sql, [], (err, rows) => {
    if (err) {
      req.session.message = { type: 'error', text: '서버 오류가 발생했습니다.' };
      return res.redirect('/');
    }
    res.render('index', { parties: rows, myParties: res.locals.myParties });
  });
});

app.get('/new-party', (req, res) => {
  if (!req.session.user) {
    req.session.message = { type: 'error', text: '로그인이 필요합니다.' };
    return res.redirect('/login');
  }
  res.render('new-party');
});

app.post('/party', (req, res) => {
  if (!req.session.user) {
    req.session.message = { type: 'error', text: '로그인이 필요합니다.' };
    return res.redirect('/login');
  }

  const { title, category, location, meet_time, max_members } = req.body;
  const host_name = req.session.user.name;
  const sql = `INSERT INTO parties (title, location, category, host_name, meet_time, max_members, current_members) 
               VALUES (?, ?, ?, ?, ?, ?, 1)`;
  const params = [title, location, category, host_name, meet_time, max_members];
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('파티 생성 실패:', err.message);
      req.session.message = { type: 'error', text: '파티 생성에 실패했습니다.' };
      return res.redirect('/new-party');
    }

    // 파티 생성자를 party_members 테이블에 자동으로 추가
    const partyId = this.lastID;
    db.run('INSERT INTO party_members (party_id, user_name) VALUES (?, ?)',
      [partyId, host_name],
      (err) => {
        if (err) {
          console.error('파티 멤버 추가 실패:', err.message);
          req.session.message = { type: 'error', text: '파티 생성에 실패했습니다.' };
          return res.redirect('/new-party');
        }
        req.session.message = { type: 'success', text: '파티가 성공적으로 생성되었습니다!' };
        res.redirect('/');
      }
    );
  });
});

app.get('/party/:id', (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM parties WHERE id = ?", [id], (err, party) => {
    if (err) {
      req.session.message = { type: 'error', text: '서버 오류가 발생했습니다.' };
      return res.redirect('/');
    }
    if (!party) {
      req.session.message = { type: 'error', text: '해당 파티를 찾을 수 없습니다.' };
      return res.redirect('/');
    }

    // 파티 멤버 목록 가져오기
    db.all("SELECT user_name FROM party_members WHERE party_id = ?", [id], (err, members) => {
      if (err) {
        console.error('파티 멤버 목록 조회 실패:', err);
        req.session.message = { type: 'error', text: '서버 오류가 발생했습니다.' };
        return res.redirect('/');
      }
      const memberNames = members.map(member => member.user_name);

      // 댓글 목록 가져오기
      db.all("SELECT user_name, comment_text, created_at FROM comments WHERE party_id = ? ORDER BY created_at ASC", [id], (err, comments) => {
        if (err) {
          console.error('댓글 목록 조회 실패:', err);
          req.session.message = { type: 'error', text: '서버 오류가 발생했습니다.' };
          return res.redirect('/');
        }

        // 감정표현 목록 가져오기 (각 타입별 개수)
        db.all("SELECT reaction_type, COUNT(*) as count FROM reactions WHERE party_id = ? GROUP BY reaction_type", [id], (err, reactions) => {
          if (err) {
            console.error('감정표현 목록 조회 실패:', err);
            req.session.message = { type: 'error', text: '서버 오류가 발생했습니다.' };
            return res.redirect('/');
          }
          // reactions를 { type: count } 형태로 변환
          const reactionCounts = {};
          reactions.forEach(r => {
            reactionCounts[r.reaction_type] = r.count;
          });

          res.render('party-detail', {
            party: party,
            members: memberNames,
            comments: comments,
            reactionCounts: reactionCounts
          });
        });
      });
    });
  });
});

// 파티 수정 폼 보여주기
app.get('/party/:id/edit', (req, res) => {
  if (!req.session.user) {
    req.session.message = { type: 'error', text: '로그인이 필요합니다.' };
    return res.redirect('/login');
  }

  const id = req.params.id;
  db.get("SELECT * FROM parties WHERE id = ?", [id], (err, party) => {
    if (err) {
      req.session.message = { type: 'error', text: '서버 오류가 발생했습니다.' };
      return res.redirect('back');
    }
    if (!party) {
      req.session.message = { type: 'error', text: '파티를 찾을 수 없습니다.' };
      return res.redirect('back');
    }

    // 주최자만 수정 가능
    if (req.session.user.name !== party.host_name) {
      req.session.message = { type: 'error', text: '수정 권한이 없습니다.' };
      return res.redirect('/party/' + id);
    }

    res.render('edit-party', { party: party });
  });
});

// 파티 정보 업데이트
app.post('/party/:id/edit', (req, res) => {
  if (!req.session.user) {
    req.session.message = { type: 'error', text: '로그인이 필요합니다.' };
    return res.redirect('/login');
  }

  const id = req.params.id;
  const { title, category, location, meet_time, max_members } = req.body;
  const host_name = req.session.user.name; // 현재 로그인한 사용자가 주최자인지 확인하기 위함

  db.get("SELECT host_name FROM parties WHERE id = ?", [id], (err, party) => {
    if (err) {
      req.session.message = { type: 'error', text: '서버 오류가 발생했습니다.' };
      return res.redirect('back');
    }
    if (!party) {
      req.session.message = { type: 'error', text: '파티를 찾을 수 없습니다.' };
      return res.redirect('back');
    }

    // 주최자만 수정 가능
    if (host_name !== party.host_name) {
      req.session.message = { type: 'error', text: '수정 권한이 없습니다.' };
      return res.redirect('back');
    }

    const sql = `UPDATE parties SET title = ?, category = ?, location = ?, meet_time = ?, max_members = ? WHERE id = ?`;
    const params = [title, category, location, meet_time, max_members, id];

    db.run(sql, params, function(err) {
      if (err) {
        console.error('파티 업데이트 실패:', err.message);
        req.session.message = { type: 'error', text: '파티 업데이트에 실패했습니다.' };
        return res.redirect('back');
      }
      req.session.message = { type: 'success', text: '파티 정보가 성공적으로 업데이트되었습니다!' };
      res.redirect(`/party/${id}`);
    });
  });
});

app.post('/party/:id/join', (req, res) => {
  if (!req.session.user) {
    req.session.message = { type: 'error', text: '로그인이 필요합니다.' };
    return res.redirect('/login');
  }

  const { id } = req.params;
  const userName = req.session.user.name;

  // 이미 참여한 파티인지 확인
  db.get('SELECT * FROM party_members WHERE party_id = ? AND user_name = ?', 
    [id, userName], 
    (err, existingMember) => {
      if (err) {
        req.session.message = { type: 'error', text: '서버 오류가 발생했습니다.' };
        return res.redirect('/party/' + id);
      }
      
      if (existingMember) {
        req.session.message = { type: 'error', text: '이미 참여한 파티입니다.' };
        return res.redirect('/party/' + id);
      }

      // 파티 정보 확인 및 참여 처리
      db.get('SELECT * FROM parties WHERE id = ?', [id], (err, party) => {
        if (err) {
          req.session.message = { type: 'error', text: '서버 오류가 발생했습니다.' };
          return res.redirect('/party/' + id);
        }

        if (!party || party.current_members >= party.max_members) {
          req.session.message = { type: 'error', text: '파티가 가득 찼거나 존재하지 않습니다.' };
          return res.redirect('/party/' + id);
        }

        // 트랜잭션 시작
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          // 파티 멤버 추가
          db.run('INSERT INTO party_members (party_id, user_name) VALUES (?, ?)',
            [id, userName], 
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                req.session.message = { type: 'error', text: '파티 참여에 실패했습니다.' };
                return res.redirect('/party/' + id);
              }

              // 현재 인원 수 증가
              db.run('UPDATE parties SET current_members = current_members + 1 WHERE id = ?',
                [id],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    req.session.message = { type: 'error', text: '파티 참여에 실패했습니다.' };
                    return res.redirect('/party/' + id);
                  }

                  db.run('COMMIT');
                  req.session.message = { type: 'success', text: '파티에 성공적으로 참여했습니다!' };
                  res.redirect('/party/' + id);
                }
              );
            }
          );
        });
      });
    }
  );
});

// --- 사용자 인증 라우트 ---
app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  const { name, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (name, password) VALUES (?, ?)`;
    db.run(sql, [name, hashedPassword], function(err) {
      if (err) {
        console.error('회원가입 실패:', err.message);
        req.session.message = { type: 'error', text: '회원가입에 실패했습니다. 이미 사용 중인 이름이거나 서버 오류입니다.' };
        return res.redirect('back');
      }
      req.session.message = { type: 'success', text: '회원가입이 완료되었습니다. 로그인해주세요!' };
      res.redirect('/login');
    });
  } catch {
    req.session.message = { type: 'error', text: '회원가입에 실패했습니다. 서버 오류입니다.' };
    res.redirect('back');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { name, password } = req.body;
  const sql = `SELECT * FROM users WHERE name = ?`;
  db.get(sql, [name], async (err, user) => {
    if (err) {
      req.session.message = { type: 'error', text: '서버 오류가 발생했습니다.' };
      return res.redirect('back');
    }
    if (!user) {
      req.session.message = { type: 'error', text: '로그인에 실패했습니다. 사용자 이름 또는 비밀번호를 확인해주세요.' };
      return res.redirect('/login');
    }
    try {
      if (await bcrypt.compare(password, user.password)) {
        req.session.user = { id: user.id, name: user.name };
        req.session.message = { type: 'success', text: `${req.session.user.name}님, 환영합니다!` };
        res.redirect('/');
      } else {
        req.session.message = { type: 'error', text: '로그인에 실패했습니다. 사용자 이름 또는 비밀번호를 확인해주세요.' };
        res.redirect('/login');
      }
    } catch {
      req.session.message = { type: 'error', text: '로그인에 실패했습니다. 서버 오류입니다.' };
      res.redirect('/login');
    }
  });
});

app.get('/logout', (req, res) => {
  // 메시지를 먼저 설정하고 세션을 파괴합니다.
  req.session.message = { type: 'success', text: '로그아웃되었습니다.' };
  req.session.destroy((err) => {
    if (err) {
      console.error('로그아웃 실패:', err);
      // 세션 파괴 실패 시 메시지를 다시 에러로 설정
      req.session.message = { type: 'error', text: '로그아웃에 실패했습니다.' };
      return res.redirect('back');
    }
    res.redirect('/');
  });
});

// 파티 나가기 라우트
app.post('/party/:id/leave', (req, res) => {
  if (!req.session.user) {
    req.session.message = { type: 'error', text: '로그인이 필요합니다.' };
    return res.redirect('/login');
  }

  const { id } = req.params;
  const userName = req.session.user.name;

  // 파티 주최자는 파티를 나갈 수 없도록 제한
  db.get('SELECT host_name FROM parties WHERE id = ?', [id], (err, party) => {
    if (err) {
      console.error('파티 정보 조회 실패:', err.message);
      req.session.message = { type: 'error', text: '서버 오류가 발생했습니다.' };
      return res.redirect('back');
    }
    if (party && party.host_name === userName) {
      req.session.message = { type: 'error', text: '파티 주최자는 파티를 나갈 수 없습니다. 파티를 삭제하려면 파티 수정 페이지에서 삭제 버튼을 이용해주세요.' };
      return res.redirect('back');
    }

    // 트랜잭션 시작
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // party_members 테이블에서 멤버 삭제
      db.run('DELETE FROM party_members WHERE party_id = ? AND user_name = ?',
        [id, userName],
        (err) => {
          if (err) {
            db.run('ROLLBACK');
            req.session.message = { type: 'error', text: '파티 탈퇴에 실패했습니다.' };
            return res.redirect('back');
          }

          // 현재 인원 수 감소
          db.run('UPDATE parties SET current_members = current_members - 1 WHERE id = ?',
            [id],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                req.session.message = { type: 'error', text: '파티 탈퇴에 실패했습니다.' };
                return res.redirect('back');
              }

              db.run('COMMIT');
              req.session.message = { type: 'success', text: '파티에서 성공적으로 탈퇴했습니다!' };
              res.redirect('/');
            }
          );
        }
      );
    });
  });
});

// 파티 삭제 라우트
app.post('/party/:id/delete', (req, res) => {
  if (!req.session.user) {
    req.session.message = { type: 'error', text: '로그인이 필요합니다.' };
    return res.redirect('/login');
  }

  const { id } = req.params;
  const userName = req.session.user.name;

  db.get('SELECT host_name FROM parties WHERE id = ?', [id], (err, party) => {
    if (err) {
      console.error('파티 정보 조회 실패:', err.message);
      req.session.message = { type: 'error', text: '서버 오류가 발생했습니다.' };
      return res.redirect('back');
    }
    if (!party) {
      req.session.message = { type: 'error', text: '파티를 찾을 수 없습니다.' };
      return res.redirect('back');
    }

    // 주최자만 삭제 가능
    if (party.host_name !== userName) {
      req.session.message = { type: 'error', text: '삭제 권한이 없습니다.' };
      return res.redirect('back');
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // party_members 테이블에서 해당 파티의 모든 멤버 삭제
      db.run('DELETE FROM party_members WHERE party_id = ?', [id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          console.error('파티 멤버 삭제 실패:', err.message);
          req.session.message = { type: 'error', text: '파티 삭제에 실패했습니다.' };
          return res.redirect('back');
        }

        // parties 테이블에서 파티 삭제
        db.run('DELETE FROM parties WHERE id = ?', [id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            console.error('파티 삭제 실패:', err.message);
            req.session.message = { type: 'error', text: '파티 삭제에 실패했습니다.' };
            return res.redirect('back');
          }
          db.run('COMMIT');
          req.session.message = { type: 'success', text: '파티가 성공적으로 삭제되었습니다!' };
          res.redirect('/'); // 삭제 후 메인 페이지로 리다이렉트
        });
      });
    });
  });
});

app.post('/party/:id/delete', (req, res) => {
  if (!req.session.user) {
    req.session.message = { type: 'error', text: '로그인이 필요합니다.' };
    return res.redirect('/login');
  }

  const { id } = req.params;
  const userName = req.session.user.name;

  db.get('SELECT host_name FROM parties WHERE id = ?', [id], (err, party) => {
    if (err) {
      console.error('파티 정보 조회 실패:', err.message);
      req.session.message = { type: 'error', text: '서버 오류가 발생했습니다.' };
      return res.redirect('back');
    }
    if (!party) {
      req.session.message = { type: 'error', text: '파티를 찾을 수 없습니다.' };
      return res.redirect('back');
    }

    // 주최자만 삭제 가능
    if (party.host_name !== userName) {
      req.session.message = { type: 'error', text: '삭제 권한이 없습니다.' };
      return res.redirect('back');
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // party_members 테이블에서 해당 파티의 모든 멤버 삭제
      db.run('DELETE FROM party_members WHERE party_id = ?', [id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          console.error('파티 멤버 삭제 실패:', err.message);
          req.session.message = { type: 'error', text: '파티 삭제에 실패했습니다.' };
          return res.redirect('back');
        }

        // parties 테이블에서 파티 삭제
        db.run('DELETE FROM parties WHERE id = ?', [id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            console.error('파티 삭제 실패:', err.message);
            req.session.message = { type: 'error', text: '파티 삭제에 실패했습니다.' };
            return res.redirect('back');
          }
          db.run('COMMIT');
          req.session.message = { type: 'success', text: '파티가 성공적으로 삭제되었습니다!' };
          res.redirect('/'); // 삭제 후 메인 페이지로 리다이렉트
        });
      });
    });
  });
});

// 댓글 추가 라우트
app.post('/party/:id/comment', (req, res) => {
  if (!req.session.user) {
    req.session.message = { type: 'error', text: '로그인이 필요합니다.' };
    return res.redirect('/login');
  }

  const { id } = req.params;
  const { comment_text } = req.body;
  const userName = req.session.user.name;

  if (!comment_text || comment_text.trim() === '') {
    req.session.message = { type: 'error', text: '댓글 내용을 입력해주세요.' };
    return res.redirect('/party/' + id);
  }

  const sql = 'INSERT INTO comments (party_id, user_name, comment_text) VALUES (?, ?, ?)';
  db.run(sql, [id, userName, comment_text.trim()], (err) => {
    if (err) {
      console.error('댓글 추가 실패:', err.message);
      req.session.message = { type: 'error', text: '댓글 추가에 실패했습니다.' };
      return res.redirect('/party/' + id);
    }
    req.session.message = { type: 'success', text: '댓글이 성공적으로 추가되었습니다!' };
    res.redirect('/party/' + id);
  });
});

// 감정표현 추가 라우트
app.post('/party/:id/react', (req, res) => {
  if (!req.session.user) {
    req.session.message = { type: 'error', text: '로그인이 필요합니다.' };
    return res.redirect('/login');
  }

  const { id } = req.params;
  const { reaction_type } = req.body;
  const userName = req.session.user.name;

  if (!reaction_type || !['like', 'heart', 'haha', 'sad', 'angry'].includes(reaction_type)) {
    req.session.message = { type: 'error', text: '유효하지 않은 감정표현입니다.' };
    return res.redirect('/party/' + id);
  }

  // 이미 해당 파티에 동일한 감정표현을 남겼는지 확인
  db.get('SELECT * FROM reactions WHERE party_id = ? AND user_name = ? AND reaction_type = ?',
    [id, userName, reaction_type],
    (err, existingReaction) => {
      if (err) {
        console.error('감정표현 조회 실패:', err.message);
        req.session.message = { type: 'error', text: '감정표현 처리에 실패했습니다.' };
        return res.redirect('/party/' + id);
      }

      if (existingReaction) {
        // 이미 존재하면 삭제 (토글 기능)
        db.run('DELETE FROM reactions WHERE id = ?', [existingReaction.id], (err) => {
          if (err) {
            console.error('감정표현 삭제 실패:', err.message);
            req.session.message = { type: 'error', text: '감정표현 삭제에 실패했습니다.' };
            return res.redirect('/party/' + id);
          }
          req.session.message = { type: 'success', text: '감정표현이 취소되었습니다.' };
          res.redirect('/party/' + id);
        });
      } else {
        // 없으면 추가
        const sql = 'INSERT INTO reactions (party_id, user_name, reaction_type) VALUES (?, ?, ?)';
        db.run(sql, [id, userName, reaction_type], (err) => {
          if (err) {
            console.error('감정표현 추가 실패:', err.message);
            req.session.message = { type: 'error', text: '감정표현 추가에 실패했습니다.' };
            return res.redirect('/party/' + id);
          }
          req.session.message = { type: 'success', text: '감정표현이 추가되었습니다!' };
          res.redirect('/party/' + id);
        });
      }
    }
  );
});

// 서버 시작
app.listen(port, () => {
  console.log(`부캠런치 앱이 http://localhost:${port} 에서 실행 중입니다.`);
});