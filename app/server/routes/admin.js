const express = require('express');
const bcrypt = require('bcryptjs');
const { dbAsync } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get dashboard statistics
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // User statistics
    const userStats = await dbAsync.get(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'student' THEN 1 END) as students,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as new_today
      FROM users
      WHERE is_active = 1
    `);

    // Scenario statistics
    const scenarioStats = await dbAsync.get(`
      SELECT 
        COUNT(*) as total_scenarios,
        COUNT(CASE WHEN difficulty = 'beginner' THEN 1 END) as beginner,
        COUNT(CASE WHEN difficulty = 'intermediate' THEN 1 END) as intermediate,
        COUNT(CASE WHEN difficulty = 'advanced' THEN 1 END) as advanced
      FROM scenarios
      WHERE is_active = 1
    `);

    // Progress statistics
    const progressStats = await dbAsync.get(`
      SELECT 
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        AVG(score) as average_score,
        SUM(time_spent) as total_time_spent
      FROM user_progress
    `);

    // Assessment statistics
    const assessmentStats = await dbAsync.get(`
      SELECT 
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN passed = 1 THEN 1 END) as passed,
        AVG(score) as average_score
      FROM user_assessments
      WHERE status = 'completed'
    `);

    // Recent activity
    const recentActivity = await dbAsync.all(`
      SELECT al.*, u.username
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 20
    `);

    // Top performers
    const topPerformers = await dbAsync.all(`
      SELECT 
        u.id,
        u.username,
        u.full_name,
        COALESCE(SUM(up.score), 0) as total_score,
        COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as scenarios_completed
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id
      WHERE u.role = 'student' AND u.is_active = 1
      GROUP BY u.id
      ORDER BY total_score DESC
      LIMIT 10
    `);

    res.json({
      users: userStats,
      scenarios: scenarioStats,
      progress: progressStats,
      assessments: assessmentStats,
      recentActivity,
      topPerformers
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
});

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = `
      SELECT id, username, email, full_name, role, created_at, last_login, is_active
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      query += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const users = await dbAsync.all(query, params);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Create user
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user exists
    const existingUser = await dbAsync.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await dbAsync.run(
      'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, fullName || username, role || 'student']
    );

    // Initialize skills for student users
    if (role === 'student' || !role) {
      const skills = await dbAsync.all('SELECT id FROM skills');
      for (const skill of skills) {
        await dbAsync.run(
          'INSERT INTO user_skills (user_id, skill_id, level, xp) VALUES (?, ?, 1, 0)',
          [result.id, skill.id]
        );
      }
    }

    res.status(201).json({
      message: 'User created successfully',
      userId: result.id
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, isActive } = req.body;

    await dbAsync.run(
      `UPDATE users 
       SET full_name = COALESCE(?, full_name), 
           email = COALESCE(?, email), 
           role = COALESCE(?, role),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [fullName, email, role, isActive, id]
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await dbAsync.run('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Create scenario
router.post('/scenarios', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, category, difficulty, estimatedTime, points, content, solution, hints } = req.body;

    if (!title || !description || !category || !difficulty || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await dbAsync.run(
      `INSERT INTO scenarios 
       (title, description, category, difficulty, estimated_time, points, content, solution, hints) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, category, difficulty, estimatedTime || 30, points || 100, 
       JSON.stringify(content), JSON.stringify(solution), JSON.stringify(hints || [])]
    );

    res.status(201).json({
      message: 'Scenario created successfully',
      scenarioId: result.id
    });
  } catch (error) {
    console.error('Create scenario error:', error);
    res.status(500).json({ error: 'Failed to create scenario' });
  }
});

// Update scenario
router.put('/scenarios/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, difficulty, estimatedTime, points, content, solution, hints, isActive } = req.body;

    await dbAsync.run(
      `UPDATE scenarios 
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           category = COALESCE(?, category),
           difficulty = COALESCE(?, difficulty),
           estimated_time = COALESCE(?, estimated_time),
           points = COALESCE(?, points),
           content = COALESCE(?, content),
           solution = COALESCE(?, solution),
           hints = COALESCE(?, hints),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [title, description, category, difficulty, estimatedTime, points, 
       content ? JSON.stringify(content) : null,
       solution ? JSON.stringify(solution) : null,
       hints ? JSON.stringify(hints) : null,
       isActive, id]
    );

    res.json({ message: 'Scenario updated successfully' });
  } catch (error) {
    console.error('Update scenario error:', error);
    res.status(500).json({ error: 'Failed to update scenario' });
  }
});

// Delete scenario
router.delete('/scenarios/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await dbAsync.run('DELETE FROM scenarios WHERE id = ?', [id]);
    res.json({ message: 'Scenario deleted successfully' });
  } catch (error) {
    console.error('Delete scenario error:', error);
    res.status(500).json({ error: 'Failed to delete scenario' });
  }
});

// Create assessment
router.post('/assessments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, category, questions, passingScore, timeLimit, points } = req.body;

    if (!title || !description || !category || !questions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await dbAsync.run(
      `INSERT INTO assessments 
       (title, description, category, questions, passing_score, time_limit, points) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, category, JSON.stringify(questions), passingScore || 70, timeLimit || 30, points || 100]
    );

    res.status(201).json({
      message: 'Assessment created successfully',
      assessmentId: result.id
    });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

// Update assessment
router.put('/assessments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, questions, passingScore, timeLimit, points, isActive } = req.body;

    await dbAsync.run(
      `UPDATE assessments 
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           category = COALESCE(?, category),
           questions = COALESCE(?, questions),
           passing_score = COALESCE(?, passing_score),
           time_limit = COALESCE(?, time_limit),
           points = COALESCE(?, points),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [title, description, category, 
       questions ? JSON.stringify(questions) : null,
       passingScore, timeLimit, points, isActive, id]
    );

    res.json({ message: 'Assessment updated successfully' });
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
});

// Delete assessment
router.delete('/assessments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await dbAsync.run('DELETE FROM assessments WHERE id = ?', [id]);
    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

// Get system logs
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 100, userId, action } = req.query;
    
    let query = `
      SELECT al.*, u.username
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      query += ' AND al.user_id = ?';
      params.push(userId);
    }

    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const logs = await dbAsync.all(query, params);
    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

module.exports = router;
