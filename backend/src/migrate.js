// migrate.js
const fs   = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { DB_PATH } = require('./helpers/env');

(async () => {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      name    TEXT PRIMARY KEY,
      run_on  DATETIME NOT NULL
    );
  `);

  const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const name = file;
    const applied = await db.get(
      'SELECT name FROM migrations WHERE name = ?',
      name
    );

    if (applied) {
      console.log(`⏭  Skipping already applied: ${name}`);
      continue;
    }

    console.log(`🚀 Applying migration: ${name}`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await db.exec(sql);

    // 5) 적용 완료 표시
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