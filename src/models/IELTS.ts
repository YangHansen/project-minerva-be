import { Schema, model, models } from 'mongoose';

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
});

const IELTSSubmissionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  exerciseId: { type: Schema.Types.ObjectId, ref: 'IELTSExercise', required: true },
  answers: [{ type: String }], 
  score: { type: Number, required: true }, 
  totalQuestions: { type: Number, required: true }
}, { timestamps: true });

export const IELTSExercise = models.IELTSExercise || model('IELTSExercise', IELTSExerciseSchema);
export const IELTSSubmission = models.IELTSSubmission || model('IELTSSubmission', IELTSSubmissionSchema);