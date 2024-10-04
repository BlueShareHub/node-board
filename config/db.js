const mysql = require('mysql2');
require('dotenv').config(); // 환경 변수 로드

// 데이터베이스 연결 설정 및 연결 시도
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  charset: process.env.DB_CHARSET
});

connection.connect((err) => {
  if (err) {
    console.error('DB 연결 실패:', err);
  } else {
    console.log('DB 연결 성공');
  }
});

module.exports = connection;
