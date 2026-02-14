const express = require('express');
const { dbAsync } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get user progress overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Overall statistics
    const stats = await dbAsync.get(`
      SELECT 
        COUNT(DISTINCT s.id) as total_scenarios,
        COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN s.id END) as completed_scenarios,
        COUNT(DISTINCT CASE WHEN up.status = 'in_progress' THEN s.id END) as in_progress_scenarios,
        COALESCE(SUM(up.score), 0) as total_scenario_score,
        COALESCE(SUM(up.time_spent), 0) as total_scenario_time,
        COUNT(DISTINCT a.id) as total_assessments,
        COUNT(DISTINCT CASE WHEN ua.passed = 1 THEN a.id END) as passed_assessments
      FROM users u
      LEFT JOIN scenarios s ON s.is_active = 1
      LEFT JOIN user_progress up ON s.id = up.scenario_id AND up.user_id = u.id
      LEFT JOIN assessments a ON a.is_active = 1
      LEFT JOIN user_assessments ua ON a.id = ua.assessment_id AND ua.user_id = u.id
      WHERE u.id = ?
    `, [userId]);

    // Category breakdown
    const categoryProgress = await dbAsync.all(`
      SELECT 
        s.category,
        COUNT(s.id) as total,
        COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed,
        AVG(up.score) as average_score
      FROM scenarios s
      LEFT JOIN user_progress up ON s.id = up.scenario_id AND up.user_id = ?
      WHERE s.is_active = 1
      GROUP BY s.category
    `, [userId]);

    // Difficulty breakdown
    const difficultyProgress = await dbAsync.all(`
      SELECT 
        s.difficulty,
        COUNT(s.id) as total,
        COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed,
        AVG(up.score) as average_score
      FROM scenarios s
      LEFT JOIN user_progress up ON s.id = up.scenario_id AND up.user_id = ?
      WHERE s.is_active = 1
      GROUP BY s.difficulty
    `, [userId]);

    // Recent activity
    const recentActivity = await dbAsync.all(`
      SELECT 
        'scenario' as type,
        s.title,
        up.status,
        up.score,
        up.completed_at as date
      FROM user_progress up
      JOIN scenarios s ON up.scenario_id = s.id
      WHERE up.user_id = ? AND up.status = 'completed'
      
      UNION ALL
      
      SELECT 
        'assessment' as type,
        a.title,
        CASE WHEN ua.passed = 1 THEN 'passed' ELSE 'failed' END as status,
        ua.score,
        ua.completed_at as date
      FROM user_assessments ua
      JOIN assessments a ON ua.assessment_id = a.id
      WHERE ua.user_id = ? AND ua.status = 'completed'
      
      ORDER BY date DESC
      LIMIT 10
    `, [userId, userId]);

    // Skill progression over time (simplified)
    const skillProgress = await dbAsync.all(`
      SELECT 
        s.name,
        s.category,
        us.level,
        us.xp,
        us.updated_at
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = ?
      ORDER BY us.xp DESC
    `, [userId]);

    res.json({
      stats,
      categoryProgress,
      difficultyProgress,
      recentActivity,
      skillProgress
    });
  } catch (error) {
    console.error('Get progress overview error:', error);
    res.status(500).json({ error: 'Failed to get progress overview' });
  }
});

// Get detailed scenario progress
router.get('/scenarios', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const progress = await dbAsync.all(`
      SELECT 
        s.id,
        s.title,
        s.category,
        s.difficulty,
        s.points as max_points,
        up.status,
        up.score,
        up.attempts,
        up.time_spent,
        up.started_at,
        up.completed_at
      FROM scenarios s
      LEFT JOIN user_progress up ON s.id = up.scenario_id AND up.user_id = ?
      WHERE s.is_active = 1
      ORDER BY 
        CASE s.difficulty 
          WHEN 'beginner' THEN 1 
          WHEN 'intermediate' THEN 2 
          WHEN 'advanced' THEN 3 
        END,
        s.title
    `, [userId]);

    res.json(progress);
  } catch (error) {
    console.error('Get scenario progress error:', error);
    res.status(500).json({ error: 'Failed to get scenario progress' });
  }
});

