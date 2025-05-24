// src/config/db.js
const sqlite3 = require('sqlite3').verbose();
const path   = require('path');
const {DB_PATH} = require('../helpers/env')
// 1) DB 파일 경로 설정 (없으면 자동 생성)

// 2) 데이터베이스 열기

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('SQLITE 연결 오류:', err.message);
    process.exit(1);
  }
  console.log('✅ SQLite DB 연결됨:', DB_PATH);
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(res,err) {
      if (err) return reject(err);
      resolve({id: this.lastID, changes: this.changes });
    });
  });
}
// 모든 행을 다 가져온다.
function all(sql, params = []) {
  return new Promise((reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}
// 하나만 가져온다.
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

module.exports = {
  db,
  run,
  all,
  get,
};