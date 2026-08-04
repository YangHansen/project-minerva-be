import { Schema, model, models } from 'mongoose';

const ScholarshipSchema = new Schema({
  name: { type: String, required: true },
  provider: { type: String, required: true },
  country: { type: String, required: true }, 
  university: { type: String, required: true },
  program: { type: String, required: true },  // Removed enum (Allows Bachelor's, Short Course, etc.)
  educationLevel: { type: String },
  fieldOfStudy: { type: String, required: true },
  
  // Funding is universally categorized, so enum is safe here
  fundingType: { type: String, enum: ['fully_funded', 'partially_funded', 'self_funded'], required: true },
  
  // Scoring Criteria (Defaults added for regional scores)
  minGpa: { type: Number, default: 0 },
  minIeltsScore: { type: Number, default: 0 },
  minToeflScore: { type: Number, default: 0 },
  minTopikScore: { type: Number, default: 0 }, // Defaults to 0 so UK/US scholarships don't fail
  minWorkExperienceYears: { type: Number, default: 0 },
  
  eligibilityRequirements: { type: String },
  deadline: { type: Date, required: true },
  applicationLink: { type: String },
  
  // Unlocked Documents Array
  requiredDocuments: [{ type: String }], // Removed enum to allow new, unseen document types
  
  // Specific Rules
  apostilleRequired: { type: Boolean, default: false },
  submissionMethod: { type: String, enum: ['online', 'postal', 'both'], required: true },
  documentSubmissionGuidelines: { type: String },
  coreValues: [{ type: String }]
}, { timestamps: true });

export const Scholarship = model('Scholarship', ScholarshipSchema);