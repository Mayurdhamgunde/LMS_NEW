const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true
    },
    options: {
      a: { type: String, required: true },
      b: { type: String, required: true },
      c: { type: String, required: true },
      d: { type: String, required: true }
    },
    correctAnswer: {
      type: String,
      required: true,
      enum: ['a', 'b', 'c', 'd']  
    },
    explanation: {
      type: String,
      required: true
    }
  },
  {
    _id: false
  }
);

const VideoQuizSchema = new mongoose.Schema(
  {
    // Video information
    videoTitle: {
      type: String,
      required: true,
      trim: true
    },
    videoUrl: {
      type: String,
      required: true
    },
    ytId: {
      type: String,
      required: false
    },
    
    // Hierarchy using names
    moduleName: {
      type: String,
      required: function() {
        return this.tenantId !== 'default';
      },
      trim: true
    },
    topicName: {
      type: String,
      required: false,
      trim: true
    },
    subtopicName: {
      type: String,
      required: false,
      trim: true
    },
    
    // For default tenant
    chapterName: {
      type: String,
      required: function() {
        return this.tenantId === 'default';
      },
      trim: true
    },
    
    // Course/Subject information
    courseName: {
      type: String,
      required: function() {
        return this.tenantId !== 'default';
      },
      trim: true
    },
    
    // For default tenant
    subName: {
      type: String,
      required: function() {
        return this.tenantId === 'default';
      },
      trim: true
    },
    
    // For default tenant - courseId stored as subjectId
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: function() {
        return this.tenantId === 'default';
      }
    },
    
    // Educational context
    board: {
      type: String,
      required: true,
      trim: true
    },
    grade: {
      type: String,
      required: true,
      trim: true
    },
    medium: {
      type: String,
      required: function() {
        try {
          return (this.board || '').toUpperCase() !== 'CBSE';
        } catch (e) {
          return true;
        }
      },
      trim: true
    },
    
    // The quiz content
    quiz: {
      type: [quizSchema],
      default: [],
      required: function() {
        return this.tenantId !== 'default';
      }
    },
    
    // For default tenant
    questions: {
      type: [quizSchema],
      default: [],
      required: function() {
        return this.tenantId === 'default';
      }
    },
    
    tenantId: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'videoquizzes',
    toJSON: {
      transform: function(doc, ret) {
        // For default tenant, map fields to the expected names
        if (ret.tenantId === 'default') {
          // Ensure we're returning the correct field names for default tenant
          ret.chapterName = ret.chapterName || ret.moduleName;
          ret.subName = ret.subName || ret.courseName;
          ret.questions = ret.questions || ret.quiz;
          
          // Remove the non-default fields
          delete ret.moduleName;
          delete ret.courseName;
          delete ret.quiz;
        } else {
          // For non-default tenants, ensure standard field names
          ret.moduleName = ret.moduleName || ret.chapterName;
          ret.courseName = ret.courseName || ret.subName;
          ret.quiz = ret.quiz || ret.questions;
          
          // Remove the default tenant fields
          delete ret.chapterName;
          delete ret.subName;
          delete ret.subjectId;
          delete ret.questions;
        }
        return ret;
      }
    }
  }
);

// Indexes for efficient querying
VideoQuizSchema.index({ tenantId: 1, videoTitle: 1 });
VideoQuizSchema.index({ tenantId: 1, moduleName: 1 });
VideoQuizSchema.index({ tenantId: 1, topicName: 1 });
VideoQuizSchema.index({ tenantId: 1, subtopicName: 1 });
VideoQuizSchema.index({ tenantId: 1, courseName: 1 });
VideoQuizSchema.index({ tenantId: 1, chapterName: 1 });
VideoQuizSchema.index({ tenantId: 1, subName: 1 });
VideoQuizSchema.index({ tenantId: 1, subjectId: 1 });
VideoQuizSchema.index({ tenantId: 1, board: 1, grade: 1, medium: 1 });

const VideoQuiz = mongoose.models.VideoQuiz || mongoose.model('VideoQuiz', VideoQuizSchema);

module.exports = VideoQuiz;
module.exports.schema = VideoQuizSchema;