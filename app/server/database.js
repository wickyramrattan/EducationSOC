const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'soc_platform.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        full_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )
    `);

    // Scenarios table
    db.run(`
      CREATE TABLE IF NOT EXISTS scenarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        estimated_time INTEGER,
        points INTEGER DEFAULT 100,
        content TEXT NOT NULL,
        solution TEXT,
        hints TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
      )
    `);

    // User progress table
    db.run(`
      CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        scenario_id INTEGER NOT NULL,
        status TEXT DEFAULT 'not_started',
        score INTEGER DEFAULT 0,
        time_spent INTEGER DEFAULT 0,
        attempts INTEGER DEFAULT 0,
        started_at DATETIME,
        completed_at DATETIME,
        answers TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
      )
    `);

    // Assessments table
    db.run(`
      CREATE TABLE IF NOT EXISTS assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        questions TEXT NOT NULL,
        passing_score INTEGER DEFAULT 70,
        time_limit INTEGER,
        points INTEGER DEFAULT 100,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
      )
    `);

    // User assessments table
    db.run(`
      CREATE TABLE IF NOT EXISTS user_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        assessment_id INTEGER NOT NULL,
        score INTEGER DEFAULT 0,
        status TEXT DEFAULT 'not_started',
        started_at DATETIME,
        completed_at DATETIME,
        answers TEXT,
        time_spent INTEGER DEFAULT 0,
        passed BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (assessment_id) REFERENCES assessments(id)
      )
    `);

    // Skills table
    db.run(`
      CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User skills table
    db.run(`
      CREATE TABLE IF NOT EXISTS user_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        skill_id INTEGER NOT NULL,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (skill_id) REFERENCES skills(id)
      )
    `);

    // Certificates table
    db.run(`
      CREATE TABLE IF NOT EXISTS certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        certificate_id TEXT UNIQUE NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Activity logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Insert default admin user (password: admin123)
    db.run(`
      INSERT OR IGNORE INTO users (username, email, password, role, full_name)
      VALUES ('admin', 'admin@socplatform.local', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjXAgJqOgJuqXJFD0Jz1xQJx8vXyQJ2', 'admin', 'System Administrator')
    `);

    // Insert default skills
    const defaultSkills = [
      ['Log Analysis', 'Ability to analyze and interpret system and security logs', 'technical'],
      ['SIEM Navigation', 'Proficiency in using Security Information and Event Management tools', 'technical'],
      ['IOC Identification', 'Identifying Indicators of Compromise in security data', 'technical'],
      ['Incident Classification', 'Properly categorizing security incidents by severity and type', 'technical'],
      ['Malware Analysis', 'Basic understanding of malware behavior and detection', 'technical'],
      ['Network Analysis', 'Analyzing network traffic and identifying anomalies', 'technical'],
      ['Threat Intelligence', 'Understanding and applying threat intelligence data', 'technical'],
      ['Documentation', 'Creating clear and comprehensive incident reports', 'soft'],
      ['Decision Making', 'Making effective decisions under pressure', 'soft'],
      ['Time Management', 'Efficiently managing time during incident response', 'soft']
    ];

    const insertSkill = db.prepare(`
      INSERT OR IGNORE INTO skills (name, description, category)
      VALUES (?, ?, ?)
    `);

    defaultSkills.forEach(skill => {
      insertSkill.run(skill);
    });

    insertSkill.finalize();

    console.log('Database initialized successfully');
  });
}

// Promisify database methods
const dbAsync = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },

  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

module.exports = { db, dbAsync };
