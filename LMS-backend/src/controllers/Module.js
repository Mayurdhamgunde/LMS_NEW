const Module = require('../models/Module');
const Course = require('../models/Course');
const { switchTenant } = require('../utils/tenantUtils');
const mongoose = require('mongoose');

// Helper function to get the correct models
const getModels = (tenantConnection) => {
  if (tenantConnection) {
    return {
      CourseModel: tenantConnection.model('Course', Course.schema, 'courses'),
      ModuleModel: tenantConnection.model('Module', Module.schema, 'modules')
    };
  }
  return {
    CourseModel: Course,
    ModuleModel: Module
  };
};

// Helper function to validate video object
const validateVideo = (video, context = '') => {
  if (!video || typeof video !== 'object') {
    return `${context}Video must be an object`;
  }
  // Make _id optional for creation - backend will generate it
  if (video._id && !mongoose.Types.ObjectId.isValid(video._id)) {
    return `${context}Video _id must be a valid ObjectId if provided`;
  }
  if (!video.videoUrl || typeof video.videoUrl !== 'string') {
    return `${context}Video videoUrl is required and must be a string`;
  }
  return null;
};

// Helper function to validate subtopic object
const validateSubtopic = (subtopic, topicIndex) => {
  if (!subtopic || typeof subtopic !== 'object') {
    return `Topic ${topicIndex}: Subtopic must be an object`;
  }
  if (!subtopic.subtopicName || typeof subtopic.subtopicName !== 'string') {
    return `Topic ${topicIndex}: Subtopic subtopicName is required and must be a string`;
  }
  if (subtopic.videos && Array.isArray(subtopic.videos)) {
    for (let i = 0; i < subtopic.videos.length; i++) {
      const videoError = validateVideo(subtopic.videos[i], `Topic ${topicIndex} subtopic "${subtopic.subtopicName}" video ${i}: `);
      if (videoError) {
        return videoError;
      }
    }
  } else if (subtopic.videos && !Array.isArray(subtopic.videos)) {
    return `Topic ${topicIndex}: Subtopic videos must be an array`;
  }
  return null;
};

// Helper function to validate topic object
const validateTopic = (topic, index) => {
  if (!topic || typeof topic !== 'object') {
    return `Topic at index ${index} must be an object`;
  }
  if (!topic.topicName || typeof topic.topicName !== 'string') {
    return `Topic at index ${index}: topicName is required and must be a string`;
  }
  
  // Validate subtopics array
  if (topic.subtopics && Array.isArray(topic.subtopics)) {
    for (let i = 0; i < topic.subtopics.length; i++) {
      const subtopicError = validateSubtopic(topic.subtopics[i], index);
      if (subtopicError) {
        return subtopicError;
      }
    }
  } else if (topic.subtopics && !Array.isArray(topic.subtopics)) {
    return `Topic at index ${index}: subtopics must be an array`;
  }
  
  // Validate videos array
  if (topic.videos && Array.isArray(topic.videos)) {
    for (let i = 0; i < topic.videos.length; i++) {
      const videoError = validateVideo(topic.videos[i], `Topic "${topic.topicName}" video ${i}: `);
      if (videoError) {
        return videoError;
      }
    }
  } else if (topic.videos && !Array.isArray(topic.videos)) {
    return `Topic at index ${index}: videos must be an array`;
  }
  
  return null;
};

// Helper function to validate module data
const validateModuleData = (data, isUpdate = false) => {
  const errors = [];

  // Required fields validation (only for create)
  if (!isUpdate) {
    if (!data.title) errors.push('Title is required');
    if (!data.courseId) errors.push('Course ID is required');
  }

  // Title validation
  if (data.title && data.title.length > 100) {
    errors.push('Title cannot be more than 100 characters');
  }

  // Difficulty validation
  if (data.difficulty && !['Beginner', 'Intermediate', 'Advanced'].includes(data.difficulty)) {
    errors.push('Difficulty must be one of: Beginner, Intermediate, Advanced');
  }

  // Topics validation (new nested structure)
  if (data.topics && Array.isArray(data.topics)) {
    for (let i = 0; i < data.topics.length; i++) {
      const topicError = validateTopic(data.topics[i], i);
      if (topicError) {
        errors.push(topicError);
      }
    }
  } else if (data.topics && !Array.isArray(data.topics)) {
    errors.push('Topics must be an array');
  }

  // Module-level videos validation
  if (data.videos && Array.isArray(data.videos)) {
    for (let i = 0; i < data.videos.length; i++) {
      const videoError = validateVideo(data.videos[i], `Module video ${i}: `);
      if (videoError) {
        errors.push(videoError);
      }
    }
  } else if (data.videos && !Array.isArray(data.videos)) {
    errors.push('Videos must be an array');
  }

  return errors;
};

