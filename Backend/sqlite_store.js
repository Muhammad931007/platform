// Zero-dependency SQLite document repository using Node 24's built-in driver.
// Each collection remains a JSON document, while transactions, locking and
// durable single-file storage are provided by SQLite.
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, 'data');
const SQLITE_PATH = path.join(DATA_DIR, 'erp.sqlite');
const JSON_PATH = path.join(DATA_DIR, 'db.json');

function open() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(SQLITE_PATH);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; CREATE TABLE IF NOT EXISTS documents (collection TEXT NOT NULL, doc_key TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(collection, doc_key));');
  return db;
}

function migrateIfEmpty(db) {
  const count = db.prepare('SELECT COUNT(*) AS count FROM documents').get().count;
  if (Number(count) !== 0 || !fs.existsSync(JSON_PATH)) return;
  const source = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  const insert = db.prepare('INSERT INTO documents(collection, doc_key, payload) VALUES (?, ?, ?)');
  db.exec('BEGIN');
  try {
    for (const [collection, value] of Object.entries(source)) insert.run(collection, 'root', JSON.stringify(value));
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

function readDocument() {
  const db = open();
  try {
    migrateIfEmpty(db);
    const result = {};
    for (const row of db.prepare('SELECT collection, payload FROM documents').all()) result[row.collection] = JSON.parse(row.payload);
    return result;
  } finally { db.close(); }
}

function writeDocument(document) {
  const db = open();
  const backup = JSON_PATH + '.bak';
  try {
    if (fs.existsSync(JSON_PATH)) fs.copyFileSync(JSON_PATH, backup);
    db.exec('BEGIN IMMEDIATE');
    db.exec('DELETE FROM documents');
    const insert = db.prepare('INSERT INTO documents(collection, doc_key, payload) VALUES (?, ?, ?)');
    for (const [collection, value] of Object.entries(document)) insert.run(collection, 'root', JSON.stringify(value));
    db.exec('COMMIT');
    fs.writeFileSync(JSON_PATH, JSON.stringify(document, null, 2) + '\n', 'utf8');
  } catch (error) { try { db.exec('ROLLBACK'); } catch (_) {} throw error; }
  finally { db.close(); }
}

module.exports = { SQLITE_PATH, readDocument, writeDocument };
