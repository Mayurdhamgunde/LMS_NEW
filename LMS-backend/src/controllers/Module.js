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
  if (!subtopic.subtopicname || typeof subtopic.subtopicname !== 'string') {
    return `Topic ${topicIndex}: Subtopic subtopicname is required and must be a string`;
  }
  if (subtopic.videos && Array.isArray(subtopic.videos)) {
    for (let i = 0; i < subtopic.videos.length; i++) {
      const videoError = validateVideo(subtopic.videos[i], `Topic ${topicIndex} subtopic "${subtopic.subtopicname}" video ${i}: `);
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
  if (!topic.topicname || typeof topic.topicname !== 'string') {
    return `Topic at index ${index}: topicname is required and must be a string`;
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
      const videoError = validateVideo(topic.videos[i], `Topic "${topic.topicname}" video ${i}: `);
      if (videoError) {
        return videoError;
      }
    }
  } else if (topic.videos && !Array.isArray(topic.videos)) {
    return `Topic at index ${index}: videos must be an array`;
  }
  
  return null;
};

// Helper function to validate module data based on tenant
const validateModuleData = (data, tenantId, isUpdate = false) => {
  const errors = [];

  // Required fields validation based on tenant
  if (!isUpdate) {
    if (tenantId === 'default') {
      if (!data.title) errors.push('Title is required (will be stored as chaptername)');
      if (!data.board) errors.push('Board is required for default tenant');
      if (!data.grade) errors.push('Grade is required for default tenant');
    } else {
      if (!data.title) errors.push('Title is required');
    }
    if (!data.courseId) errors.push('Course ID is required');
  }

  // Title validation
  if (data.title && data.title.length > 100) {
    errors.push('Title cannot be more than 100 characters');
  }

  // Chapter name validation for default tenant
  if (data.chaptername && data.chaptername.length > 100) {
    errors.push('Chapter name cannot be more than 100 characters');
  }

  // Difficulty validation
  if (data.difficulty && !['Beginner', 'Intermediate', 'Advanced'].includes(data.difficulty)) {
    errors.push('Difficulty must be one of: Beginner, Intermediate, Advanced');
  }

  // Topics validation
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

// Helper function to prepare module data based on tenant
const prepareModuleData = (data, tenantId, courseId) => {
  const moduleData = {
    ...data,
    courseId,
    tenantId
  };

  // Ensure medium is always an array of strings
  if (Object.prototype.hasOwnProperty.call(moduleData, 'medium')) {
    moduleData.medium = normalizeMedium(moduleData.medium);
  }

  // For default tenant, the pre-save middleware will handle the mapping
  // But we still set the data properly for creation
  if (tenantId === 'default') {
    // The schema's pre-save middleware will map these automatically
    if (data.title) {
      moduleData.chaptername = data.title;
      // Keep title for the pre-save middleware to handle
    }
    if (data.coursename) {
      moduleData.subjectname = data.coursename;
      // Keep coursename for the pre-save middleware to handle
    }
    if (data.courseId) {
      moduleData.subjectid = data.courseId;
      // Keep courseId for the pre-save middleware to handle
    }
  }

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

  return moduleData;
};

// Helper function to build search query based on tenant
const buildSearchQuery = (searchTerm, tenantId) => {
  if (tenantId === 'default') {
    return {
      $or: [
        { chaptername: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { subjectname: { $regex: searchTerm, $options: 'i' } },
        { 'topics.topicname': { $regex: searchTerm, $options: 'i' } },
        { 'topics.subtopics.subtopicname': { $regex: searchTerm, $options: 'i' } }
      ]
    };
  } else {
    return {
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { coursename: { $regex: searchTerm, $options: 'i' } },
        { 'topics.topicname': { $regex: searchTerm, $options: 'i' } },
        { 'topics.subtopics.subtopicname': { $regex: searchTerm, $options: 'i' } }
      ]
    };
  }
};

// Helper function to get the correct course query based on tenant
const getCourseQuery = (courseId, tenantId) => {
  if (tenantId === 'default') {
    return {
      $or: [
        { courseId: courseId, tenantId: tenantId },
        { subjectid: courseId, tenantId: tenantId }
      ]
    };
  } else {
    return { courseId: courseId, tenantId: tenantId };
  }
};

// Normalize medium to an array of strings
const normalizeMedium = (value) => {
  if (Array.isArray(value)) {
    return value
      .map(v => (typeof v === 'string' ? v : String(v)))
      .map(v => v.trim())
      .filter(v => v.length > 0);
  }
  if (typeof value === 'string') {
    // Split by comma and trim each entry; collapse multiple spaces/commas
    return value
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);
  }
  return [];
};

