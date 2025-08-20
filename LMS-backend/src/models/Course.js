const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  coverImg: {
    type: String,
    required: false
  },
  courseProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'draft'
  },
  enrolledStd: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  board: {
    type: String,
    required: function() { return this.tenantId === 'default'; },
    trim: true
  },
  grade: {
    type: Number,
    required: function() { return this.tenantId === 'default'; },
    min: 1,
    max: 12
  },
  medium: {
    type: [String],
    required: false,
    default: []
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  collection: 'courses'
});

// Virtual for related modules
CourseSchema.virtual('modules', {
  ref: 'Module',
  localField: '_id',
  foreignField: 'courseId'
});

// Compound indexes for better query performance
CourseSchema.index({ tenantId: 1, status: 1 });
CourseSchema.index({ tenantId: 1, createdBy: 1 });

const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);

module.exports = Course;
module.exports.schema = CourseSchema;