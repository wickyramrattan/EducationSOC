const express = require('express');
const { dbAsync } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get all scenarios
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    let query = 'SELECT id, title, description, category, difficulty, estimated_time, points, created_at FROM scenarios WHERE is_active = 1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    query += ' ORDER BY difficulty, title';

    const scenarios = await dbAsync.all(query, params);

    // Get user progress for each scenario
    const scenariosWithProgress = await Promise.all(
      scenarios.map(async (scenario) => {
        const progress = await dbAsync.get(
          'SELECT status, score, attempts FROM user_progress WHERE user_id = ? AND scenario_id = ?',
          [req.user.id, scenario.id]
        );
        return {
          ...scenario,
          userProgress: progress || { status: 'not_started', score: 0, attempts: 0 }
        };
      })
    );

    res.json(scenariosWithProgress);
  } catch (error) {
    console.error('Get scenarios error:', error);
    res.status(500).json({ error: 'Failed to get scenarios' });
  }
});

// Get scenario categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await dbAsync.all(`
      SELECT category, COUNT(*) as count,
        COUNT(CASE WHEN difficulty = 'beginner' THEN 1 END) as beginner_count,
        COUNT(CASE WHEN difficulty = 'intermediate' THEN 1 END) as intermediate_count,
        COUNT(CASE WHEN difficulty = 'advanced' THEN 1 END) as advanced_count
      FROM scenarios 
      WHERE is_active = 1 
      GROUP BY category
    `);

    const categoryNames = {
      phishing: 'Phishing Analysis',
      malware: 'Malware Detection',
      network: 'Network Security',
      web: 'Web Application Security',
      insider: 'Insider Threat',
      forensics: 'Digital Forensics'
    };

    res.json(categories.map(c => ({
      id: c.category,
      name: categoryNames[c.category] || c.category,
      count: c.count,
      difficultyBreakdown: {
        beginner: c.beginner_count,
        intermediate: c.intermediate_count,
        advanced: c.advanced_count
      }
    })));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get single scenario
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const scenario = await dbAsync.get(
      'SELECT id, title, description, category, difficulty, estimated_time, points, content, hints FROM scenarios WHERE id = ? AND is_active = 1',
      [id]
    );

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    // Parse JSON content
    scenario.content = JSON.parse(scenario.content);
    scenario.hints = JSON.parse(scenario.hints);

    // Get or create user progress
    let progress = await dbAsync.get(
      'SELECT * FROM user_progress WHERE user_id = ? AND scenario_id = ?',
      [req.user.id, id]
    );

    if (!progress) {
      const result = await dbAsync.run(
        'INSERT INTO user_progress (user_id, scenario_id, status, started_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [req.user.id, id, 'in_progress']
      );
      progress = { id: result.id, status: 'in_progress', attempts: 0 };
    } else if (progress.status === 'not_started') {
      await dbAsync.run(
        'UPDATE user_progress SET status = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['in_progress', progress.id]
      );
      progress.status = 'in_progress';
    }

    res.json({
      ...scenario,
      progress
    });
  } catch (error) {
    console.error('Get scenario error:', error);
    res.status(500).json({ error: 'Failed to get scenario' });
  }
});

// Submit scenario solution
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, timeSpent } = req.body;

    const scenario = await dbAsync.get(
      'SELECT solution, points FROM scenarios WHERE id = ?',
      [id]
    );

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    const solution = JSON.parse(scenario.solution);

    // Calculate score based on answers
    let score = 0;
    const maxScore = scenario.points;
    const feedback = [];

    // Evaluate answers against solution
    if (answers.isPhishing !== undefined) {
      if (answers.isPhishing === solution.is_phishing) {
        score += maxScore * 0.3;
        feedback.push({ correct: true, message: 'Correctly identified the threat type' });
      } else {
        feedback.push({ correct: false, message: 'Incorrect threat identification' });
      }
    }

    if (answers.indicators && solution.indicators) {
      const correctIndicators = answers.indicators.filter(ind => 
        solution.indicators.some(sol => sol.toLowerCase().includes(ind.toLowerCase()))
      ).length;
      const indicatorScore = (correctIndicators / solution.indicators.length) * (maxScore * 0.4);
      score += indicatorScore;
      feedback.push({ 
        correct: correctIndicators > 0, 
        message: `Identified ${correctIndicators}/${solution.indicators.length} indicators` 
      });
    }

    if (answers.action && solution.correct_action) {
      if (answers.action === solution.correct_action) {
        score += maxScore * 0.3;
        feedback.push({ correct: true, message: 'Correct action taken' });
      } else {
        feedback.push({ correct: false, message: 'Incorrect action' });
      }
    }

    // Round score
    score = Math.round(score);

    // Update progress
    const progress = await dbAsync.get(
      'SELECT * FROM user_progress WHERE user_id = ? AND scenario_id = ?',
      [req.user.id, id]
    );

    if (progress) {
      await dbAsync.run(
        `UPDATE user_progress 
         SET status = ?, score = ?, time_spent = ?, attempts = attempts + 1, answers = ?, completed_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [score >= maxScore * 0.7 ? 'completed' : 'in_progress', score, timeSpent || 0, JSON.stringify(answers), progress.id]
      );
    }

    // Award XP for skills
    if (score >= maxScore * 0.7) {
      const skillXp = Math.floor(score / 10);
      await awardSkillXp(req.user.id, skillXp);
    }

    res.json({
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      passed: score >= maxScore * 0.7,
      feedback,
      solution: score >= maxScore * 0.7 ? solution : undefined
    });
  } catch (error) {
    console.error('Submit scenario error:', error);
    res.status(500).json({ error: 'Failed to submit scenario' });
  }
});

// Get hint for scenario
router.get('/:id/hint', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { hintIndex } = req.query;

    const scenario = await dbAsync.get(
      'SELECT hints FROM scenarios WHERE id = ?',
      [id]
    );

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    const hints = JSON.parse(scenario.hints);
    const index = parseInt(hintIndex) || 0;

    if (index >= hints.length) {
      return res.status(400).json({ error: 'No more hints available' });
    }

    // Deduct points for using hints
    const penalty = (index + 1) * 5;

    res.json({
      hint: hints[index],
      hintNumber: index + 1,
      totalHints: hints.length,
      penalty,
      remainingHints: hints.length - index - 1
    });
  } catch (error) {
    console.error('Get hint error:', error);
    res.status(500).json({ error: 'Failed to get hint' });
  }
});

// Helper function to award XP to skills
async function awardSkillXp(userId, xpAmount) {
  try {
    const skills = await dbAsync.all(
      'SELECT id, skill_id, xp FROM user_skills WHERE user_id = ?',
      [userId]
    );

    for (const skill of skills) {
      const newXp = skill.xp + xpAmount;
      const newLevel = Math.floor(newXp / 100) + 1;

      await dbAsync.run(
        'UPDATE user_skills SET xp = ?, level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newXp, newLevel, skill.id]
      );
    }
  } catch (error) {
    console.error('Award XP error:', error);
  }
}

module.exports = router;
