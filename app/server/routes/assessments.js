const express = require('express');
const { dbAsync } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get all assessments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT id, title, description, category, passing_score, time_limit, points, created_at FROM assessments WHERE is_active = 1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY category, title';

    const assessments = await dbAsync.all(query, params);

    // Get user progress for each assessment
    const assessmentsWithProgress = await Promise.all(
      assessments.map(async (assessment) => {
        const progress = await dbAsync.get(
          'SELECT status, score, passed FROM user_assessments WHERE user_id = ? AND assessment_id = ?',
          [req.user.id, assessment.id]
        );
        return {
          ...assessment,
          userProgress: progress || { status: 'not_started', score: 0, passed: false }
        };
      })
    );

    res.json(assessmentsWithProgress);
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ error: 'Failed to get assessments' });
  }
});

// Get single assessment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await dbAsync.get(
      'SELECT id, title, description, category, passing_score, time_limit, points FROM assessments WHERE id = ? AND is_active = 1',
      [id]
    );

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Get user assessment record
    let userAssessment = await dbAsync.get(
      'SELECT * FROM user_assessments WHERE user_id = ? AND assessment_id = ?',
      [req.user.id, id]
    );

    if (!userAssessment) {
      const result = await dbAsync.run(
        'INSERT INTO user_assessments (user_id, assessment_id, status) VALUES (?, ?, ?)',
        [req.user.id, id, 'not_started']
      );
      userAssessment = { id: result.id, status: 'not_started', attempts: 0 };
    }

    res.json({
      ...assessment,
      userAssessment
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({ error: 'Failed to get assessment' });
  }
});

// Start assessment
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await dbAsync.get(
      'SELECT questions FROM assessments WHERE id = ? AND is_active = 1',
      [id]
    );

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const questions = JSON.parse(assessment.questions);

    // Shuffle questions and prepare for delivery (remove correct answers)
    const shuffledQuestions = questions
      .sort(() => Math.random() - 0.5)
      .map(q => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options,
        points: q.points
      }));

    // Update user assessment status
    await dbAsync.run(
      `UPDATE user_assessments 
       SET status = ?, started_at = CURRENT_TIMESTAMP 
       WHERE user_id = ? AND assessment_id = ?`,
      ['in_progress', req.user.id, id]
    );

    res.json({
      assessmentId: id,
      questions: shuffledQuestions,
      timeLimit: assessment.time_limit,
      totalQuestions: shuffledQuestions.length,
      totalPoints: shuffledQuestions.reduce((sum, q) => sum + q.points, 0)
    });
  } catch (error) {
    console.error('Start assessment error:', error);
    res.status(500).json({ error: 'Failed to start assessment' });
  }
});

// Submit assessment answers
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, timeSpent } = req.body;

    const assessment = await dbAsync.get(
      'SELECT questions, passing_score, points FROM assessments WHERE id = ?',
      [id]
    );

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const questions = JSON.parse(assessment.questions);
    let totalScore = 0;
    let maxScore = 0;
    const results = [];

    // Grade each answer
    for (const question of questions) {
      maxScore += question.points;
      const userAnswer = answers.find(a => a.questionId === question.id);
      
      let isCorrect = false;
      let pointsEarned = 0;

      if (userAnswer) {
        if (question.type === 'multiple_choice') {
          isCorrect = userAnswer.answer === question.correct_answer;
        } else if (question.type === 'true_false') {
          isCorrect = userAnswer.answer === question.correct_answer;
        } else if (question.type === 'text') {
          // For text answers, do case-insensitive comparison
          isCorrect = userAnswer.answer?.toLowerCase().trim() === question.correct_answer?.toLowerCase().trim();
        }

        if (isCorrect) {
          pointsEarned = question.points;
          totalScore += pointsEarned;
        }
      }

      results.push({
        questionId: question.id,
        correct: isCorrect,
        pointsEarned,
        maxPoints: question.points,
        correctAnswer: question.correct_answer
      });
    }

    const percentage = Math.round((totalScore / maxScore) * 100);
    const passed = percentage >= assessment.passing_score;

    // Update user assessment record
    await dbAsync.run(
      `UPDATE user_assessments 
       SET status = ?, score = ?, passed = ?, answers = ?, time_spent = ?, completed_at = CURRENT_TIMESTAMP 
       WHERE user_id = ? AND assessment_id = ?`,
      ['completed', totalScore, passed ? 1 : 0, JSON.stringify(answers), timeSpent || 0, req.user.id, id]
    );

    // Award XP if passed
    if (passed) {
      const xpAmount = Math.floor(totalScore / 5);
      await awardSkillXp(req.user.id, xpAmount);

      // Check for certificate eligibility
      await checkAndAwardCertificate(req.user.id, id);
    }

    res.json({
      score: totalScore,
      maxScore,
      percentage,
      passed,
      passingScore: assessment.passing_score,
      timeSpent,
      results
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
});

