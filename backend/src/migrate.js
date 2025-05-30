// migrate.js
const fs   = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { DB_PATH } = require('./config/env');

(async () => {

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
  // 2) migrations 테이블이 없으면 생성 (적용된 마이그레이션 기록용)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      name    TEXT PRIMARY KEY,
      run_on  DATETIME NOT NULL
    );
  `);
  // 3) migrations 폴더에서 .sql 파일 목록 불러오기
  const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
  // 4) 각 .sql 마이그레이션 파일 실행
  for (const file of files) {
    const name = file;
    const applied = await db.get(
      'SELECT name FROM migrations WHERE name = ?',
      name
    );
    // 이미 적용된 마이그레이션은 건너뜀
    if (applied) {
      console.log(`⏭  Skipping already applied: ${name}`);
      continue;
    }

    console.log(`🚀 Applying migration: ${name}`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await db.exec(sql);

    // 적용된 마이그레이션 이름 기록
    await db.run(
      'INSERT INTO migrations(name, run_on) VALUES(?, datetime("now"))',
      name
    );
    console.log(`Migrated ${name}`);
  }

  // 6) 종료
  await db.close();
  console.log('All migrations finished');
})().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});