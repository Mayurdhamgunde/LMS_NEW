const Module = require('../models/Module');
const VideoQuiz = require('../models/VideoQuiz');
const { validationResult } = require('express-validator');
 
// Helper function to get the correct models
const getModels = (tenantConnection) => {
  if (tenantConnection) {
    return {
      ModuleModel: tenantConnection.model('Module', Module.schema, 'modules'),
      VideoQuizModel: tenantConnection.model('VideoQuiz', VideoQuiz.schema, 'videoquizzes')
    };
  }
  return {
    ModuleModel: Module,
    VideoQuizModel: VideoQuiz
  };
};
 
// Helper function for error handling
const handleError = (res, error, statusCode = 500) => {
  console.error('VideoQuiz Controller Error:', error);
  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error : {}
  });
};
 
// Helper function for success response
const handleSuccess = (res, data, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};
 
/**
 * @desc    Create a new video quiz
 * @route   POST /api/videos
 * @access  Private
 */
exports.createVideoQuiz = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
 
    const {
      videoTitle,
      videoUrl,
      ytId,
      moduleName,
      topicName,
      subtopicName,
      courseName,
      board,
      grade,
      medium,
      quiz
    } = req.body;
    const tenantId = req.tenantId;
 
    // Validate required fields
    const isCBSE = (board || '').toUpperCase() === 'CBSE'
    if (!videoTitle || !videoUrl || !moduleName || !courseName || !board || !grade || (!isCBSE && !medium) || !tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Video title, URL, module name, course name, board, grade, and tenant ID are required. Medium is required unless board is CBSE.'
      });
    }
 
    // Get models
    const { VideoQuizModel } = getModels(req.tenantConnection);
 
    // Check if video with same title already exists in the same context
    const existingVideo = await VideoQuizModel.findOne({
      videoTitle,
      moduleName,
      topicName: topicName || null,
      subtopicName: subtopicName || null,
      tenantId
    });
 
    if (existingVideo) {
      return res.status(400).json({
        success: false,
        error: 'Video with this title already exists in the specified context'
      });
    }
 
    // Create video document
    const videoQuiz = new VideoQuizModel({
      videoTitle,
      videoUrl,
      ytId,
      moduleName,
      topicName,
      subtopicName,
      courseName,
      board,
      grade,
      medium: isCBSE ? undefined : medium,
      quiz: quiz || [],
      tenantId
    });
 
    const savedQuiz = await videoQuiz.save();
    return handleSuccess(res, savedQuiz, 'Video quiz created successfully', 201);
 
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Video with this configuration already exists'
      });
    }
    return handleError(res, error, 400);
  }
};
 
/**
 * @desc    Get all video quizzes with filtering and pagination
 * @route   GET /api/videos
 * @access  Public
 */
exports.getAllVideoQuizzes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      moduleName,
      topicName,
      subtopicName,
      courseName,
      board,
      grade,
      medium,
      videoTitle,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
 
    const tenantId = req.tenantId;
   
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
 
    // Build filter object
    const filter = { tenantId };
   
    if (moduleName) filter.moduleName = new RegExp(moduleName, 'i');
    if (topicName) filter.topicName = new RegExp(topicName, 'i');
    if (subtopicName) filter.subtopicName = new RegExp(subtopicName, 'i');
    if (courseName) filter.courseName = new RegExp(courseName, 'i');
    if (board) filter.board = new RegExp(board, 'i');
    if (grade) filter.grade = grade;
    if (medium) filter.medium = new RegExp(medium, 'i');
    if (videoTitle) filter.videoTitle = new RegExp(videoTitle, 'i');
 
    // Get models
    const { VideoQuizModel } = getModels(req.tenantConnection);
 
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
 
    // Execute query with pagination
    const [quizzes, total] = await Promise.all([
      VideoQuizModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      VideoQuizModel.countDocuments(filter)
    ]);
 
    const totalPages = Math.ceil(total / parseInt(limit));
 
    return handleSuccess(res, {
      quizzes,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    return handleError(res, error);
  }
};
 
/**
 * @desc    Get video quiz by ID
 * @route   GET /api/videos/:id
 * @access  Public
 */