// @desc    Create new module
// @route   POST /api/modules/:courseId/
// @access  Public
exports.createNgoModule = async (req, res) => {
  try {
    console.log('Creating module with data:', JSON.stringify(req.body));
    console.log('Course ID:', req.params.courseId);
    console.log('Tenant ID:', req.tenantId);
    
    // Validate required fields
    const validationErrors = validateModuleData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: validationErrors.join(', ')
      });
    }

    // Validate courseId parameter
    if (!req.params.courseId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID is required'
      });
    }

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Use tenant-specific models if available, otherwise use default
    const { CourseModel, ModuleModel } = getModels(req.tenantConnection);

    // Set timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 30000);
    });

    // Check if course exists
    const course = await Promise.race([
      CourseModel.findOne({ _id: req.params.courseId, tenantId: req.tenantId }),
      timeoutPromise
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found for this tenant'
      });
    }

    // Prepare module data
    const moduleData = {
      ...req.body,
      courseId: req.params.courseId,
      tenantId: req.tenantId
    };

    // Generate ObjectIds for videos that don't have them
    if (moduleData.videos && Array.isArray(moduleData.videos)) {
      moduleData.videos = moduleData.videos.map(video => ({
        ...video,
        _id: video._id || new mongoose.Types.ObjectId()
      }));
    }

    if (moduleData.topics && Array.isArray(moduleData.topics)) {
      moduleData.topics = moduleData.topics.map(topic => {
        const updatedTopic = { ...topic };
        
        // Generate ObjectIds for topic videos
        if (topic.videos && Array.isArray(topic.videos)) {
          updatedTopic.videos = topic.videos.map(video => ({
            ...video,
            _id: video._id || new mongoose.Types.ObjectId()
          }));
        }
        
        // Generate ObjectIds for subtopic videos
        if (topic.subtopics && Array.isArray(topic.subtopics)) {
          updatedTopic.subtopics = topic.subtopics.map(subtopic => {
            const updatedSubtopic = { ...subtopic };
            if (subtopic.videos && Array.isArray(subtopic.videos)) {
              updatedSubtopic.videos = subtopic.videos.map(video => ({
                ...video,
                _id: video._id || new mongoose.Types.ObjectId()
              }));
            }
            return updatedSubtopic;
          });
        }
        
        return updatedTopic;
      });
    }

    // Create module with timeout protection
    const module = await Promise.race([
      ModuleModel.create(moduleData),
      timeoutPromise
    ]);

    console.log('Module created successfully:', module._id);

    // Populate the module with course information for response
    const populatedModule = await Promise.race([
      ModuleModel.findById(module._id).populate('courseId', 'title description'),
      timeoutPromise
    ]);

    res.status(201).json({
      success: true,
      data: populatedModule,
      message: 'Module created successfully'
    });

  } catch (err) {
    console.error(`Error in createNgoModule: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    if (err.message === 'Database operation timed out') {
      return res.status(504).json({
        success: false,
        error: 'Database operation timed out'
      });
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `A module with this ${field} already exists in this course`
      });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Get all modules for a course
// @route   GET /api/courses/:courseId/modules
// @access  Public
exports.getNgoModules = async (req, res) => {
  try {
    console.log('Getting modules for course:', req.params.courseId);
    console.log('Tenant ID:', req.tenantId);
    
    // Validate courseId parameter
    if (!req.params.courseId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID is required'
      });
    }

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Use tenant-specific models if available, otherwise use default
    const { CourseModel, ModuleModel } = getModels(req.tenantConnection);

    // Set timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 30000);
    });

    // Check if course exists
    const course = await Promise.race([
      CourseModel.findOne({ _id: req.params.courseId, tenantId: req.tenantId }),
      timeoutPromise
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found for this tenant'
      });
    }

    // Build query for modules
    let query = { 
      courseId: req.params.courseId, 
      tenantId: req.tenantId 
    };

    // Add optional filters
    if (req.query.difficulty) {
      query.difficulty = req.query.difficulty;
    }

    if (req.query.isCompleted !== undefined) {
      query.isCompleted = req.query.isCompleted === 'true';
    }

    // Search functionality (updated for new schema structure)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { 'topics.topicName': { $regex: req.query.search, $options: 'i' } },
        { 'topics.subtopics.subtopicName': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sort options
    let sortBy = {};
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      sortBy[sortField] = sortOrder;
    } else {
      sortBy = { createdAt: 1 }; // Default sort by creation order
    }

    // Get modules with pagination
    const [modules, totalCount] = await Promise.all([
      Promise.race([
        ModuleModel.find(query)
          .populate('courseId', 'title description')
          .sort(sortBy)
          .skip(skip)
          .limit(limit)
          .lean(),
        timeoutPromise
      ]),
      Promise.race([
        ModuleModel.countDocuments(query),
        timeoutPromise
      ])
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      data: modules,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });

  } catch (err) {
    console.error(`Error in getNgoModules: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    if (err.message === 'Database operation timed out') {
      return res.status(504).json({
        success: false,
        error: 'Database operation timed out'
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Get single module
// @route   GET /api/courses/:courseId/modules/:moduleId
// @access  Public
exports.getNgoModule = async (req, res) => {
  try {
    console.log('Getting module:', req.params.moduleId, 'for course:', req.params.courseId);
    console.log('Tenant ID:', req.tenantId);

    // Validate parameters
    if (!req.params.courseId || !req.params.moduleId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID and Module ID are required'
      });
    }

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Use tenant-specific models if available, otherwise use default
    const { ModuleModel } = getModels(req.tenantConnection);

    // Set timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 30000);
    });

    // Find the module
    const module = await Promise.race([
      ModuleModel.findOne({
        _id: req.params.moduleId,
        courseId: req.params.courseId,
        tenantId: req.tenantId
      }).populate('courseId', 'title description'),
      timeoutPromise
    ]);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found or does not belong to specified course and tenant'
      });
    }

    return res.status(200).json({
      success: true,
      data: module
    });

  } catch (err) {
    console.error(`Error in getNgoModule: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    if (err.message === 'Database operation timed out') {
      return res.status(504).json({
        success: false,
        error: 'Database operation timed out'
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }
    
    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Update module
// @route   PUT /api/courses/:courseId/modules/:moduleId
// @access  Public
exports.updateNgoModule = async (req, res) => {
  try {
    console.log('Updating module:', req.params.moduleId, 'for course:', req.params.courseId);
    console.log('Update data:', JSON.stringify(req.body));
    console.log('Tenant ID:', req.tenantId);

    // Validate parameters
    if (!req.params.courseId || !req.params.moduleId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID and Module ID are required'
      });
    }

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate input data
    const validationErrors = validateModuleData(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: validationErrors.join(', ')
      });
    }

    // Use tenant-specific models if available, otherwise use default
    const { CourseModel, ModuleModel } = getModels(req.tenantConnection);

    // Set timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 30000);
    });

    // Check if course exists
    const course = await Promise.race([
      CourseModel.findOne({ _id: req.params.courseId, tenantId: req.tenantId }),
      timeoutPromise
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found for this tenant'
      });
    }

    // Prepare update data - exclude system fields
    const updateData = {};
    const excludedFields = ['_id', 'courseId', 'tenantId', 'createdAt', '__v'];
    
    Object.keys(req.body).forEach(key => {
      if (!excludedFields.includes(key) && req.body[key] !== undefined && req.body[key] !== null) {
        updateData[key] = req.body[key];
      }
    });

    // Ensure any newly provided videos have ObjectIds (schema requires _id)
    if (updateData.videos && Array.isArray(updateData.videos)) {
      updateData.videos = updateData.videos.map(video => ({
        ...video,
        _id: video._id || new mongoose.Types.ObjectId()
      }));
    }

    if (updateData.topics && Array.isArray(updateData.topics)) {
      updateData.topics = updateData.topics.map(topic => {
        const updatedTopic = { ...topic };

        if (topic.videos && Array.isArray(topic.videos)) {
          updatedTopic.videos = topic.videos.map(video => ({
            ...video,
            _id: video._id || new mongoose.Types.ObjectId()
          }));
        }

        if (topic.subtopics && Array.isArray(topic.subtopics)) {
          updatedTopic.subtopics = topic.subtopics.map(subtopic => {
            const updatedSubtopic = { ...subtopic };
            if (subtopic.videos && Array.isArray(subtopic.videos)) {
              updatedSubtopic.videos = subtopic.videos.map(video => ({
                ...video,
                _id: video._id || new mongoose.Types.ObjectId()
              }));
            }
            return updatedSubtopic;
          });
        }

        return updatedTopic;
      });
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    // Find and update the module
    const module = await Promise.race([
      ModuleModel.findOneAndUpdate(
        { 
          _id: req.params.moduleId, 
          courseId: req.params.courseId,
          tenantId: req.tenantId
        },
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('courseId', 'title description'),
      timeoutPromise
    ]);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found for this tenant and course'
      });
    }

    res.status(200).json({
      success: true,
      data: module,
      message: 'Module updated successfully'
    });

  } catch (err) {
    console.error(`Error in updateNgoModule: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    if (err.message === 'Database operation timed out') {
      return res.status(504).json({
        success: false,
        error: 'Database operation timed out'
      });
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `A module with this ${field} already exists in this course`
      });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid module ID or course ID format'
      });
    }

    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Delete module
