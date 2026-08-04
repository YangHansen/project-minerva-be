import { Schema, model, models } from 'mongoose';

const DocumentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true }, 
  fileType: { type: String, required: true }, 
  documentType: { 
    type: String, 
    enum: [
      'cv', 'essay', 'research_plan', 'personal_statement', 'study_plan', 
      'recommendation_letter', 'transcript', 'ielts_cert', 'passport', 
      'portfolio', 'writing_sample', 'thesis_abstract', 'health_certificate', 
      'family_relationship_proof', 'citizenship_proof'
    ], 
    required: true 
  },
  isApostilled: { type: Boolean, default: false }, 
  status: { type: String, enum: ['uploaded', 'verified', 'rejected'], default: 'uploaded' }
}, { timestamps: true });

export const Document = models.Document || model('Document', DocumentSchema);