exports.getVideoQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
 
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
 
    // Get models
    const { VideoQuizModel } = getModels(req.tenantConnection);
 
    const quiz = await VideoQuizModel.findOne({ _id: id, tenantId }).lean();
   
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Video quiz not found'
      });
    }
 
    return handleSuccess(res, quiz);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid video ID'
      });
    }
    return handleError(res, error);
  }
};
 
/**
 * @desc    Get video quiz by video title
 * @route   GET /api/videos/title/:videoTitle
 * @access  Public
 */
exports.getVideoQuizByTitle = async (req, res) => {
  try {
    const { videoTitle } = req.params;
    const tenantId = req.tenantId;
 
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
 
    // Get models
    const { VideoQuizModel } = getModels(req.tenantConnection);
 
    const quiz = await VideoQuizModel.findOne({
      videoTitle: new RegExp(`^${videoTitle}$`, 'i'),
      tenantId
    }).lean();
   
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Video quiz not found'
      });
    }
 
    return handleSuccess(res, quiz);
  } catch (error) {
    return handleError(res, error);
  }
};
 
/**
 * @desc    Update video quiz
 * @route   PUT /api/videos/:id
 * @access  Private
 */
exports.updateVideoQuiz = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
 
    const { id } = req.params;
    const tenantId = req.tenantId;
    const updateData = { ...req.body };
 
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
 
    // Remove tenantId from update data to prevent modification
    delete updateData.tenantId;
 
    // Get models
    const { VideoQuizModel } = getModels(req.tenantConnection);
 
    const updatedQuiz = await VideoQuizModel.findOneAndUpdate(
      { _id: id, tenantId },
      updateData,
      { new: true, runValidators: true }
    );
 
    if (!updatedQuiz) {
      return res.status(404).json({
        success: false,
        message: 'Video quiz not found'
      });
    }
 
    return handleSuccess(res, updatedQuiz, 'Video quiz updated successfully');
  } catch (error) {
    return handleError(res, error, 400);
  }
};
 
/**
 * @desc    Delete video quiz
 * @route   DELETE /api/videos/:id
 * @access  Private
 */
exports.deleteVideoQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
 
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
 
    // Get models
    const { VideoQuizModel } = getModels(req.tenantConnection);
 
    const deletedQuiz = await VideoQuizModel.findOneAndDelete({ _id: id, tenantId });
 
    if (!deletedQuiz) {
      return res.status(404).json({
        success: false,
        message: 'Video quiz not found'
      });
    }
 
    return handleSuccess(res, { id }, 'Video quiz deleted successfully');
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid video ID'
      });
    }
    return handleError(res, error);
  }
};
 
/**
 * @desc    Add quiz questions to existing video quiz
 * @route   POST /api/videos/:id/questions
 * @access  Private
 */
exports.addQuizQuestions = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
 
    const { id } = req.params;
    const { questions } = req.body;
    const tenantId = req.tenantId;
 
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
 
    // Get models
    const { VideoQuizModel } = getModels(req.tenantConnection);
 
    const updatedQuiz = await VideoQuizModel.findOneAndUpdate(
      { _id: id, tenantId },
      { $push: { quiz: { $each: questions } } },
      { new: true, runValidators: true }
    );
 
    if (!updatedQuiz) {
      return res.status(404).json({
        success: false,
        message: 'Video quiz not found'
      });
    }
 
    return handleSuccess(res, updatedQuiz, 'Quiz questions added successfully');
  } catch (error) {
    return handleError(res, error, 400);
  }
};
 
/**
 * @desc    Update a specific quiz question
 * @route   PUT /api/videos/:id/questions/:questionIndex
 * @access  Private
 */
exports.updateQuizQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
 
    const { id, questionIndex } = req.params;
    const questionData = req.body;
    const tenantId = req.tenantId;
 
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
 
    // Get models
    const { VideoQuizModel } = getModels(req.tenantConnection);
 
    const quiz = await VideoQuizModel.findOne({ _id: id, tenantId });
   
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Video quiz not found'
      });
    }
 
    const index = parseInt(questionIndex);
    if (index >= quiz.quiz.length || index < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question index'
      });
    }
 
    // Update the specific question
    quiz.quiz[index] = { ...quiz.quiz[index].toObject(), ...questionData };
    const updatedQuiz = await quiz.save();
 
    return handleSuccess(res, updatedQuiz, 'Quiz question updated successfully');
  } catch (error) {
    return handleError(res, error, 400);
  }
};
 
