const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createVideoQuiz,
  getAllVideoQuizzes,
  getVideoQuizById,
  getVideoQuizByTitle,
  updateVideoQuiz,
  deleteVideoQuiz,
  addQuizQuestions,
  updateQuizQuestion,
  deleteQuizQuestion,
  getQuizzesByHierarchy,
  getQuizzesByCourse,
  getQuizzesByEducationalContext,
  searchQuizzes,
  getQuizStatistics,
  bulkCreateVideoQuizzes,
  // Legacy aliases for backward compatibility
  addVideo,
  getVideos,
  getVideo,
  updateVideo,
  deleteVideo
} = require('../controllers/videoQuizController');

const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// ======================
// VALIDATION MIDDLEWARE
// ======================

const videoQuizValidation = [
  body('videoTitle').notEmpty().withMessage('Video title is required'),
  body('videoUrl').isURL().withMessage('Valid video URL is required'),
  body('moduleName').notEmpty().withMessage('Module name is required'),
  body('courseName').notEmpty().withMessage('Course name is required'),
  body('board').notEmpty().withMessage('Board is required'),
  body('grade').notEmpty().withMessage('Grade is required'),
  body('medium').custom((value, { req }) => {
    const board = (req.body.board || '').toUpperCase();
    if (board === 'CBSE') return true; // medium not required for CBSE
    if (!value || String(value).trim() === '') {
      throw new Error('Medium is required');
    }
    return true;
  }),
  body('quiz').optional().isArray().withMessage('Quiz must be an array'),
  body('quiz.*.question').optional().notEmpty().withMessage('Question is required'),
  body('quiz.*.correctAnswer').optional().isIn(['a', 'b', 'c', 'd']).withMessage('Correct answer must be a, b, c, or d'),
];

const quizQuestionValidation = [
  body('questions').isArray({ min: 1 }).withMessage('Questions array is required and must not be empty'),
  body('questions.*.question').notEmpty().withMessage('Question is required'),
  body('questions.*.options.a').notEmpty().withMessage('Option A is required'),
  body('questions.*.options.b').notEmpty().withMessage('Option B is required'),
  body('questions.*.options.c').notEmpty().withMessage('Option C is required'),
  body('questions.*.options.d').notEmpty().withMessage('Option D is required'),
  body('questions.*.correctAnswer').isIn(['a', 'b', 'c', 'd']).withMessage('Correct answer must be a, b, c, or d'),
  body('questions.*.explanation').notEmpty().withMessage('Explanation is required'),
];

const updateQuestionValidation = [
  body('question').optional().notEmpty().withMessage('Question cannot be empty'),
  body('correctAnswer').optional().isIn(['a', 'b', 'c', 'd']).withMessage('Correct answer must be a, b, c, or d'),
  body('explanation').optional().notEmpty().withMessage('Explanation cannot be empty'),
];

// ======================
// VIDEO QUIZ CRUD ROUTES
// ======================

router.route('/')
  .post(protect, authorize('instructor', 'admin'), videoQuizValidation, createVideoQuiz)
  .get(getAllVideoQuizzes);

router.get('/search', searchQuizzes);
router.get('/statistics', getQuizStatistics);
router.post('/bulk', protect, authorize('instructor', 'admin'), bulkCreateVideoQuizzes);
router.get('/title/:videoTitle', getVideoQuizByTitle);

// ======================
// HIERARCHICAL VIDEO ROUTES
// ======================

router.get('/module/:moduleName', getQuizzesByHierarchy);
router.get('/module/:moduleName/topic/:topicName', getQuizzesByHierarchy);
router.get('/module/:moduleName/topic/:topicName/subtopic/:subtopicName', getQuizzesByHierarchy);

/**
 * @desc    Get videos by course
 * @route   GET /api/videos/course/:courseName
 * @access  Public
 */
router.get('/course/:courseName', getQuizzesByCourse);

router.get('/context/:board/:grade/:medium', getQuizzesByEducationalContext);

router.route('/:id')
  .get(param('id').isMongoId().withMessage('Invalid quiz ID'), getVideoQuizById)
  .put(
    protect, 
    authorize('instructor', 'admin'),
    param('id').isMongoId().withMessage('Invalid quiz ID'),
    videoQuizValidation,
    updateVideoQuiz
  )
  .delete(
    protect, 
    authorize('instructor', 'admin'),
    param('id').isMongoId().withMessage('Invalid quiz ID'),
    deleteVideoQuiz
  );

// ======================
// QUIZ QUESTION MANAGEMENT ROUTES
// ======================

router.post('/:id/questions', 
  protect,
  authorize('instructor', 'admin'),
  param('id').isMongoId().withMessage('Invalid quiz ID'),
  quizQuestionValidation,
  addQuizQuestions
);

router.put('/:id/questions/:questionIndex',
  protect,
  authorize('instructor', 'admin'),
  param('id').isMongoId().withMessage('Invalid quiz ID'),
  param('questionIndex').isInt({ min: 0 }).withMessage('Question index must be a non-negative integer'),
  updateQuestionValidation,
  updateQuizQuestion
);

router.delete('/:id/questions/:questionIndex',
  protect,
  authorize('instructor', 'admin'),
  param('id').isMongoId().withMessage('Invalid quiz ID'),
  param('questionIndex').isInt({ min: 0 }).withMessage('Question index must be a non-negative integer'),
  deleteQuizQuestion
);

// ======================
// LEGACY ROUTES
// ======================

router.post('/:moduleId/videoquiz', protect, authorize('instructor', 'admin'), addVideo);
router.get('/:moduleId/videoquiz', getVideos);

router.route('/videoquiz/:id')
  .get(getVideo)
  .put(protect, authorize('instructor', 'admin'), updateVideo)
  .delete(protect, authorize('instructor', 'admin'), deleteVideo);

router.get('/modules/:moduleId/videos', getVideos);
router.get('/topics/:topicId/videos', getVideos);
router.get('/subtopics/:subtopicId/videos', getVideos);

module.exports = router;