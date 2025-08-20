const mongoose = require('mongoose');

const subtopicSchema = new mongoose.Schema({
  subtopicname: {
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
  topicname: {
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
    required: function() {
      // Only required if tenantId is not 'default'
      return this.tenantId !== 'default';
    },
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  
  // For default tenant - the title will be stored as chaptername
  chaptername: {
    type: String,
    required: function() {
      // Only required if tenantId is 'default'
      return this.tenantId === 'default';
    },
    trim: true,
    maxlength: [100, 'Chapter name cannot be more than 100 characters']
  },
  
  description: {
    type: String,
    required: false
  },
  
  // For default tenant - subject name field
  subjectname: {
    type: String,
    required: function() {
      // Only required if tenantId is 'default'
      return this.tenantId === 'default';
    },
    trim: true
  },
  
  // Keep coursename for non-default tenants
  coursename: {
    type: String,
    required: function() {
      // Only required if tenantId is not 'default'
      return this.tenantId !== 'default';
    },
    trim: true
  },
  
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  
  // For default tenant - subject ID field
  subjectid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: function() {
      // Only required if tenantId is 'default'
      return this.tenantId === 'default';
    },
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
  
  // Additional fields for default tenant
  board: {
    type: String,
    required: function() { 
      return this.tenantId === 'default'; 
    },
    trim: true
  },
  
  grade: {
    type: String,
    required: function() { 
      return this.tenantId === 'default'; 
    },
    trim: true
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

// Virtual to get the appropriate name based on tenant
ModuleSchema.virtual('displayName').get(function() {
  return this.tenantId === 'default' ? this.chaptername : this.title;
});

// Virtual to get the appropriate course/subject name based on tenant
ModuleSchema.virtual('displayCourseName').get(function() {
  return this.tenantId === 'default' ? this.subjectname : this.coursename;
});

// Virtual to get the appropriate ID based on tenant
ModuleSchema.virtual('displayCourseId').get(function() {
  return this.tenantId === 'default' ? this.subjectid : this.courseId;
});

// Pre-save middleware to handle data mapping
ModuleSchema.pre('save', function(next) {
  if (this.tenantId === 'default') {
    // If title is provided for default tenant, map it to chaptername
    if (this.isModified('title') && this.title) {
      this.chaptername = this.title;
      this.title = undefined;
    }
    // If coursename is provided for default tenant, map it to subjectname
    if (this.isModified('coursename') && this.coursename) {
      this.subjectname = this.coursename;
      this.coursename = undefined;
    }
    // If courseId is provided for default tenant, map it to subjectid
    if (this.isModified('courseId') && this.courseId) {
      this.subjectid = this.courseId;
      this.courseId = undefined;
    }
  } else {
    // For non-default tenants, ensure chaptername, subjectname, subjectid are not set
    if (this.isModified('chaptername')) this.chaptername = undefined;
    if (this.isModified('subjectname')) this.subjectname = undefined;
    if (this.isModified('subjectid')) this.subjectid = undefined;
  }
  next();
});

// Pre-delete hook to clean up related videos
ModuleSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const moduleId = this.getQuery()._id;
  await mongoose.model('VideoQuiz').deleteMany({ moduleId });
  next();
});

// Indexes
ModuleSchema.index({ tenantId: 1, courseId: 1 });
ModuleSchema.index({ tenantId: 1, subjectid: 1 });
ModuleSchema.index({ 'topics._id': 1 });
ModuleSchema.index({ 'topics.subtopics._id': 1 });

const Module = mongoose.models.Module || mongoose.model('Module', ModuleSchema);

module.exports = Module;
module.exports.schema = ModuleSchema;