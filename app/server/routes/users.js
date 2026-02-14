const express = require('express');
const { dbAsync } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user info
    const user = await dbAsync.get(
      'SELECT id, username, email, full_name, role, created_at, last_login FROM users WHERE id = ?',
      [userId]
    );

    // Get skills with levels
    const skills = await dbAsync.all(`
      SELECT s.name, s.description, s.category, us.level, us.xp
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = ?
      ORDER BY s.category, s.name
    `, [userId]);

    // Get progress statistics
    const scenarioStats = await dbAsync.get(`
      SELECT 
        COUNT(*) as total_scenarios,
        COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed_scenarios,
        COUNT(CASE WHEN up.status = 'in_progress' THEN 1 END) as in_progress_scenarios,
        COALESCE(SUM(up.score), 0) as total_scenario_points,
        COALESCE(SUM(up.time_spent), 0) as total_scenario_time
      FROM scenarios s
      LEFT JOIN user_progress up ON s.id = up.scenario_id AND up.user_id = ?
      WHERE s.is_active = 1
    `, [userId]);

    const assessmentStats = await dbAsync.get(`
      SELECT 
        COUNT(*) as total_assessments,
        COUNT(CASE WHEN ua.passed = 1 THEN 1 END) as passed_assessments,
        COUNT(CASE WHEN ua.status = 'completed' AND ua.passed = 0 THEN 1 END) as failed_assessments,
        COALESCE(AVG(ua.score), 0) as average_score
      FROM assessments a
      LEFT JOIN user_assessments ua ON a.id = ua.assessment_id AND ua.user_id = ?
      WHERE a.is_active = 1
    `, [userId]);

    // Get certificates
    const certificates = await dbAsync.all(
      'SELECT * FROM certificates WHERE user_id = ? ORDER BY issued_at DESC',
      [userId]
    );

    // Get recent activity
    const recentActivity = await dbAsync.all(`
      SELECT action, details, created_at
      FROM activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId]);

    res.json({
      user,
      skills,
      statistics: {
        scenarios: scenarioStats,
        assessments: assessmentStats
      },
      certificates,
      recentActivity
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Get user leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;

    let query = `
      SELECT 
        u.id,
        u.username,
        u.full_name,
        COALESCE(SUM(up.score), 0) as total_score,
        COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as scenarios_completed,
        COUNT(CASE WHEN ua.passed = 1 THEN 1 END) as assessments_passed
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id
      LEFT JOIN user_assessments ua ON u.id = ua.user_id
      WHERE u.is_active = 1 AND u.role = 'student'
      GROUP BY u.id
      ORDER BY total_score DESC
      LIMIT ?
    `;

    const leaderboard = await dbAsync.all(query, [parseInt(limit)]);

    // Add rank
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    res.json(rankedLeaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const userId = req.user.id;

    // Check if email is already taken
    if (email) {
      const existingUser = await dbAsync.get(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    await dbAsync.run(
      'UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email) WHERE id = ?',
      [fullName, email, userId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user achievements
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Define achievements
    const achievements = [
      {
        id: 'first_scenario',
        name: 'First Steps',
        description: 'Complete your first training scenario',
        icon: '🎯',
        condition: async () => {
          const result = await dbAsync.get(
            'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND status = ?',
            [userId, 'completed']
          );
          return result.count >= 1;
        }
      },
      {
        id: 'scenario_master',
        name: 'Scenario Master',
        description: 'Complete 10 training scenarios',
        icon: '🏆',
        condition: async () => {
          const result = await dbAsync.get(
            'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND status = ?',
            [userId, 'completed']
          );
          return result.count >= 10;
        }
      },
      {
        id: 'perfect_score',
        name: 'Perfect Score',
        description: 'Get 100% on any assessment',
        icon: '💯',
        condition: async () => {
          const result = await dbAsync.get(`
            SELECT COUNT(*) as count 
            FROM user_assessments ua
            JOIN assessments a ON ua.assessment_id = a.id
            WHERE ua.user_id = ? AND ua.score = a.points
          `, [userId]);
          return result.count >= 1;
        }
      },
      {
        id: 'assessment_passer',
        name: 'Knowledge Seeker',
        description: 'Pass 5 assessments',
        icon: '📚',
        condition: async () => {
          const result = await dbAsync.get(
            'SELECT COUNT(*) as count FROM user_assessments WHERE user_id = ? AND passed = 1',
            [userId]
          );
          return result.count >= 5;
        }
      },
      {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a scenario in under 50% of estimated time',
        icon: '⚡',
        condition: async () => {
          const result = await dbAsync.get(`
            SELECT COUNT(*) as count 
            FROM user_progress up
            JOIN scenarios s ON up.scenario_id = s.id
            WHERE up.user_id = ? AND up.status = ? AND up.time_spent < (s.estimated_time * 30)
          `, [userId, 'completed']);
          return result.count >= 1;
        }
      },
      {
        id: 'skill_level_5',
        name: 'Rising Expert',
        description: 'Reach level 5 in any skill',
        icon: '📈',
        condition: async () => {
          const result = await dbAsync.get(
            'SELECT COUNT(*) as count FROM user_skills WHERE user_id = ? AND level >= 5',
            [userId]
          );
          return result.count >= 1;
        }
      },
      {
        id: 'certified',
        name: 'Certified Professional',
        description: 'Earn your first certificate',
        icon: '🎓',
        condition: async () => {
          const result = await dbAsync.get(
            'SELECT COUNT(*) as count FROM certificates WHERE user_id = ?',
            [userId]
          );
          return result.count >= 1;
        }
      }
    ];

    // Check each achievement
    const userAchievements = await Promise.all(
      achievements.map(async (achievement) => ({
        ...achievement,
        unlocked: await achievement.condition()
      }))
    );

    res.json(userAchievements);
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

module.exports = router;