/**
 * @desc    Delete a specific quiz question
 * @route   DELETE /api/videos/:id/questions/:questionIndex
 * @access  Private
 */
exports.deleteQuizQuestion = async (req, res) => {
  try {
    const { id, questionIndex } = req.params;
    const tenantId = req.tenantId;
 
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
 
    // Get models
    const { VideoQuizModel } = getModels(req.tenantConnection);
 
    const quiz = await VideoQuizModel.findOne({ _id: id, tenantId });
   
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Video quiz not found'
      });
    }
 
    const index = parseInt(questionIndex);
    if (index >= quiz.quiz.length || index < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question index'
      });
    }
 
    quiz.quiz.splice(index, 1);
    const updatedQuiz = await quiz.save();
 
    return handleSuccess(res, updatedQuiz, 'Quiz question deleted successfully');
  } catch (error) {
    return handleError(res, error);
  }
};
 
/**
 * @desc    Get quizzes by hierarchy (module/topic/subtopic)
 * @route   GET /api/videos/hierarchy/:moduleName/:topicName?/:subtopicName?
 * @access  Public
 */
exports.getQuizzesByHierarchy = async (req, res) => {
  try {
    const { moduleName, topicName, subtopicName } = req.params;
    const tenantId = req.tenantId;
    const { page = 1, limit = 10 } = req.query;
 
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
 
    const filter = { tenantId, moduleName };
    if (topicName && topicName !== 'undefined') filter.topicName = topicName;
    if (subtopicName && subtopicName !== 'undefined') filter.subtopicName = subtopicName;
 
    // Get models
    const { VideoQuizModel } = getModels(req.tenantConnection);
 
    const skip = (parseInt(page) - 1) * parseInt(limit);
 
    const [quizzes, total] = await Promise.all([
      VideoQuizModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      VideoQuizModel.countDocuments(filter)
    ]);
 
    const totalPages = Math.ceil(total / parseInt(limit));
 
    return handleSuccess(res, {
      quizzes,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    return handleError(res, error);
  }
};
 
/**
 * @desc    Get quizzes by course
 * @route   GET /api/videos/course/:courseName
 * @access  Public
 */
exports.getQuizzesByCourse = async (req, res) => {
  try {
    const { courseName } = req.params;
    const tenantId = req.tenantId;
    const { page = 1, limit = 10 } = req.query;
 
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
 
    const filter = { tenantId, courseName };
 
    // Get models
    const { VideoQuizModel } = getModels(req.tenantConnection);
 
    const skip = (parseInt(page) - 1) * parseInt(limit);
 
    const [quizzes, total] = await Promise.all([
      VideoQuizModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      VideoQuizModel.countDocuments(filter)
    ]);
 
    const totalPages = Math.ceil(total / parseInt(limit));
 
    return handleSuccess(res, {
      quizzes,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    return handleError(res, error);
  }
};
 
/**
 * @desc    Get quizzes by educational context (board/grade/medium)
 * @route   GET /api/videos/context/:board/:grade/:medium
 * @access  Public
 */
exports.getQuizzesByEducationalContext = async (req, res) => {
  try {
    const { board, grade, medium } = req.params;
    const tenantId = req.tenantId;
    const { page = 1, limit = 10 } = req.query;
 
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
 
    const filter = { tenantId, board, grade, medium };
 
    // Get models
    const { VideoQuizModel } = getModels(req.tenantConnection);
 
    const skip = (parseInt(page) - 1) * parseInt(limit);
 
    const [quizzes, total] = await Promise.all([
      VideoQuizModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      VideoQuizModel.countDocuments(filter)
    ]);
 
    const totalPages = Math.ceil(total / parseInt(limit));
 
    return handleSuccess(res, {
      quizzes,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    return handleError(res, error);
  }
};
 
/**
 * @desc    Search quizzes
 * @route   GET /api/videos/search
 * @access  Public
 */
exports.searchQuizzes = async (req, res) => {
  try {
    const { q } = req.query;
    const tenantId = req.tenantId;
    const { page = 1, limit = 10 } = req.query;
 
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
 
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
 
    const searchRegex = new RegExp(q, 'i');
    const filter = {
      tenantId,
      $or: [
        { videoTitle: searchRegex },
        { moduleName: searchRegex },
        { topicName: searchRegex },
        { subtopicName: searchRegex },
        { courseName: searchRegex },
        { 'quiz.question': searchRegex }
      ]
    };
 
    // Get models
    const { VideoQuizModel } = getModels(req.tenantConnection);
 
    const skip = (parseInt(page) - 1) * parseInt(limit);
 
    const [quizzes, total] = await Promise.all([
      VideoQuizModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      VideoQuizModel.countDocuments(filter)
    ]);
 
    const totalPages = Math.ceil(total / parseInt(limit));
 
    return handleSuccess(res, {
      quizzes,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      searchQuery: q
    });
  } catch (error) {
    return handleError(res, error);
  }
};
 
/**
 * @desc    Get quiz statistics
 * @route   GET /api/videos/statistics
 * @access  Public
 */
exports.getQuizStatistics = async (req, res) => {
  try {
    const tenantId = req.tenantId;
 
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
 
    // Get models
    const { VideoQuizModel } = getModels(req.tenantConnection);
 
    const stats = await VideoQuizModel.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: null,
          totalQuizzes: { $sum: 1 },
          totalQuestions: { $sum: { $size: '$quiz' } },
          uniqueModules: { $addToSet: '$moduleName' },
          uniqueTopics: { $addToSet: '$topicName' },
          uniqueCourses: { $addToSet: '$courseName' },
          uniqueBoards: { $addToSet: '$board' },
          uniqueGrades: { $addToSet: '$grade' }
        }
      },
      {
        $project: {
          _id: 0,
          totalQuizzes: 1,
          totalQuestions: 1,
          uniqueModulesCount: { $size: '$uniqueModules' },
          uniqueTopicsCount: { $size: '$uniqueTopics' },
          uniqueCoursesCount: { $size: '$uniqueCourses' },
          uniqueBoardsCount: { $size: '$uniqueBoards' },
          uniqueGradesCount: { $size: '$uniqueGrades' }
        }
      }
    ]);
 
    return handleSuccess(res, stats[0] || {
      totalQuizzes: 0,
      totalQuestions: 0,
      uniqueModulesCount: 0,
      uniqueTopicsCount: 0,
      uniqueCoursesCount: 0,
      uniqueBoardsCount: 0,
      uniqueGradesCount: 0
    });
  } catch (error) {
    return handleError(res, error);
  }
};
 
/**
 * @desc    Bulk create video quizzes
 * @route   POST /api/videos/bulk
 * @access  Private
 */
exports.bulkCreateVideoQuizzes = async (req, res) => {
  try {
    const { quizzes } = req.body;
    const tenantId = req.tenantId;
 
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
 
    if (!Array.isArray(quizzes) || quizzes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Quizzes array is required and must not be empty'
      });
    }
 
    // Get models
    const { VideoQuizModel } = getModels(req.tenantConnection);
 
    // Add tenantId to all quizzes
    const quizzesWithTenant = quizzes.map(quiz => ({
      ...quiz,
      tenantId
    }));
 
    const createdQuizzes = await VideoQuizModel.insertMany(quizzesWithTenant, {
      ordered: false // Continue on error
    });
 
    return handleSuccess(res, createdQuizzes, 'Bulk video quizzes created successfully', 201);
  } catch (error) {
    return handleError(res, error, 400);
  }
};
 
// Legacy method aliases for backward compatibility
exports.addVideo = exports.createVideoQuiz;
exports.getVideos = exports.getAllVideoQuizzes;
exports.getVideo = exports.getVideoQuizById;
exports.updateVideo = exports.updateVideoQuiz;
exports.deleteVideo = exports.deleteVideoQuiz;
 