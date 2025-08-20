const Course = require('../models/Course');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');
const mongoose = require('mongoose');

// Helper function to get the correct model
const getCourseModel = (tenantConnection) => {
  if (tenantConnection) {
    return tenantConnection.model('Course', Course.schema, 'courses');
  }
  return Course;
};

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Helper function to validate course data
const validateCourseData = (data, isUpdate = false) => {
  const errors = [];

  // Required fields validation (only for create)
  if (!isUpdate) {
    if (!data.title) errors.push('Title is required');
    if (!data.createdBy) errors.push('CreatedBy is required');
  }

  // Validate status if provided
  if (data.status && !['draft', 'published'].includes(data.status)) {
    errors.push('Invalid status. Must be one of: draft, published');
  }

  // Validate courseProgress if provided
  if (typeof data.courseProgress === 'number' && (data.courseProgress < 0 || data.courseProgress > 100)) {
    errors.push('Course progress must be between 0 and 100');
  }

  // Validate price if provided
  if (typeof data.price === 'number' && data.price < 0) {
    errors.push('Price cannot be negative');
  }

  // Validate rating if provided
  if (typeof data.rating === 'number' && (data.rating < 0 || data.rating > 5)) {
    errors.push('Rating must be between 0 and 5');
  }

  // Validate enrolledStd if provided
  if (typeof data.enrolledStd === 'number' && data.enrolledStd < 0) {
    errors.push('Enrolled students cannot be negative');
  }

  // Validate medium array if provided
  if (data.medium && Array.isArray(data.medium)) {
    if (data.medium.some(m => typeof m !== 'string')) {
      errors.push('All medium values must be strings');
    }
  }

  // Validate createdBy if provided (must be valid ObjectId)
  if (data.createdBy && !isValidObjectId(data.createdBy)) {
    errors.push('Invalid createdBy user ID format');
  }

  return errors;
};

