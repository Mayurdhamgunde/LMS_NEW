const mongoose = require('mongoose');

const subtopicSchema = new mongoose.Schema({
  subtopicName: {
    type: String,
    required: true,
    trim: true
  },
  videos: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    videoUrl: {
      type: String,
      required: true
    }
  }]
}, { _id: true });

const topicSchema = new mongoose.Schema({
  topicName: {
    type: String,
    required: true,
    trim: true
  },
  subtopics: {
    type: [subtopicSchema],
    default: []
  },
  videos: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    videoUrl: {
      type: String,
      required: true
    }
  }]
}, { _id: true });

const ModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: false
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  videos: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    videoUrl: {
      type: String,
      required: true
    }
  }],
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  topics: {
    type: [topicSchema],
    default: []
  }
}, {
  timestamps: true,
  collection: 'modules',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-delete hook to clean up related videos
ModuleSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const moduleId = this.getQuery()._id;
  await mongoose.model('VideoQuiz').deleteMany({ moduleId });
  next();
});

// Indexes
ModuleSchema.index({ tenantId: 1, courseId: 1 });
ModuleSchema.index({ 'topics._id': 1 });
ModuleSchema.index({ 'topics.subtopics._id': 1 });

const Module = mongoose.models.Module || mongoose.model('Module', ModuleSchema);

module.exports = Module;
module.exports.schema = ModuleSchema;