// Get assessment results
router.get('/:id/results', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const userAssessment = await dbAsync.get(
      `SELECT ua.*, a.title, a.description, a.passing_score, a.questions
       FROM user_assessments ua
       JOIN assessments a ON ua.assessment_id = a.id
       WHERE ua.user_id = ? AND ua.assessment_id = ?`,
      [req.user.id, id]
    );

    if (!userAssessment) {
      return res.status(404).json({ error: 'Assessment not taken yet' });
    }

    if (userAssessment.status !== 'completed') {
      return res.status(400).json({ error: 'Assessment not completed' });
    }

    const questions = JSON.parse(userAssessment.questions);
    const answers = JSON.parse(userAssessment.answers);

    res.json({
      assessment: {
        id: userAssessment.assessment_id,
        title: userAssessment.title,
        description: userAssessment.description
      },
      score: userAssessment.score,
      passed: userAssessment.passed === 1,
      passingScore: userAssessment.passing_score,
      completedAt: userAssessment.completed_at,
      timeSpent: userAssessment.time_spent,
      answers: answers.map(a => {
        const question = questions.find(q => q.id === a.questionId);
        return {
          questionId: a.questionId,
          question: question?.question,
          yourAnswer: a.answer,
          correctAnswer: question?.correct_answer,
          correct: a.answer === question?.correct_answer
        };
      })
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

// Helper function to award XP
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

// Helper function to check and award certificates
async function checkAndAwardCertificate(userId, assessmentId) {
  try {
    // Check if user has passed all assessments in a category
    const assessments = await dbAsync.all(`
      SELECT a.id, a.category
      FROM assessments a
      WHERE a.category = (SELECT category FROM assessments WHERE id = ?)
      AND a.is_active = 1
    `, [assessmentId]);

    const passedAssessments = await dbAsync.all(`
      SELECT assessment_id
      FROM user_assessments
      WHERE user_id = ? AND passed = 1
    `, [userId]);

    const passedIds = passedAssessments.map(p => p.assessment_id);
    const allPassed = assessments.every(a => passedIds.includes(a.id));

    if (allPassed && assessments.length > 0) {
      const category = assessments[0].category;
      const certificateId = `SOC-${category.toUpperCase()}-${Date.now()}`;

      // Check if certificate already exists
      const existingCert = await dbAsync.get(
        'SELECT id FROM certificates WHERE user_id = ? AND title LIKE ?',
        [userId, `%${category}%`]
      );

      if (!existingCert) {
        await dbAsync.run(
          'INSERT INTO certificates (user_id, title, description, certificate_id) VALUES (?, ?, ?, ?)',
          [userId, `${category.charAt(0).toUpperCase() + category.slice(1)} Specialist`, `Completed all ${category} assessments`, certificateId]
        );
      }
    }
  } catch (error) {
    console.error('Certificate check error:', error);
  }
}

module.exports = router;
