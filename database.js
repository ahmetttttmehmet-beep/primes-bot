const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// data klasörü yoksa oluştur
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const db = new Database(path.join(dataDir, 'bot.db'));

// Tabloları oluştur (yoksa)
db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT,
        user_id TEXT,
        category TEXT,
        status TEXT DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS klan_basvurular (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        oyun_adi TEXT,
        tier TEXT,
        aktivite TEXT,
        mikrofon TEXT,
        deneyim TEXT,
        status TEXT DEFAULT 'pending',
        message_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ses_istatistik (
        user_id TEXT PRIMARY KEY,
        total_seconds INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cekilisler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT,
        channel_id TEXT,
        prize TEXT,
        winner_count INTEGER,
        end_time DATETIME,
        status TEXT DEFAULT 'active'
    );
`);

console.log('✅ Veritabanı hazır');
module.exports = db;