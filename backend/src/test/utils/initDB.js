// src/config/initInMemoryDb.js
const path = require('path');
const fs = require('fs');
const { db } = require('../../config/db');

async function initInMemoryDb() {
  // 1) 메모리 DB 오픈
  

  // 2) 스키마 SQL 읽어오기 (migrations 폴더에 .sql로 뒀을 때)
  const migrDir = path.join(__dirname,'..' ,'../migrations');
  const files = fs.readdirSync(migrDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrDir, file), 'utf8');
    await db.exec(sql);
  }

  return db;
}

module.exports = initInMemoryDb;