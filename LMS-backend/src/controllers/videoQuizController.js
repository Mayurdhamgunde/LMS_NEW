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

// Helper function to transform request data for storage
const transformRequestDataForStorage = (data, tenantId) => {
  const transformed = { ...data };
  
  if (tenantId === 'default') {
    // For default tenant, map incoming fields to storage fields
    if (transformed.moduleName !== undefined) {
      transformed.chapterName = transformed.moduleName;
      delete transformed.moduleName;
    }
    
    if (transformed.courseName !== undefined) {
      transformed.subName = transformed.courseName;
      delete transformed.courseName;
    }
    
    if (transformed.courseId !== undefined) {
      transformed.subjectId = transformed.courseId;
      delete transformed.courseId;
    }
    
    if (transformed.quiz !== undefined) {
      transformed.questions = transformed.quiz;
      delete transformed.quiz;
    }
  } else {
    // For non-default tenants, ensure standard field names
    if (transformed.chapterName !== undefined) {
      transformed.moduleName = transformed.chapterName;
      delete transformed.chapterName;
    }
    
    if (transformed.subName !== undefined) {
      transformed.courseName = transformed.subName;
      delete transformed.subName;
    }
    
    if (transformed.subjectId !== undefined) {
      delete transformed.subjectId;
    }
    
    if (transformed.questions !== undefined) {
      transformed.quiz = transformed.questions;
      delete transformed.questions;
    }
  }
  
  return transformed;
};