// @desc    Create new Course
// @route   POST /api/courses
// @access  Private/admin/Instructor
exports.createNgoCourse = async (req, res) => {
  try {
    console.log('Creating NGO course with data:', JSON.stringify(req.body));
    console.log('Tenant ID:', req.tenantId);
    
    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate input data
    const validationErrors = validateCourseData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: validationErrors.join(', ')
      });
    }

    // Add tenant to req.body
    req.body.tenantId = req.tenantId;

    // Set default values according to schema
    if (!req.body.courseProgress) req.body.courseProgress = 0;
    if (!req.body.enrolledStd) req.body.enrolledStd = 0;
    if (!req.body.rating) req.body.rating = 0;
    if (!req.body.price) req.body.price = 0;
    if (!req.body.status) req.body.status = 'draft';
    if (!req.body.medium) req.body.medium = [];

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    // Create course
    const course = await CourseModel.create(req.body);

    console.log('NGO course created successfully:', course._id);

    res.status(201).json({
      success: true,
      data: course,
      message: 'Course created successfully'
    });

  } catch (err) {
    console.error(`Error in createNgoCourse: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    // Handle duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `A course with this ${field} already exists`
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Get all NGO courses for the tenant
// @route   GET /api/courses
// @access  Private
exports.getNgoCourses = async (req, res) => {
  try {
    console.log('Fetching NGO courses for tenant:', req.tenantId);
    console.log('Query params:', req.query);

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    // Build query object
    let query = { tenantId: req.tenantId };

    // Add optional filters
    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.board) {
      query.board = req.query.board;
    }

    if (req.query.grade) {
      query.grade = req.query.grade;
    }

    if (req.query.medium) {
      query.medium = { $in: Array.isArray(req.query.medium) ? req.query.medium : [req.query.medium] };
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Rating filter
    if (req.query.minRating) {
      query.rating = { $gte: parseFloat(req.query.minRating) };
    }

    // Filter by createdBy if provided
    if (req.query.createdBy && isValidObjectId(req.query.createdBy)) {
      query.createdBy = req.query.createdBy;
    }

    // Search functionality
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { board: { $regex: req.query.search, $options: 'i' } },
        { grade: { $regex: req.query.search, $options: 'i' } }
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
      sortBy = { createdAt: -1 }; // Default sort by creation date, newest first
    }

    // Execute query
    const [courses, totalCount] = await Promise.all([
      CourseModel.find(query)
        .populate('createdBy', 'name email') // Populate creator info
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .lean(),
      CourseModel.countDocuments(query)
    ]);

    console.log(`Found ${courses.length} courses out of ${totalCount} total`);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });

  } catch (err) {
    console.error(`Error in getNgoCourses: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);

    // Generic server error
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Get single NGO course by ID
// @route   GET /api/courses/:id
// @access  Private
exports.getNgoCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log('Fetching NGO course with ID:', courseId);
    console.log('Tenant ID:', req.tenantId);

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    // Find course and populate modules and creator
    const course = await CourseModel.findOne({ 
      _id: courseId, 
      tenantId: req.tenantId 
    })
    .populate({
      path: 'modules',
      select: 'title isCompleted'
    })
    .populate('createdBy', 'name email')
    .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Calculate progress based on modules if not explicitly set
    if (course.courseProgress === 0 && course.modules && course.modules.length > 0) {
      const completedCount = course.modules.filter(m => m.isCompleted).length;
      course.courseProgress = Math.round((completedCount / course.modules.length) * 100);
    }

    console.log('Course found:', course.title);

    res.status(200).json({
      success: true,
      data: course
    });

  } catch (err) {
    console.error(`Error in getNgoCourse: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);

    // Handle invalid ObjectId errors
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Update NGO course
// @route   PUT /api/courses/:id
// @access  Private/Instructor
exports.updateNgoCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log('Updating NGO course with ID:', courseId);
    console.log('Update data:', req.body);
    console.log('Tenant ID:', req.tenantId);

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Validate input data
    const validationErrors = validateCourseData(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: validationErrors.join(', ')
      });
    }

    // Prepare update data - exclude undefined/null values and system fields
    const updateData = {};
    const excludedFields = ['_id', 'tenantId', 'createdAt', '__v', 'slug'];
    
    Object.keys(req.body).forEach(key => {
      if (!excludedFields.includes(key) && req.body[key] !== undefined && req.body[key] !== null) {
        updateData[key] = req.body[key];
      }
    });

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    console.log('Processed update data:', updateData);

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    // Update the course
    const updatedCourse = await CourseModel.findOneAndUpdate(
      { _id: courseId, tenantId: req.tenantId },
      { $set: updateData },
      {
        new: true, // Return the updated document
        runValidators: true,
        useFindAndModify: false
      }
    ).populate('createdBy', 'name email');

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        error: 'Course not found for this tenant'
      });
    }

    console.log('Successfully updated course:', updatedCourse._id);

    res.status(200).json({
      success: true,
      data: updatedCourse,
      message: 'Course updated successfully'
    });

  } catch (err) {
    console.error(`Error in updateNgoCourse: ${err.message}`);
    console.error(`Stack trace: ${err.stack}`);
    
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
        error: `A course with this ${field} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Delete NGO course
// @route   DELETE /api/courses/:id
// @access  Private/Instructor
exports.deleteNgoCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log('Deleting NGO course with ID:', courseId);
    console.log('Tenant ID:', req.tenantId);

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    // Find and delete the course
    const deletedCourse = await CourseModel.findOneAndDelete({
      _id: courseId,
      tenantId: req.tenantId
    });

    if (!deletedCourse) {
      return res.status(404).json({
        success: false,
        error: 'Course not found or already deleted'
      });
    }

    console.log('Deleted course:', deletedCourse.title);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
      data: {
        _id: deletedCourse._id,
        title: deletedCourse.title
      }
    });

  } catch (err) {
    console.error(`Error in deleteNgoCourse: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);

    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Public: Get all courses for tenant "ngo"
// @route   GET /api/ngo-lms/ngo-public-courses
// @access  Public

const { switchTenant } = require('../utils/tenantUtils'); // adjust this path to match your project

exports.getPublicNgoCourses = async (req, res) => {
  try {
    const tenantId = 'ngo'; // 👈 hardcoded tenant

    const tenantConnection = await switchTenant(tenantId);

    if (!tenantConnection || tenantConnection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Could not connect to tenant database',
      });
    }

    const CourseModel = getCourseModel(tenantConnection);

    // Build query for public courses (published status)
    let query = { 
      tenantId,
      status: 'published' // Only show published courses publicly
    };

    // Add optional filters
    if (req.query.board) {
      query.board = req.query.board;
    }

    if (req.query.grade) {
      query.grade = req.query.grade;
    }

    if (req.query.medium) {
      query.medium = { $in: Array.isArray(req.query.medium) ? req.query.medium : [req.query.medium] };
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Rating filter
    if (req.query.minRating) {
      query.rating = { $gte: parseFloat(req.query.minRating) };
    }

    // Search functionality
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { board: { $regex: req.query.search, $options: 'i' } },
        { grade: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sort options (default by rating and enrolled users for public view)
    let sortBy = {};
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      sortBy[sortField] = sortOrder;
    } else {
      sortBy = { rating: -1, enrolledStd: -1, createdAt: -1 }; // Updated field name
    }

    const [courses, totalCount] = await Promise.all([
      CourseModel.find(query)
        .populate('createdBy', 'name email')
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .lean(),
      CourseModel.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: courses,
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
    console.error('getPublicNgoCourses error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching courses',
    });
  }
};

// @desc    Public: Get course by ID for tenant "ngo"
// @route   GET /api/ngo-lms/ngo-public-course/:courseId
// @access  Public
exports.getPublicNgoCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    console.log('Fetching NGO course with ID:', courseId);
    
    // Validate courseId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format',
      });
    }

    const tenantId = 'ngo'; // hardcoded tenant
    const tenantConnection = await switchTenant(tenantId);

    if (!tenantConnection || tenantConnection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Could not connect to tenant database',
      });
    }

    const CourseModel = getCourseModel(tenantConnection);
    
    const course = await CourseModel.findOne({ 
      _id: new mongoose.Types.ObjectId(courseId), // Explicitly create ObjectId
      tenantId,
      status: 'published' // Only show published courses publicly
    })
    .populate('createdBy', 'name email')
    .lean();

    console.log('Found course:', course); // Debug log

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found or not published',
      });
    }

    return res.status(200).json({
      success: true,
      data: course, 
    });
  } catch (error) {
    console.error('getPublicNgoCourse error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching course',
    });
  }
};

// @desc    Get course progress
// @route   GET /api/ngo-lms/courses/:id/progress
// @access  Private
exports.getCourseProgress = async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log('Getting progress for course ID:', courseId);

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    // Find course and populate modules
    const course = await CourseModel.findOne({ 
      _id: courseId, 
      tenantId: req.tenantId 
    })
    .populate({
      path: 'modules',
      select: 'isCompleted'
    })
    .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Calculate progress
    let progress = course.courseProgress || 0; // Updated field name
    if (course.modules && course.modules.length > 0) {
      const completedCount = course.modules.filter(m => m.isCompleted).length;
      progress = Math.round((completedCount / course.modules.length) * 100);
    }

    res.status(200).json({
      success: true,
      data: {
        progress,
        lastUpdated: course.updatedAt,
        totalModules: course.modules ? course.modules.length : 0,
        completedModules: course.modules ? course.modules.filter(m => m.isCompleted).length : 0
      }
    });

  } catch (err) {
    console.error(`Error in getCourseProgress: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);

    // Handle invalid ObjectId errors
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Update course rating
// @route   PUT /api/ngo-lms/courses/:id/rating
// @access  Private
exports.updateCourseRating = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { rating } = req.body;

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Validate rating
    if (typeof rating !== 'number' || rating < 0 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be a number between 0 and 5'
      });
    }

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    // Update the course rating
    const updatedCourse = await CourseModel.findOneAndUpdate(
      { _id: courseId, tenantId: req.tenantId },
      { $set: { rating, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        error: 'Course not found for this tenant'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: updatedCourse._id,
        rating: updatedCourse.rating
      },
      message: 'Course rating updated successfully'
    });

  } catch (err) {
    console.error(`Error in updateCourseRating: ${err.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Enroll user in course
// @route   PUT /api/ngo-lms/courses/:id/enroll
// @access  Private
exports.enrollInCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    // Update the enrolled users count
    const updatedCourse = await CourseModel.findOneAndUpdate(
      { _id: courseId, tenantId: req.tenantId },
      { 
        $inc: { enrolledStd: 1 }, // Updated field name
        $set: { updatedAt: new Date() }
      },
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        error: 'Course not found for this tenant'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: updatedCourse._id,
        enrolledStd: updatedCourse.enrolledStd // Updated field name
      },
      message: 'Successfully enrolled in course'
    });

  } catch (err) {
    console.error(`Error in enrollInCourse: ${err.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Update course progress
// @route   PUT /api/ngo-lms/courses/:id/progress
// @access  Private
exports.updateCourseProgress = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { progress } = req.body;

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Validate progress
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        error: 'Progress must be a number between 0 and 100'
      });
    }

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    // Update the course progress
    const updatedCourse = await CourseModel.findOneAndUpdate(
      { _id: courseId, tenantId: req.tenantId },
      { $set: { courseProgress: progress, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        error: 'Course not found for this tenant'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: updatedCourse._id,
        courseProgress: updatedCourse.courseProgress
      },
      message: 'Course progress updated successfully'
    });

  } catch (err) {
    console.error(`Error in updateCourseProgress: ${err.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Get courses by creator
// @route   GET /api/ngo-lms/courses/creator/:creatorId
// @access  Private
exports.getCoursesByCreator = async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    console.log('Fetching courses for creator:', creatorId);

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(creatorId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid creator ID format'
      });
    }

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    // Build query
    let query = { 
      tenantId: req.tenantId,
      createdBy: creatorId
    };

    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sort options
    let sortBy = { createdAt: -1 };
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      sortBy = { [sortField]: sortOrder };
    }

    // Execute query
    const [courses, totalCount] = await Promise.all([
      CourseModel.find(query)
        .populate('createdBy', 'name email')
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .lean(),
      CourseModel.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      data: courses,
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
    console.error(`Error in getCoursesByCreator: ${err.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Get course statistics
// @route   GET /api/ngo-lms/courses/:id/stats
// @access  Private
exports.getCourseStats = async (req, res) => {
  try {
    const courseId = req.params.id;

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    const course = await CourseModel.findOne({
      _id: courseId,
      tenantId: req.tenantId
    })
    .populate({
      path: 'modules',
      select: 'isCompleted'
    })
    .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Calculate statistics
    const stats = {
      courseId: course._id,
      title: course.title,
      status: course.status,
      enrolledStudents: course.enrolledStd || 0,
      rating: course.rating || 0,
      price: course.price || 0,
      progress: course.courseProgress || 0,
      totalModules: course.modules ? course.modules.length : 0,
      completedModules: course.modules ? course.modules.filter(m => m.isCompleted).length : 0,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (err) {
    console.error(`Error in getCourseStats: ${err.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
