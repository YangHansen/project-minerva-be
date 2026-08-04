import { Schema, model, models } from 'mongoose';

const IELTSExerciseSchema = new Schema({
  section: { type: String, enum: ['reading', 'listening', 'writing'], required: true },
  title: { type: String, required: true },
  content: { type: String, required: true }, 
  questions: [{
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true }, 
    explanation: { type: String }
  }]
});

const IELTSSubmissionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  exerciseId: { type: Schema.Types.ObjectId, ref: 'IELTSExercise', required: true },
  answers: [{ type: Number }], 
  score: { type: Number, required: true }, 
  totalQuestions: { type: Number, required: true }
}, { timestamps: true });

export const IELTSExercise = models.IELTSExercise || model('IELTSExercise', IELTSExerciseSchema);
export const IELTSSubmission = models.IELTSSubmission || model('IELTSSubmission', IELTSSubmissionSchema);