// Helper function to transform response data for output
const transformResponseDataForOutput = (data, tenantId) => {
  if (Array.isArray(data)) {
    return data.map(item => transformResponseDataForOutput(item, tenantId));
  } else if (data && typeof data === 'object') {
    const transformed = { ...data };
    
    if (tenantId === 'default') {
      // For default tenant, return the expected field names
      transformed.chapterName = transformed.chapterName || transformed.moduleName;
      transformed.subName = transformed.subName || transformed.courseName;
      transformed.questions = transformed.questions || transformed.quiz;
      
      // Remove the storage fields
      delete transformed.moduleName;
      delete transformed.courseName;
      delete transformed.quiz;
      delete transformed.subjectId; // Internal field, not exposed in response
    } else {
      // For non-default tenants, return standard field names
      transformed.moduleName = transformed.moduleName || transformed.chapterName;
      transformed.courseName = transformed.courseName || transformed.subName;
      transformed.quiz = transformed.quiz || transformed.questions;
      
      // Remove the default tenant fields
      delete transformed.chapterName;
      delete transformed.subName;
      delete transformed.questions;
      delete transformed.subjectId;
    }
    
    return transformed;
  }
  
  return data;
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
      courseId,
      board,
      grade,
      medium,
      quiz
    } = req.body;
    const tenantId = req.tenantId;
 
    // Transform data for storage based on tenant
    const storageData = transformRequestDataForStorage({
      videoTitle,
      videoUrl,
      ytId,
      moduleName,
      topicName,
      subtopicName,
      courseName,
      courseId,
      board,
      grade,
      medium,
      quiz
    }, tenantId);
 
    // Validate required fields
    const isCBSE = (board || '').toUpperCase() === 'CBSE';
    
    // Check required fields based on tenant
    let missingFields = [];
    
    if (!videoTitle) missingFields.push('videoTitle');
    if (!videoUrl) missingFields.push('videoUrl');
    if (!board) missingFields.push('board');
    if (!grade) missingFields.push('grade');
    
    if (tenantId === 'default') {
      if (!storageData.chapterName) missingFields.push('moduleName');
      if (!storageData.subName) missingFields.push('courseName');
      if (!storageData.subjectId) missingFields.push('courseId');
    } else {
      if (!storageData.moduleName) missingFields.push('moduleName');
      if (!storageData.courseName) missingFields.push('courseName');
    }
    
    if (!isCBSE && !medium) missingFields.push('medium');
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
 
    // Get models
    const { VideoQuizModel } = getModels(req.tenantConnection);
 
    // Check if video with same title already exists in the same context
    const contextField = tenantId === 'default' ? 'chapterName' : 'moduleName';
    const existingVideo = await VideoQuizModel.findOne({
      videoTitle: storageData.videoTitle,
      [contextField]: storageData[contextField],
      topicName: storageData.topicName || null,
      subtopicName: storageData.subtopicName || null,
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
      ...storageData,
      tenantId
    });
 
    const savedQuiz = await videoQuiz.save();
    const responseData = transformResponseDataForOutput(savedQuiz.toObject(), tenantId);
    
    return handleSuccess(res, responseData, 'Video quiz created successfully', 201);
 
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
    
    // Transform filter based on tenant
    if (tenantId === 'default') {
      if (moduleName) filter.chapterName = new RegExp(moduleName, 'i');
      if (courseName) filter.subName = new RegExp(courseName, 'i');
    } else {
      if (moduleName) filter.moduleName = new RegExp(moduleName, 'i');
      if (courseName) filter.courseName = new RegExp(courseName, 'i');
    }
    
    if (topicName) filter.topicName = new RegExp(topicName, 'i');
    if (subtopicName) filter.subtopicName = new RegExp(subtopicName, 'i');
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
    
    // Transform response based on tenant
    const transformedQuizzes = transformResponseDataForOutput(quizzes, tenantId);
 
    const totalPages = Math.ceil(total / parseInt(limit));
 
    return handleSuccess(res, {
      quizzes: transformedQuizzes,
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
    
    // Transform response based on tenant
    const transformedQuiz = transformResponseDataForOutput(quiz, tenantId);
 
    return handleSuccess(res, transformedQuiz);
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
    
    // Transform response based on tenant
    const transformedQuiz = transformResponseDataForOutput(quiz, tenantId);
 
    return handleSuccess(res, transformedQuiz);
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
    const updateData = transformRequestDataForStorage({ ...req.body }, tenantId);
 
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
    
    // Transform response based on tenant
    const transformedQuiz = transformResponseDataForOutput(updatedQuiz.toObject(), tenantId);
 
    return handleSuccess(res, transformedQuiz, 'Video quiz updated successfully');
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
    
    // Transform response based on tenant
    const transformedQuiz = transformResponseDataForOutput(deletedQuiz.toObject(), tenantId);
 
    return handleSuccess(res, transformedQuiz, 'Video quiz deleted successfully');
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
 
    const fieldName = tenantId === 'default' ? 'questions' : 'quiz';
    
    const updatedQuiz = await VideoQuizModel.findOneAndUpdate(
      { _id: id, tenantId },
      { $push: { [fieldName]: { $each: questions } } },
      { new: true, runValidators: true }
    );
 
    if (!updatedQuiz) {
      return res.status(404).json({
        success: false,
        message: 'Video quiz not found'
      });
    }
    
    // Transform response based on tenant
    const transformedQuiz = transformResponseDataForOutput(updatedQuiz.toObject(), tenantId);
 
    return handleSuccess(res, transformedQuiz, 'Quiz questions added successfully');
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
    const fieldName = tenantId === 'default' ? 'questions' : 'quiz';
    
    if (index >= quiz[fieldName].length || index < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question index'
      });
    }
 
    // Update the specific question
    quiz[fieldName][index] = { ...quiz[fieldName][index].toObject(), ...questionData };
    const updatedQuiz = await quiz.save();
    
    // Transform response based on tenant
    const transformedQuiz = transformResponseDataForOutput(updatedQuiz.toObject(), tenantId);
 
    return handleSuccess(res, transformedQuiz, 'Quiz question updated successfully');
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
    const fieldName = tenantId === 'default' ? 'questions' : 'quiz';
    
    if (index >= quiz[fieldName].length || index < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question index'
      });
    }
 
    quiz[fieldName].splice(index, 1);
    const updatedQuiz = await quiz.save();
    
    // Transform response based on tenant
    const transformedQuiz = transformResponseDataForOutput(updatedQuiz.toObject(), tenantId);
 
    return handleSuccess(res, transformedQuiz, 'Quiz question deleted successfully');
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
 
    const filter = { tenantId };
    
    // Transform filter based on tenant
    if (tenantId === 'default') {
      filter.chapterName = moduleName;
    } else {
      filter.moduleName = moduleName;
    }
    
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
    
    // Transform response based on tenant
    const transformedQuizzes = transformResponseDataForOutput(quizzes, tenantId);
 
    const totalPages = Math.ceil(total / parseInt(limit));
 
    return handleSuccess(res, {
      quizzes: transformedQuizzes,
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
 
    const filter = { tenantId };
    
    // Transform filter based on tenant
    if (tenantId === 'default') {
      filter.subName = courseName;
    } else {
      filter.courseName = courseName;
    }
 
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
    
    // Transform response based on tenant
    const transformedQuizzes = transformResponseDataForOutput(quizzes, tenantId);
 
    const totalPages = Math.ceil(total / parseInt(limit));
 
    return handleSuccess(res, {
      quizzes: transformedQuizzes,
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
    
    // Transform response based on tenant
    const transformedQuizzes = transformResponseDataForOutput(quizzes, tenantId);
 
    const totalPages = Math.ceil(total / parseInt(limit));
 
    return handleSuccess(res, {
      quizzes: transformedQuizzes,
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
        { chapterName: searchRegex },
        { topicName: searchRegex },
        { subtopicName: searchRegex },
        { courseName: searchRegex },
        { subName: searchRegex },
        { 'quiz.question': searchRegex },
        { 'questions.question': searchRegex }
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
    
    // Transform response based on tenant
    const transformedQuizzes = transformResponseDataForOutput(quizzes, tenantId);
 
    const totalPages = Math.ceil(total / parseInt(limit));
 
    return handleSuccess(res, {
      quizzes: transformedQuizzes,
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
          totalQuestions: { 
            $sum: { 
              $cond: [
                { $eq: ['$tenantId', 'default'] },
                { $size: '$questions' },
                { $size: '$quiz' }
              ]
            }
          },
          uniqueModules: { 
            $addToSet: { 
              $cond: [
                { $eq: ['$tenantId', 'default'] },
                '$chapterName',
                '$moduleName'
              ]
            }
          },
          uniqueTopics: { $addToSet: '$topicName' },
          uniqueCourses: { 
            $addToSet: { 
              $cond: [
                { $eq: ['$tenantId', 'default'] },
                '$subName',
                '$courseName'
              ]
            }
          },
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
 
    // Add tenantId and transform data for all quizzes
    const quizzesWithTenant = quizzes.map(quiz => ({
      ...transformRequestDataForStorage(quiz, tenantId),
      tenantId
    }));
 
    const createdQuizzes = await VideoQuizModel.insertMany(quizzesWithTenant, {
      ordered: false // Continue on error
    });
    
    // Transform response based on tenant
    const transformedQuizzes = transformResponseDataForOutput(createdQuizzes, tenantId);
 
    return handleSuccess(res, transformedQuizzes, 'Bulk video quizzes created successfully', 201);
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