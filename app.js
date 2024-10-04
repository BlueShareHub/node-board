require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const connection = require('./config/db'); // 데이터베이스 연결 정보 가져오기

const app = express();
const port = 3000;
const limit = 10;  // 한 페이지당 게시글 수

// 미들웨어 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// EJS를 템플릿 엔진으로 설정
app.set('view engine', 'ejs');

// 정적 파일 제공 (CSS, JS 등)
app.use(express.static('public'));

// 게시판 목록 라우트
app.get('/board/list', (req, res) => {
  const search_type = req.query.search_type || 'title';
  const search = req.query.search || '';
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  // 총 게시글 수 및 게시글 목록 조회
  const countSql = `SELECT COUNT(*) AS total FROM php_board WHERE ${search_type} LIKE ?`;
  connection.query(countSql, [`%${search}%`], (err, countResult) => {
    if (err) return res.status(500).send('DB 조회 중 오류 발생');

    const total_posts = countResult[0].total;
    const total_pages = Math.ceil(total_posts / limit);

    const listSql = `
      SELECT b.id, b.title, b.author, b.views, b.created_at, 
      (SELECT COUNT(*) FROM php_comments c WHERE c.post_id = b.id) AS comment_count 
      FROM php_board b WHERE b.${search_type} LIKE ? 
      ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;

    connection.query(listSql, [`%${search}%`, limit, offset], (err, results) => {
      if (err) return res.status(500).send('DB 조회 중 오류 발생');
      
      res.render('list', {
        posts: results,
        page,
        total_pages,
        limit,
        total_posts,
        search_type,
        search
      });
    });
  });
});

// 글쓰기 페이지 라우트 (GET 요청)
app.get('/board/write', (req, res) => {
  res.render('write');
});

// 글쓰기 저장 라우트 (POST 요청)
app.post('/board/write', (req, res) => {
  const { title, author, content, password } = req.body;

  if (!title || !author || !content || !password) {
    return res.status(400).send('모든 필드를 입력해주세요.');
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).send('비밀번호 해시 처리 중 오류가 발생했습니다.');

    const sql = `INSERT INTO php_board (title, content, author, password_hash, views, created_at, updated_at)
                 VALUES (?, ?, ?, ?, 0, NOW(), NOW())`;
    connection.query(sql, [title, content, author, hashedPassword], (err) => {
      if (err) return res.status(500).send('게시글 저장 중 오류가 발생했습니다.');
      res.redirect('/board/list');
    });
  });
});

// 게시글 상세보기 및 댓글 처리
app.get('/board/view/:id', (req, res) => {
  const postId = req.params.id;

  const postSql = 'SELECT id, title, content, author, views, created_at FROM php_board WHERE id = ?';
  connection.query(postSql, [postId], (err, postResults) => {
    if (err || postResults.length === 0) {
      return res.status(404).send('해당 게시글을 찾을 수 없습니다.');
    }

    const updateViewsSql = 'UPDATE php_board SET views = views + 1 WHERE id = ?';
    connection.query(updateViewsSql, [postId], (updateErr) => {
      if (updateErr) console.error('조회수 증가 실패:', updateErr);
    });

    const post = postResults[0];

    const commentsSql = 'SELECT id, content, author, created_at FROM php_comments WHERE post_id = ? ORDER BY created_at DESC';
    connection.query(commentsSql, [postId], (commentErr, comments) => {
      if (commentErr) return res.status(500).send('댓글 가져오는 중 오류 발생');
      
      res.render('view', { post, comments, postId, commentsCount: comments.length });
    });
  });
});

// 비밀번호 확인 라우트
app.post('/board/edit_password_check/:id', (req, res) => {
  const postId = req.params.id;
  const { password } = req.body;

  const sql = "SELECT password_hash FROM php_board WHERE id = ?";
  connection.query(sql, [postId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).send("<script>alert('게시글을 찾을 수 없습니다.'); history.back();</script>");
    }

    const post = results[0];

    if (password === process.env.ADMIN_PASSWORD || bcrypt.compareSync(password, post.password_hash)) {
      res.redirect(`/board/edit/${postId}`);
    } else {
      res.status(403).send("<script>alert('비밀번호가 일치하지 않습니다.'); history.back();</script>");
    }
  });
});

// 게시글 수정 페이지 (GET 요청)
app.get('/board/edit/:id', (req, res) => {
  const postId = req.params.id;

  const postSql = "SELECT * FROM php_board WHERE id = ?";
  connection.query(postSql, [postId], (err, postResults) => {
    if (err || postResults.length === 0) {
      return res.status(500).send("<script>alert('게시글을 찾을 수 없습니다.'); history.back();</script>");
    }

    const post = postResults[0];

    const commentSql = "SELECT COUNT(*) AS comment_count FROM php_comments WHERE post_id = ?";
    connection.query(commentSql, [postId], (err, commentResults) => {
      if (err) return res.status(500).send("<script>alert('댓글 수를 가져올 수 없습니다.'); history.back();</script>");

      const comment_count = commentResults[0].comment_count;

      res.render('edit', { post, comment_count });
    });
  });
});

// 게시글 수정 처리 (POST 요청)
app.post('/board/edit/:id', (req, res) => {
  const postId = req.params.id;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).send("<script>alert('모든 필드를 입력해주세요.'); history.back();</script>");
  }

  const updatePostSql = "UPDATE php_board SET title = ?, content = ?, updated_at = NOW() WHERE id = ?";
  connection.query(updatePostSql, [title, content, postId], (err) => {
    if (err) return res.status(500).send("<script>alert('게시글 수정 중 오류가 발생했습니다.'); history.back();</script>");
    res.redirect(`/board/view/${postId}`);
  });
});

// 게시글 삭제 라우터
app.post('/board/delete', (req, res) => {
  const { id, password } = req.body;

  if (!id || !password) return res.status(400).send("<script>alert('잘못된 요청입니다.'); history.back();</script>");

  const selectPostSql = 'SELECT password_hash FROM php_board WHERE id = ?';
  connection.query(selectPostSql, [id], (err, results) => {
    if (err) return res.status(500).send('DB 조회 중 오류 발생');

    const post = results[0];

    if (!post) return res.status(404).send("<script>alert('해당 게시글을 찾을 수 없습니다.'); history.back();</script>");

    if (password === process.env.ADMIN_PASSWORD || bcrypt.compareSync(password, post.password_hash)) {
      const deletePostSql = 'DELETE FROM php_board WHERE id = ?';
      connection.query(deletePostSql, [id], (err) => {
        if (err) return res.status(500).send('DB 삭제 중 오류 발생');
        res.send("<script>alert('게시글이 성공적으로 삭제되었습니다.'); window.location.href = '/board/list';</script>");
      });
    } else {
      res.send("<script>alert('비밀번호가 일치하지 않습니다.'); history.back();</script>");
    }
  });
});

// 댓글 저장 처리 라우트
app.post('/board/view/:id', (req, res) => {
  const postId = req.params.id;
  const { content, author, password } = req.body;

  if (!content || !author || !password) return res.status(400).send('모든 필드를 입력해주세요.');

  const passwordHash = bcrypt.hashSync(password, 10);

  const sql = 'INSERT INTO php_comments (post_id, content, author, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())';
  connection.query(sql, [postId, content, author, passwordHash], (err) => {
    if (err) return res.status(500).send('댓글 저장 중 오류 발생');
    res.redirect(`/board/view/${postId}`);
  });
});

// 댓글 삭제
app.post('/board/delete_comment', (req, res) => {
  const { comment_id, post_id, password } = req.body;

  if (!comment_id || !post_id || !password) {
    return res.status(400).send("<script>alert('잘못된 요청입니다.'); history.back();</script>");
  }

  const getCommentSql = "SELECT password_hash FROM php_comments WHERE id = ?";
  connection.query(getCommentSql, [comment_id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).send("<script>alert('해당 댓글을 찾을 수 없습니다.'); history.back();</script>");
    }

    const comment = results[0];
    const adminPassword = process.env.ADMIN_PASSWORD;

    bcrypt.compare(password, comment.password_hash, (err, isMatch) => {
      if (err || (!isMatch && password !== adminPassword)) {
        return res.status(403).send("<script>alert('비밀번호가 일치하지 않습니다.'); history.back();</script>");
      }

      const deleteCommentSql = "DELETE FROM php_comments WHERE id = ?";
      connection.query(deleteCommentSql, [comment_id], (err) => {
        if (err) return res.status(500).send("<script>alert('댓글 삭제 중 오류가 발생했습니다.'); history.back();</script>");
        res.send(`<script>alert('정상적으로 삭제되었습니다.'); window.location.href = '/board/view/${post_id}';</script>`);
      });
    });
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
