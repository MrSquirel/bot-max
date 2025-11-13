import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

// Инициализация базы данных
export async function initDatabase(dbPath = './data/homework.db') {
    try {
        // Создаем директорию для данных если не существует
        const fs = await import('fs');
        const dataDir = path.dirname(dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // Создаем таблицы если они не существуют
        await db.exec(`
            CREATE TABLE IF NOT EXISTS chats (
                chat_id TEXT PRIMARY KEY,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id TEXT,
                name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats (chat_id),
                UNIQUE(chat_id, name)
            );
            
            CREATE TABLE IF NOT EXISTS homeworks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id TEXT,
                subject_id INTEGER,
                type TEXT,
                content TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats (chat_id),
                FOREIGN KEY (subject_id) REFERENCES subjects (id)
            );

            CREATE TABLE IF NOT EXISTS user_sessions (
                chat_id TEXT PRIMARY KEY,
                upload_subject_id INTEGER,
                flag_update BOOLEAN DEFAULT 0,
                flag_upload BOOLEAN DEFAULT 0,
                count INTEGER DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats (chat_id)
            );
        `);
        
        console.log('✅ Database initialized at:', dbPath);
        return db;
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

// Функции для работы с базой данных
export async function ensureChatExists(chatId) {
    await db.run(
        'INSERT OR IGNORE INTO chats (chat_id) VALUES (?)',
        [chatId]
    );
}

export async function addSubject(chatId, subjectName) {
    await ensureChatExists(chatId);
    const result = await db.run(
        'INSERT INTO subjects (chat_id, name) VALUES (?, ?)',
        [chatId, subjectName]
    );
    return result.lastID;
}

export async function getSubjects(chatId) {
    await ensureChatExists(chatId);
    return await db.all(
        'SELECT id, name FROM subjects WHERE chat_id = ? ORDER BY created_at',
        [chatId]
    );
}

export async function addHomework(chatId, subjectId, type, content) {
    await ensureChatExists(chatId);
    const result = await db.run(
        'INSERT INTO homeworks (chat_id, subject_id, type, content) VALUES (?, ?, ?, ?)',
        [chatId, subjectId, type, content]
    );
    console.log(`✅ Homework saved: chat=${chatId}, subject=${subjectId}, type=${type}`);
    return result.lastID;
}

export async function getHomeworks(chatId, subjectId) {
    await ensureChatExists(chatId);
    return await db.all(
        'SELECT type, content FROM homeworks WHERE chat_id = ? AND subject_id = ? ORDER BY created_at',
        [chatId, subjectId]
    );
}

export async function clearChatData(chatId) {
    await db.run('DELETE FROM homeworks WHERE chat_id = ?', [chatId]);
    await db.run('DELETE FROM subjects WHERE chat_id = ?', [chatId]);
    await db.run('DELETE FROM user_sessions WHERE chat_id = ?', [chatId]);
    await db.run('DELETE FROM chats WHERE chat_id = ?', [chatId]);
    console.log(`✅ Data cleared for chat ${chatId}`);
}

// Функции для работы с сессиями
export async function getUserSession(chatId) {
    await ensureChatExists(chatId);
    const session = await db.get(
        'SELECT * FROM user_sessions WHERE chat_id = ?',
        [chatId]
    );
    
    if (session) {
        return {
            uploadSubjectId: session.upload_subject_id,
            flagUpdate: Boolean(session.flag_update),
            flagUpload: Boolean(session.flag_upload),
            count: session.count
        };
    }
    
    return {
        uploadSubjectId: null,
        flagUpdate: false,
        flagUpload: false,
        count: 0
    };
}

export async function updateUserSession(chatId, updates) {
    await ensureChatExists(chatId);
    
    const existing = await db.get(
        'SELECT * FROM user_sessions WHERE chat_id = ?',
        [chatId]
    );
    
    if (existing) {
        await db.run(
            `UPDATE user_sessions SET 
                upload_subject_id = ?,
                flag_update = ?,
                flag_upload = ?,
                count = ?,
                updated_at = CURRENT_TIMESTAMP
             WHERE chat_id = ?`,
            [
                updates.uploadSubjectId !== undefined ? updates.uploadSubjectId : existing.upload_subject_id,
                updates.flagUpdate !== undefined ? (updates.flagUpdate ? 1 : 0) : existing.flag_update,
                updates.flagUpload !== undefined ? (updates.flagUpload ? 1 : 0) : existing.flag_upload,
                updates.count !== undefined ? updates.count : existing.count,
                chatId
            ]
        );
    } else {
        await db.run(
            `INSERT INTO user_sessions 
                (chat_id, upload_subject_id, flag_update, flag_upload, count) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                chatId,
                updates.uploadSubjectId || null,
                updates.flagUpdate ? 1 : 0,
                updates.flagUpload ? 1 : 0,
                updates.count || 0
            ]
        );
    }
}

export async function clearUserSession(chatId) {
    await db.run(
        'UPDATE user_sessions SET upload_subject_id = NULL, flag_update = 0, flag_upload = 0, count = 0 WHERE chat_id = ?',
        [chatId]
    );
}

// Закрытие соединения с БД
export async function closeDatabase() {
    if (db) {
        await db.close();
        console.log('✅ Database connection closed');
    }
}

export default {
    initDatabase,
    ensureChatExists,
    addSubject,
    getSubjects,
    addHomework,
    getHomeworks,
    clearChatData,
    getUserSession,
    updateUserSession,
    clearUserSession,
    closeDatabase
};