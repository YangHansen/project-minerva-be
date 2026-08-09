import { Schema, model, models } from 'mongoose';

const PracticeExerciseSchema = new Schema({
  type: { type: String, enum: ['reading', 'writing', 'listening', 'speaking'], required: true },
  prompt: { type: String, required: true },
  content: { type: String }
}, { timestamps: true });

const PracticeSubmissionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  exerciseId: { type: Schema.Types.ObjectId, ref: 'PracticeExercise', required: true },
  answer: { type: String, required: true },
  score: { type: Number },
  feedback: { type: String }
}, { timestamps: true });

export const PracticeExercise = models.PracticeExercise || model('PracticeExercise', PracticeExerciseSchema);
export const PracticeSubmission = models.PracticeSubmission || model('PracticeSubmission', PracticeSubmissionSchema);
