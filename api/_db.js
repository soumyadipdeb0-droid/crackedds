import { sql } from '@vercel/postgres';

// Initialize database tables
export async function initDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      avatar VARCHAR(500),
      provider VARCHAR(50) DEFAULT 'email',
      google_id VARCHAR(255) UNIQUE,
      streak INTEGER DEFAULT 0,
      last_active DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic_id VARCHAR(50) NOT NULL,
      question_index INTEGER NOT NULL,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, topic_id, question_index)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic_id VARCHAR(50) NOT NULL,
      question_index INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, topic_id, question_index)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS case_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      case_id VARCHAR(50) NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      score INTEGER DEFAULT 0,
      completed_at TIMESTAMP,
      UNIQUE(user_id, case_id)
    )
  `;
}
let dbInitialized = false;
async function ensureDbInit() {
  if (dbInitialized) return;
  try {
    await initDatabase();
    dbInitialized = true;
  } catch(e) {
    console.error('Auto DB initialization error:', e);
  }
}


// User operations
export async function createUser({ email, passwordHash, name, avatar, provider = 'email', googleId = null }) {
  await ensureDbInit();
  const result = await sql`
    INSERT INTO users (email, password_hash, name, avatar, provider, google_id)
    VALUES (${email}, ${passwordHash}, ${name}, ${avatar || email[0].toUpperCase()}, ${provider}, ${googleId})
    RETURNING id, email, name, avatar, provider, streak
  `;
  return result.rows[0];
}

export async function getUserByEmail(email) {
  await ensureDbInit();
  const result = await sql`SELECT * FROM users WHERE email = ${email}`;
  return result.rows[0];
}

export async function getUserById(id) {
  await ensureDbInit();
  const result = await sql`SELECT id, email, name, avatar, provider, streak FROM users WHERE id = ${id}`;
  return result.rows[0];
}

export async function getUserByGoogleId(googleId) {
  await ensureDbInit();
  const result = await sql`SELECT * FROM users WHERE google_id = ${googleId}`;
  return result.rows[0];
}

export async function updateUserGoogleId(userId, googleId, avatar) {
  await ensureDbInit();
  await sql`UPDATE users SET google_id = ${googleId}, avatar = COALESCE(avatar, ${avatar}) WHERE id = ${userId}`;
}

export async function updateUserStreak(userId, streak) {
  await ensureDbInit();
  await sql`UPDATE users SET streak = ${streak}, last_active = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}`;
}

// Progress operations
export async function getProgress(userId) {
  await ensureDbInit();
  const result = await sql`
    SELECT topic_id, question_index FROM progress WHERE user_id = ${userId}
  `;
  return result.rows;
}

export async function addProgress(userId, topicId, questionIndex) {
  await ensureDbInit();
  await sql`
    INSERT INTO progress (user_id, topic_id, question_index)
    VALUES (${userId}, ${topicId}, ${questionIndex})
    ON CONFLICT (user_id, topic_id, question_index) DO NOTHING
  `;
}

export async function removeProgress(userId, topicId, questionIndex) {
  await ensureDbInit();
  await sql`
    DELETE FROM progress WHERE user_id = ${userId} AND topic_id = ${topicId} AND question_index = ${questionIndex}
  `;
}

// Bookmark operations
export async function getBookmarks(userId) {
  await ensureDbInit();
  const result = await sql`
    SELECT topic_id, question_index FROM bookmarks WHERE user_id = ${userId}
  `;
  return result.rows;
}

export async function toggleBookmark(userId, topicId, questionIndex) {
  await ensureDbInit();
  const existing = await sql`
    SELECT id FROM bookmarks WHERE user_id = ${userId} AND topic_id = ${topicId} AND question_index = ${questionIndex}
  `;
  
  if (existing.rows.length > 0) {
    await sql`DELETE FROM bookmarks WHERE id = ${existing.rows[0].id}`;
    return false;
  } else {
    await sql`INSERT INTO bookmarks (user_id, topic_id, question_index) VALUES (${userId}, ${topicId}, ${questionIndex})`;
    return true;
  }
}

// Case progress operations
export async function getCaseProgress(userId) {
  await ensureDbInit();
  const result = await sql`
    SELECT case_id, completed, score FROM case_progress WHERE user_id = ${userId}
  `;
  return result.rows;
}

export async function saveCaseProgress(userId, caseId, score) {
  await ensureDbInit();
  await sql`
    INSERT INTO case_progress (user_id, case_id, completed, score, completed_at)
    VALUES (${userId}, ${caseId}, TRUE, ${score}, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, case_id) DO UPDATE SET
      completed = TRUE,
      score = GREATEST(case_progress.score, ${score}),
      completed_at = CURRENT_TIMESTAMP
  `;
}
