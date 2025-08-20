const express = require('express');
const { 
  createNgoCourse,
  getNgoCourses,
  getNgoCourse,
  updateNgoCourse,
  deleteNgoCourse,
  getPublicNgoCourses,
  getPublicNgoCourse,
  getCourseProgress,
  updateCourseRating,
  enrollInCourse,
  updateCourseProgress,
  getCoursesByCreator,
  getCourseStats
} = require('../controllers/Course');

const router = express.Router();

// Include other resource routers
const moduleRouter = require('./module');

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant middleware to all routes except public ones
router.use((req, res, next) => {
  if (!req.path.startsWith('/public') && !req.path.startsWith('/ngo-lms/public')) {
    tenantMiddleware(req, res, next);
  } else {
    next();
  }
});

// Re-route into other resource routers
router.use('/:courseId/modules', moduleRouter);

// ======================
// ADMIN/INSTRUCTOR ROUTES
// ======================
router.route('/')
  .get(protect, getNgoCourses)
  .post(protect, authorize('instructor', 'admin'), createNgoCourse);

router.route('/:id')
  .get(protect, getNgoCourse)
  .put(protect, authorize('instructor', 'admin'), updateNgoCourse)
  .delete(protect, authorize('instructor', 'admin'), deleteNgoCourse);

// ======================
// COURSE PROGRESS ROUTES
// ======================
router.route('/:id/progress')
  .get(protect, getCourseProgress)
  .put(protect, updateCourseProgress);

// ======================
// COURSE RATING ROUTES
// ======================
router.route('/:id/rating')
  .put(protect, updateCourseRating);

// ======================
// ENROLLMENT ROUTES
// ======================
router.route('/:id/enroll')
  .put(protect, enrollInCourse);

// ======================
// CREATOR ROUTES
// ======================
router.route('/creator/:creatorId')
  .get(protect, getCoursesByCreator);

// ======================
// STATS ROUTES
// ======================
router.route('/:id/stats')
  .get(protect, getCourseStats);

// ======================
// PUBLIC ROUTES (no auth required)
// ======================
// NGO LMS public routes
router.get('/public/ngo-courses', getPublicNgoCourses);
router.get('/public/ngo-courses/:courseId', getPublicNgoCourse);

// Alternative public routes (as per controller comments)
router.get('/ngo-lms/ngo-public-courses', getPublicNgoCourses);
router.get('/ngo-lms/ngo-public-course/:courseId', getPublicNgoCourse);

module.exports = router;
