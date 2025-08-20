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
    // Video information (names instead of IDs)
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
      required: true,
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
    
    // Course/Subject information
    courseName: {
      type: String,
      required: true,
      trim: true
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
      // Medium is not applicable for CBSE board
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
      default: []  
    },
    
    tenantId: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'videoquizzes'
  }
);

// Indexes for efficient querying
VideoQuizSchema.index({ tenantId: 1, videoTitle: 1 });
VideoQuizSchema.index({ tenantId: 1, moduleName: 1 });
VideoQuizSchema.index({ tenantId: 1, topicName: 1 });
VideoQuizSchema.index({ tenantId: 1, subtopicName: 1 });
VideoQuizSchema.index({ tenantId: 1, courseName: 1 });
VideoQuizSchema.index({ tenantId: 1, subjectName: 1 });
VideoQuizSchema.index({ tenantId: 1, board: 1, grade: 1, medium: 1 });

const VideoQuiz = mongoose.models.VideoQuiz || mongoose.model('VideoQuiz', VideoQuizSchema);

module.exports = VideoQuiz;
module.exports.schema = VideoQuizSchema;