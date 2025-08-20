const express = require('express');
const { 
  createNgoModule,
  getNgoModules,
  getNgoModule,
  updateNgoModule,
  deleteNgoModule,
  toggleModuleCompletion,
  getPublicNgoModules,
  getPublicNgoModule
} = require('../controllers/Module');

const router = express.Router();

const videoQuizRouter = require('./VideoQz');
// router.use('/:moduleId/videos', videoQuizRouter);
// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant middleware to all routes except public ones
router.use((req, res, next) => {
  if (!req.path.startsWith('/public') && !req.path.startsWith('/ngo-lms')) {
    tenantMiddleware(req, res, next);
  } else {
    next();
  }
});

router.use('/:moduleId/videoquiz', videoQuizRouter);
// ======================
// ADMIN/INSTRUCTOR ROUTES
// ======================
router.route('/:courseId/modules')
  .post(protect, authorize('instructor', 'admin'), createNgoModule)
  .get(protect, getNgoModules);

router.route('/:courseId/modules/:moduleId')
  .get(protect, getNgoModule)
  .put(protect, authorize('instructor', 'admin'), updateNgoModule)
  .delete(protect, authorize('instructor', 'admin'), deleteNgoModule);

// ======================
// MODULE COMPLETION ROUTES
// ======================
router.route('/courses/:courseId/modules/:moduleId/toggle-completion')
  .put(protect, toggleModuleCompletion);

// ======================
// PUBLIC ROUTES (no auth required)
// ======================
// NGO LMS public routes (alternative paths)
router.get('/ngo-lms/ngo-public-course/:courseId/modules', getPublicNgoModules);
router.get('/ngo-lms/ngo-public-course/:courseId/modules/:moduleId', getPublicNgoModule);

// Original public routes
router.get('/public/ngo-course/:courseId/modules', getPublicNgoModules);
router.get('/public/ngo-course/:courseId/modules/:moduleId', getPublicNgoModule);

module.exports = router;