// src/config/db.js

require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});


const sqlite3 = require('sqlite3').verbose();
const {DB_PATH, APP_NAME} = require('./env');

// database 연결
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('SQLITE 연결 오류:', err.message);
    process.exit(1);
  }
});
// sql 명령어 실행: CREATE, DELETE, UPDATE
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(res,err) {
      if (err) return reject(err);
      resolve({id: this.lastID, changes: this.changes });
    });
  });
}
// 모든 행을 SELECT
function all(sql, params = []) {
  return new Promise((resolve,reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}
// 하나만 SELECT
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function initializeDB() {
  const isExistAI = await get("SELECT * FROM User WHERE user_id=?", [APP_NAME]);
  if(!isExistAI) await run('INSERT INTO User(user_id) VALUES(?)', APP_NAME);
}

module.exports = {
  db,
  run,
  all,
  get,
  initializeDB
};