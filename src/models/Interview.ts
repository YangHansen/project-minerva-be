import { Schema, model, models } from 'mongoose';

const InterviewQuestionSchema = new Schema({
  category: { type: String, required: true },
  scholarshipId: { type: Schema.Types.ObjectId, ref: 'Scholarship' },
  questionText: { type: String, required: true }
}, { timestamps: true });

const InterviewSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scholarshipId: { type: Schema.Types.ObjectId, ref: 'Scholarship' },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  startTime: { type: Date, default: Date.now },
  transcript: [{
    role: { type: String, enum: ['system', 'user', 'ai'], required: true },
    message: { type: String, required: true }
  }]
}, { timestamps: true });

const InterviewResultSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: 'InterviewSession', required: true },
  metrics: {
    clarity: { type: Number, required: true },
    pace: { type: Number, required: true },
    engagement: { type: Number, required: true }
  },
  feedback: {
    highlights: [{ type: String }],
    improvements: [{ type: String }]
  }
}, { timestamps: true });

export const InterviewQuestion = models.InterviewQuestion || model('InterviewQuestion', InterviewQuestionSchema);
export const InterviewSession = models.InterviewSession || model('InterviewSession', InterviewSessionSchema);
export const InterviewResult = models.InterviewResult || model('InterviewResult', InterviewResultSchema);