// @desc    Create new module
// @route   POST /api/modules/:courseId/
// @access  Public
exports.createNgoModule = async (req, res) => {
  try {
    console.log('Creating module with data:', JSON.stringify(req.body));
    console.log('Course ID:', req.params.courseId);
    console.log('Tenant ID:', req.tenantId);
    
    // Normalize inputs
    const requestBody = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(requestBody, 'medium')) {
      requestBody.medium = normalizeMedium(requestBody.medium);
    }

    // Validate required fields
    const validationErrors = validateModuleData(requestBody, req.tenantId);
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

    // Prepare module data based on tenant
    const moduleData = prepareModuleData(requestBody, req.tenantId, req.params.courseId);

    // Create module with timeout protection
    const module = await Promise.race([
      ModuleModel.create(moduleData),
      timeoutPromise
    ]);

    console.log('Module created successfully:', module._id);

    // Populate the module with course information for response
    const populateField = req.tenantId === 'default' ? 'subjectid' : 'courseId';
    const populatedModule = await Promise.race([
      ModuleModel.findById(module._id).populate(populateField, 'title description'),
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

    // Build query for modules based on tenant
    let query = getCourseQuery(req.params.courseId, req.tenantId);

    // Add optional filters
    if (req.query.difficulty) {
      query.difficulty = req.query.difficulty;
    }

    if (req.query.isCompleted !== undefined) {
      query.isCompleted = req.query.isCompleted === 'true';
    }

    // Search functionality based on tenant
    if (req.query.search) {
      const searchQuery = buildSearchQuery(req.query.search, req.tenantId);
      query = { ...query, ...searchQuery };
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 60;
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

    // Get population field based on tenant
    const populateField = req.tenantId === 'default' ? 'subjectid' : 'courseId';

    // Get modules with pagination
    const [modules, totalCount] = await Promise.all([
      Promise.race([
        ModuleModel.find(query)
          .populate(populateField, 'title description')
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

    // Build query based on tenant
    const moduleQuery = {
      _id: req.params.moduleId,
      tenantId: req.tenantId
    };

    // Add course reference based on tenant
    if (req.tenantId === 'default') {
      moduleQuery.$or = [
        { courseId: req.params.courseId },
        { subjectid: req.params.courseId }
      ];
    } else {
      moduleQuery.courseId = req.params.courseId;
    }

    // Get population field based on tenant
    const populateField = req.tenantId === 'default' ? 'subjectid' : 'courseId';

    // Find the module
    const module = await Promise.race([
      ModuleModel.findOne(moduleQuery).populate(populateField, 'title description'),
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

    // Normalize inputs
    const requestBody = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(requestBody, 'medium')) {
      requestBody.medium = normalizeMedium(requestBody.medium);
    }

    // Validate input data
    const validationErrors = validateModuleData(requestBody, req.tenantId, true);
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

    // Prepare update data based on tenant
    const updateData = {};
    const excludedFields = ['_id', 'courseId', 'tenantId', 'createdAt', '__v'];
    
    Object.keys(requestBody).forEach(key => {
      if (!excludedFields.includes(key) && requestBody[key] !== undefined && requestBody[key] !== null) {
        updateData[key] = requestBody[key];
      }
    });

    // For default tenant, map fields to tenant-specific names before updating
    if (req.tenantId === 'default') {
      if (Object.prototype.hasOwnProperty.call(requestBody, 'title') && requestBody.title !== undefined && requestBody.title !== null) {
        updateData.chaptername = requestBody.title;
      }
      if (Object.prototype.hasOwnProperty.call(requestBody, 'coursename') && requestBody.coursename !== undefined && requestBody.coursename !== null) {
        updateData.subjectname = requestBody.coursename;
      }
      // Do not attempt to map courseId during update since it's excluded and typically immutable
      // If needed, handle mapping explicitly in a separate flow
      // Remove any stray 'title' or 'coursename' from updateData if present
      if (updateData.title) delete updateData.title;
      if (updateData.coursename) delete updateData.coursename;
    }

    // Ensure any newly provided videos have ObjectIds
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

    // Build update query based on tenant
    const moduleQuery = {
      _id: req.params.moduleId,
      tenantId: req.tenantId
    };

    // Add course reference based on tenant
    if (req.tenantId === 'default') {
      moduleQuery.$or = [
        { courseId: req.params.courseId },
        { subjectid: req.params.courseId }
      ];
    } else {
      moduleQuery.courseId = req.params.courseId;
    }

    // Get population field based on tenant
    const populateField = req.tenantId === 'default' ? 'subjectid' : 'courseId';

    // Find and update the module
    const module = await Promise.race([
      ModuleModel.findOneAndUpdate(
        moduleQuery,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate(populateField, 'title description'),
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

    // Build delete query based on tenant
    const moduleQuery = {
      _id: req.params.moduleId,
      tenantId: req.tenantId
    };

    // Add course reference based on tenant
    if (req.tenantId === 'default') {
      moduleQuery.$or = [
        { courseId: req.params.courseId },
        { subjectid: req.params.courseId }
      ];
    } else {
      moduleQuery.courseId = req.params.courseId;
    }

    // Find and delete the module
    const module = await Promise.race([
      ModuleModel.findOneAndDelete(moduleQuery),
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
        title: module.title || module.chaptername // Handle both cases
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

    // Build query based on tenant
    const moduleQuery = {
      _id: req.params.moduleId,
      tenantId: req.tenantId
    };

    // Add course reference based on tenant
    if (req.tenantId === 'default') {
      moduleQuery.$or = [
        { courseId: req.params.courseId },
        { subjectid: req.params.courseId }
      ];
    } else {
      moduleQuery.courseId = req.params.courseId;
    }

    // Find current module
    const currentModule = await ModuleModel.findOne(moduleQuery);

    if (!currentModule) {
      return res.status(404).json({
        success: false,
        error: 'Module not found for this tenant and course'
      });
    }

    // Get population field based on tenant
    const populateField = req.tenantId === 'default' ? 'subjectid' : 'courseId';

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
    ).populate(populateField, 'title description');

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

    // Search functionality
    if (req.query.search) {
      const searchQuery = buildSearchQuery(req.query.search, tenantId);
      query = { ...query, ...searchQuery };
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

// @desc    Public: Get all modules for a course for tenant "default"
// @route   GET /api/default-lms/default-public-course/:courseId/modules
// @access  Public
exports.getPublicDefaultModules = async (req, res) => {
  try {
    console.log('Getting modules for course (public default):', req.params.courseId);
    
    // Validate courseId parameter
    if (!req.params.courseId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID is required'
      });
    }

    const tenantId = 'default'; // Hardcoded tenant
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

    // Check if course exists and is published (for default tenant, it might be subject)
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

    // Build query for modules (default tenant uses subjectid)
    let query = { 
      $or: [
        { courseId: req.params.courseId, tenantId },
        { subjectid: req.params.courseId, tenantId }
      ]
    };

    // Add optional filters
    if (req.query.difficulty) {
      query.difficulty = req.query.difficulty;
    }

    if (req.query.board) {
      query.board = req.query.board;
    }

    if (req.query.grade) {
      query.grade = req.query.grade;
    }

    if (req.query.medium) {
      query.medium = { $in: [req.query.medium] };
    }

    // Search functionality for default tenant
    if (req.query.search) {
      const searchQuery = buildSearchQuery(req.query.search, tenantId);
      query = { ...query, ...searchQuery };
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

    // Get all modules for the course/subject
    const [modules, totalCount] = await Promise.all([
      Promise.race([
        ModuleModel.find(query)
          .populate('subjectid', 'title description')
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
    console.error('getPublicDefaultModules error:', error.message);
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

// @desc    Public: Get single module for tenant "default"
// @route   GET /api/default-lms/default-public-course/:courseId/modules/:moduleId
// @access  Public
exports.getPublicDefaultModule = async (req, res) => {
  try {
    console.log('Getting module:', req.params.moduleId, 'for course:', req.params.courseId, '(public default)');
    
    // Validate parameters
    if (!req.params.courseId || !req.params.moduleId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID and Module ID are required'
      });
    }

    const tenantId = 'default'; // Hardcoded tenant
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

    // Find the specific module (for default tenant, check both courseId and subjectid)
    const module = await Promise.race([
      ModuleModel.findOne({
        _id: req.params.moduleId,
        $or: [
          { courseId: req.params.courseId },
          { subjectid: req.params.courseId }
        ],
        tenantId
      })
        .populate('subjectid', 'title description')
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
    console.error('getPublicDefaultModule error:', error.message);
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