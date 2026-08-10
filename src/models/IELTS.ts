import { Schema, model, models } from 'mongoose';

<<<<<<< HEAD
const IELTSExerciseSchema = new Schema({
  testId: { type: String, required: true },
  section: { type: String, enum: ['reading', 'listening', 'writing'], required: true },
  partNumber: { type: Number, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  audioUrl: { type: String },
  questions: [{
    questionType: { 
      type: String, 
      enum: ['multiple_choice', 'fill_in_the_blank', 'true_false_not_given', 'matching', 'essay'], 
      required: true 
    },
    questionText: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true }, 
    explanation: { type: String }
  }]
=======
const IELTSQuestionSchema = new Schema(
  {
    questionText: { type: String, required: true },
    type: { type: String, enum: ['gap-fill', 'mcq', 'matching'], default: 'gap-fill' },
    options: [{ type: String }],
    correctAnswer: { type: Schema.Types.Mixed, required: true },
    explanation: { type: String },
  },
  { _id: false },
);

const IELTSExerciseSchema = new Schema({
  section: { type: String, enum: ['reading', 'listening', 'writing', 'speaking'], required: true },
  setNumber: { type: Number, required: true, default: 1 },
  order: { type: Number, required: true, default: 0 },
  title: { type: String, required: true },
  content: { type: String, required: true },
  audioUrl: { type: String },
  questions: [IELTSQuestionSchema],
>>>>>>> e03f308 (feat: implement IELTS module with data seeding, scoring logic, and updated exercise/submission schemas)
});

IELTSExerciseSchema.index({ setNumber: 1, order: 1 });

const IELTSSubmissionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  exerciseId: { type: Schema.Types.ObjectId, ref: 'IELTSExercise', required: true },
<<<<<<< HEAD
  answers: [{ type: String }], 
  score: { type: Number, required: true }, 
  totalQuestions: { type: Number, required: true }
}, { timestamps: true });

const IeltsResultSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  listeningScore: { type: Number, required: true, min: 0, max: 9 },
  readingScore: { type: Number, required: true, min: 0, max: 9 },
  writingScore: { type: Number, required: true, min: 0, max: 9 },
  speakingScore: { type: Number, required: true, min: 0, max: 9 },
  overallBand: { type: Number, required: true, min: 0, max: 9 },
  answers: { type: Schema.Types.Mixed } 
}, { timestamps: true });

export const IELTSExercise = models.IELTSExercise || model('IELTSExercise', IELTSExerciseSchema);
export const IELTSSubmission = models.IELTSSubmission || model('IELTSSubmission', IELTSSubmissionSchema);
export const IeltsResult = models.IeltsResult || model('IeltsResult', IeltsResultSchema);
=======
  section: { type: String, enum: ['reading', 'listening', 'writing', 'speaking'], required: true },
  answers: [{ type: Schema.Types.Mixed }],
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
}, { timestamps: true });

IELTSSubmissionSchema.index({ userId: 1, createdAt: -1 });

export const IELTSExercise = models.IELTSExercise || model('IELTSExercise', IELTSExerciseSchema);
export const IELTSSubmission = models.IELTSSubmission || model('IELTSSubmission', IELTSSubmissionSchema);
>>>>>>> e03f308 (feat: implement IELTS module with data seeding, scoring logic, and updated exercise/submission schemas)
