import { Schema, model, models } from 'mongoose';

const UserProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  name: { type: String, required: true, trim: true },
  age: { type: Number },
  country: { type: String }, 
  destinationCountry: { type: String, default: 'South Korea' },
  currentEducationLevel: { type: String }, 
  targetEducationLevel: { type: String, enum: ["Master's", "Doctoral"] },
  fieldOfStudy: { type: String }, 
  gpa: { type: Number, default: 0.0, min: 0.0, max: 4.0 },
  ieltsScore: { type: Number, default: 0.0 },
  toeflScore: { type: Number, default: 0 },
  topikScore: { type: Number, default: 0, min: 0, max: 6 },
  workExperienceYears: { type: Number, default: 0 },
  scholarshipType: { type: String }, 
  fundingPreference: { type: String },
  enrollmentYear: { type: Number },
  emailNotificationsEnabled: { type: Boolean, default: true }
}, { timestamps: true });

export const UserProfile = models.UserProfile || model('UserProfile', UserProfileSchema);