// Get detailed assessment progress
router.get('/assessments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const progress = await dbAsync.all(`
      SELECT 
        a.id,
        a.title,
        a.category,
        a.passing_score,
        a.points as max_points,
        ua.status,
        ua.score,
        ua.passed,
        ua.time_spent,
        ua.started_at,
        ua.completed_at
      FROM assessments a
      LEFT JOIN user_assessments ua ON a.id = ua.assessment_id AND ua.user_id = ?
      WHERE a.is_active = 1
      ORDER BY a.category, a.title
    `, [userId]);

    res.json(progress);
  } catch (error) {
    console.error('Get assessment progress error:', error);
    res.status(500).json({ error: 'Failed to get assessment progress' });
  }
});

// Get learning path recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's skill levels
    const userSkills = await dbAsync.all(`
      SELECT s.name, s.category, us.level, us.xp
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = ?
      ORDER BY us.level, us.xp
    `, [userId]);

    // Find weakest skills
    const weakestSkills = userSkills.slice(0, 3);

    // Recommend scenarios based on weakest skills and incomplete scenarios
    const recommendedScenarios = await dbAsync.all(`
      SELECT 
        s.id,
        s.title,
        s.description,
        s.category,
        s.difficulty,
        s.estimated_time,
        s.points,
        CASE 
          WHEN up.status IS NULL THEN 'not_started'
          ELSE up.status
        END as status
      FROM scenarios s
      LEFT JOIN user_progress up ON s.id = up.scenario_id AND up.user_id = ?
      WHERE s.is_active = 1 
        AND (up.status IS NULL OR up.status != 'completed')
        AND s.difficulty = 'beginner'
      ORDER BY 
        CASE s.category
          ${weakestSkills.map((skill, i) => `WHEN '${skill.category}' THEN ${i}`).join('\n')}
          ELSE 999
        END,
        s.estimated_time
      LIMIT 5
    `, [userId]);

    // Recommend assessments
    const recommendedAssessments = await dbAsync.all(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.category,
        a.time_limit,
        a.points,
        CASE 
          WHEN ua.status IS NULL THEN 'not_started'
          ELSE ua.status
        END as status
      FROM assessments a
      LEFT JOIN user_assessments ua ON a.id = ua.assessment_id AND ua.user_id = ?
      WHERE a.is_active = 1 
        AND (ua.status IS NULL OR ua.passed = 0)
      ORDER BY a.category
      LIMIT 3
    `, [userId]);

    // Calculate next milestones
    const completedScenarios = await dbAsync.get(
      'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND status = ?',
      [userId, 'completed']
    );

    const passedAssessments = await dbAsync.get(
      'SELECT COUNT(*) as count FROM user_assessments WHERE user_id = ? AND passed = 1',
      [userId]
    );

    const milestones = [
      {
        name: 'First Scenario',
        description: 'Complete your first training scenario',
        target: 1,
        current: completedScenarios.count,
        completed: completedScenarios.count >= 1
      },
      {
        name: 'Scenario Explorer',
        description: 'Complete 5 training scenarios',
        target: 5,
        current: completedScenarios.count,
        completed: completedScenarios.count >= 5
      },
      {
        name: 'Assessment Passer',
        description: 'Pass your first assessment',
        target: 1,
        current: passedAssessments.count,
        completed: passedAssessments.count >= 1
      },
      {
        name: 'Knowledge Master',
        description: 'Pass 3 assessments',
        target: 3,
        current: passedAssessments.count,
        completed: passedAssessments.count >= 3
      }
    ];

    res.json({
      weakestSkills,
      recommendedScenarios,
      recommendedAssessments,
      milestones
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get skill analytics
router.get('/skills', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const skills = await dbAsync.all(`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.category,
        us.level,
        us.xp,
        (us.level * 100) as xp_for_next_level,
        (us.level * 100 - us.xp) as xp_needed
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = ?
      ORDER BY s.category, s.name
    `, [userId]);

    // Group by category
    const groupedSkills = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    }, {});

    // Calculate overall skill level
    const overallStats = await dbAsync.get(`
      SELECT 
        AVG(level) as average_level,
        SUM(xp) as total_xp,
        MAX(level) as max_level
      FROM user_skills
      WHERE user_id = ?
    `, [userId]);

    res.json({
      skills: groupedSkills,
      overallStats
    });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Failed to get skills' });
  }
});

module.exports = router;