// @route   DELETE /api/courses/:courseId/modules/:moduleId
// @access  Public
exports.deleteNgoModule = async (req, res) => {
  try {
    console.log('Deleting module:', req.params.moduleId, 'for course:', req.params.courseId);
    console.log('Tenant ID:', req.tenantId);

    // Validate parameters
    if (!req.params.courseId || !req.params.moduleId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID and Module ID are required'
      });
    }

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Use tenant-specific models if available, otherwise use default
    const { CourseModel, ModuleModel } = getModels(req.tenantConnection);

    // Set timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 30000);
    });

    // Check if course exists
    const course = await Promise.race([
      CourseModel.findOne({ _id: req.params.courseId, tenantId: req.tenantId }),
      timeoutPromise
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found for this tenant'
      });
    }

    // Find and delete the module
    const module = await Promise.race([
      ModuleModel.findOneAndDelete({ 
        _id: req.params.moduleId, 
        courseId: req.params.courseId,
        tenantId: req.tenantId
      }),
      timeoutPromise
    ]);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found for this tenant and course'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Module deleted successfully',
      data: {
        _id: module._id,
        title: module.title
      }
    });

  } catch (err) {
    console.error(`Error in deleteNgoModule: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    if (err.message === 'Database operation timed out') {
      return res.status(504).json({
        success: false,
        error: 'Database operation timed out'
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid module ID or course ID format'
      });
    }

    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Toggle module completion status
// @route   PUT /api/ngo-lms/courses/:courseId/modules/:moduleId/toggle-completion
// @access  Private
exports.toggleModuleCompletion = async (req, res) => {
  try {
    console.log('Toggling completion for module:', req.params.moduleId);
    console.log('Tenant ID:', req.tenantId);

    // Validate parameters
    if (!req.params.courseId || !req.params.moduleId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID and Module ID are required'
      });
    }

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Use tenant-specific models
    const { ModuleModel } = getModels(req.tenantConnection);

    // Find current module
    const currentModule = await ModuleModel.findOne({
      _id: req.params.moduleId,
      courseId: req.params.courseId,
      tenantId: req.tenantId
    });

    if (!currentModule) {
      return res.status(404).json({
        success: false,
        error: 'Module not found for this tenant and course'
      });
    }

    // Toggle completion status
    const updatedModule = await ModuleModel.findByIdAndUpdate(
      req.params.moduleId,
      { 
        $set: { 
          isCompleted: !currentModule.isCompleted,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).populate('courseId', 'title description');

    res.status(200).json({
      success: true,
      data: updatedModule,
      message: `Module marked as ${updatedModule.isCompleted ? 'completed' : 'incomplete'}`
    });

  } catch (err) {
    console.error(`Error in toggleModuleCompletion: ${err.message}`);
    
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid module ID or course ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Public: Get all modules for a course for tenant "ngo"
// @route   GET /api/ngo-lms/ngo-public-course/:courseId/modules
// @access  Public
exports.getPublicNgoModules = async (req, res) => {
  try {
    console.log('Getting modules for course (public):', req.params.courseId);
    
    // Validate courseId parameter
    if (!req.params.courseId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID is required'
      });
    }

    const tenantId = 'ngo'; // Hardcoded tenant
    const tenantConnection = await switchTenant(tenantId);
    
    if (!tenantConnection || tenantConnection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Could not connect to tenant database',
      });
    }

    // Get models from tenant connection
    const { CourseModel, ModuleModel } = getModels(tenantConnection);

    // Set timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 30000);
    });

    // Check if course exists and is published
    const course = await Promise.race([
      CourseModel.findOne({ 
        _id: req.params.courseId, 
        tenantId,
        status: 'published' 
      }),
      timeoutPromise
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found or not published'
      });
    }

    // Build query for modules
    let query = { 
      courseId: req.params.courseId, 
      tenantId 
    };

    // Add optional filters
    if (req.query.difficulty) {
      query.difficulty = req.query.difficulty;
    }

    // Search functionality (updated for new schema structure)
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { 'topics.topicName': { $regex: req.query.search, $options: 'i' } },
        { 'topics.subtopics.subtopicName': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sort options
    let sortBy = {};
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      sortBy[sortField] = sortOrder;
    } else {
      sortBy = { createdAt: 1 }; // Default sort by creation order
    }

    // Get all modules for the course
    const [modules, totalCount] = await Promise.all([
      Promise.race([
        ModuleModel.find(query)
          .populate('courseId', 'title description')
          .sort(sortBy)
          .skip(skip)
          .limit(limit)
          .lean(),
        timeoutPromise
      ]),
      Promise.race([
        ModuleModel.countDocuments(query),
        timeoutPromise
      ])
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: modules,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error('getPublicNgoModules error:', error.message);
    console.error('Error stack:', error.stack);
        
    // Handle timeout errors
    if (error.message === 'Database operation timed out' || 
        error.message.includes('buffering timed out')) {
      return res.status(504).json({
        success: false,
        error: 'Database operation timed out. Please check your database connection and try again.'
      });
    }
        
    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Handle MongoDB connection errors
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error. Please try again later.'
      });
    }
        
    // Generic server error
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching modules',
    });
  }
};

// @desc    Public: Get single module for tenant "ngo"
// @route   GET /api/ngo-lms/ngo-public-course/:courseId/modules/:moduleId
// @access  Public
exports.getPublicNgoModule = async (req, res) => {
  try {
    console.log('Getting module:', req.params.moduleId, 'for course:', req.params.courseId, '(public)');
    
    // Validate parameters
    if (!req.params.courseId || !req.params.moduleId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID and Module ID are required'
      });
    }

    const tenantId = 'ngo'; // Hardcoded tenant
    const tenantConnection = await switchTenant(tenantId);
    
    if (!tenantConnection || tenantConnection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Could not connect to tenant database',
      });
    }

    // Get models from tenant connection
    const { CourseModel, ModuleModel } = getModels(tenantConnection);

    // Set timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 30000);
    });

    // Check if course exists and is published first
    const course = await Promise.race([
      CourseModel.findOne({ 
        _id: req.params.courseId, 
        tenantId,
        status: 'published' 
      }),
      timeoutPromise
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found or not published'
      });
    }

    // Find the specific module
    const module = await Promise.race([
      ModuleModel.findOne({
        _id: req.params.moduleId,
        courseId: req.params.courseId,
        tenantId
      })
        .populate('courseId', 'title description')
        .lean(),
      timeoutPromise
    ]);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found or not published'
      });
    }

    return res.status(200).json({
      success: true,
      data: module
    });

  } catch (error) {
    console.error('getPublicNgoModule error:', error.message);
    console.error('Error stack:', error.stack);
        
    // Handle timeout errors
    if (error.message === 'Database operation timed out' ||
        error.message.includes('buffering timed out')) {
      return res.status(504).json({
        success: false,
        error: 'Database operation timed out. Please check your database connection and try again.'
      });
    }
        
    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID or module ID format'
      });
    }

    // Handle MongoDB connection errors
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error. Please try again later.'
      });
    }
        
    // Generic server error
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching module',
    });
  }
};
