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

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      description TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      organizer VARCHAR(255) NOT NULL,
      link VARCHAR(1000) NOT NULL,
      tags VARCHAR(500) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      company VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      role_type VARCHAR(50) NOT NULL,
      salary VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      requirements TEXT NOT NULL,
      link VARCHAR(1000) NOT NULL,
      tags VARCHAR(500) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create database indexes to optimize query speeds
  await sql`CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_case_progress_user_id ON case_progress(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_date ON events(date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at)`;
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


// Events operations
export async function getEvents() {
  await ensureDbInit();
  const result = await sql`SELECT * FROM events ORDER BY date ASC`;
  if (result.rows.length === 0) {
    const defaultEvents = [
      {
        title: "Kaggle ARC Prize 2026 AGI Progress Challenge",
        description: "Crack the Abstraction and Reasoning Corpus (ARC-AGI) benchmark testing fluid intelligence, general reasoning, and visual learning capabilities for a $1,000,000 prize pool.",
        type: "hackathon",
        date: "2026-10-15",
        organizer: "ARC Prize Foundation & Kaggle",
        link: "https://arcprize.org",
        tags: "AGI, Reasoning, Kaggle"
      },
      {
        title: "Kaggle Pokemon TCG AI Battle Challenge",
        description: "Build simulation agents and optimize deep reinforcement learning strategies for Pokemon Trading Card Game play in this active $240,000 global competition.",
        type: "hackathon",
        date: "2026-09-30",
        organizer: "The Pokémon Company & Kaggle",
        link: "https://www.kaggle.com/competitions",
        tags: "RL, Agents, Kaggle"
      },
      {
        title: "ACM SIGKDD 2026 Conference on Knowledge Discovery & Data Mining",
        description: "The premier international conference presenting scientific research in data mining, statistics, big data architectures, and large-scale predictive models in Jeju, South Korea.",
        type: "conference",
        date: "2026-08-09",
        organizer: "SIGKDD Org",
        link: "https://kdd.org",
        tags: "Data Science, Research, KDD"
      },
      {
        title: "NeurIPS 2026: Neural Information Processing Systems Conference",
        description: "The largest global artificial intelligence conference covering deep neural networks, transformer math, reinforcement learning breakthroughs, and generative AI research in Sydney, Australia.",
        type: "conference",
        date: "2026-12-06",
        organizer: "NeurIPS Foundation",
        link: "https://neurips.cc",
        tags: "Deep Learning, Research, Sydney"
      },
      {
        title: "D. E. Shaw Quantitative Research Recruitment Drive 2026",
        description: "Application window opens for Quantitative Analyst, Quantitative Researcher, and Machine Learning Researcher roles globally. Track details on their official LinkedIn corporate board.",
        type: "webinar",
        date: "2026-09-01",
        organizer: "D. E. Shaw & Co.",
        link: "https://www.linkedin.com/company/d-e-shaw-group/",
        tags: "Quant Research, DE Shaw, Careers"
      }
    ];

    for (const e of defaultEvents) {
      await sql`
        INSERT INTO events (title, description, type, date, organizer, link, tags)
        VALUES (${e.title}, ${e.description}, ${e.type}, ${e.date}, ${e.organizer}, ${e.link}, ${e.tags})
      `;
    }
    const fresh = await sql`SELECT * FROM events ORDER BY date ASC`;
    return fresh.rows;
  }
  return result.rows;
}

export async function createEvent({ title, description, type, date, organizer, link, tags }) {
  await ensureDbInit();
  const result = await sql`
    INSERT INTO events (title, description, type, date, organizer, link, tags)
    VALUES (${title}, ${description}, ${type}, ${date}, ${organizer}, ${link}, ${tags})
    RETURNING *
  `;
  return result.rows[0];
}

// Jobs operations
export async function getJobs() {
  await ensureDbInit();
  const result = await sql`SELECT * FROM jobs ORDER BY created_at DESC`;
  if (result.rows.length === 0) {
    const defaultJobs = [
      {
        title: "Quantitative Research Analyst - Financial Research Group",
        company: "D. E. Shaw India",
        location: "Hyderabad, India",
        role_type: "quant",
        salary: "Competitive Base + Performance Bonus",
        description: "Build mathematical models, analyze financial data streams, and design trading pipelines using probability, statistics, and high-performance Python/C++ scripts.",
        requirements: "Strong background in mathematics, statistics, physics, or computer science from top-tier institutions. Proficiency in Python and statistical packages.",
        link: "https://www.linkedin.com/company/d-e-shaw-group/jobs/",
        tags: "Quant, Finance, Python"
      },
      {
        title: "Senior Data Scientist - Membership Growth Strategy",
        company: "Walmart Global Tech",
        location: "Bengaluru, India",
        role_type: "ds",
        salary: "Competitive LPA (Industry Leading)",
        description: "Optimize subscriber growth strategy and member retention for Walmart+ programs. Analyze transactional logs, design high-scale predictive ML models, and write advanced data pipelines.",
        requirements: "Proficiency in Python, SQL, Statistics, and regression modeling. Familiarity with big data stacks (Spark, BigQuery, Snowflake).",
        link: "https://careers.walmart.com",
        tags: "Forecasting, ML, SQL"
      },
      {
        title: "Research Scientist - Artificial General Intelligence",
        company: "Google DeepMind",
        location: "London, UK (Hybrid)",
        role_type: "mle",
        salary: "£120,000 - £180,000",
        description: "Conduct research on neural network architectures, fluid reasoning, multi-step agent security, and transformer optimization.",
        requirements: "PhD in ML/DL with publications in top venues (NeurIPS, ICML, CVPR). Advanced PyTorch skills.",
        link: "https://careers.google.com",
        tags: "RL, AGI, PyTorch"
      },
      {
        title: "Product Data Scientist - Causal Inference & Experimentation",
        company: "Meta",
        location: "Menlo Park, CA",
        role_type: "ds",
        salary: "$185,000 - $245,000",
        description: "Design complex A/B testing frameworks, build causal inference models (synthetic controls, selection bias adjustments), and define core metrics for social features.",
        requirements: "MS/PhD in Statistics or quantitative field. Strong SQL query capabilities and experiment design.",
        link: "https://careers.meta.com",
        tags: "Causal, AB Testing, SQL"
      }
    ];

    for (const j of defaultJobs) {
      await sql`
        INSERT INTO jobs (title, company, location, role_type, salary, description, requirements, link, tags)
        VALUES (${j.title}, ${j.company}, ${j.location}, ${j.role_type}, ${j.salary}, ${j.description}, ${j.requirements}, ${j.link}, ${j.tags})
      `;
    }
    const fresh = await sql`SELECT * FROM jobs ORDER BY created_at DESC`;
    return fresh.rows;
  }
  return result.rows;
}

export async function createJob({ title, company, location, roleType, salary, description, requirements, link, tags }) {
  await ensureDbInit();
  const result = await sql`
    INSERT INTO jobs (title, company, location, role_type, salary, description, requirements, link, tags)
    VALUES (${title}, ${company}, ${location}, ${roleType}, ${salary}, ${description}, ${requirements}, ${link}, ${tags})
    RETURNING *
  `;
  return result.rows[0];
}
