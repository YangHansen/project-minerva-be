import { type InferSchemaType, type Model, Schema, model, models } from 'mongoose'

const ScholarshipSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    name: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, index: true },
    university: { type: String, required: true, trim: true },
    program: { type: String, required: true, trim: true },
    educationLevel: { type: String, required: true, trim: true, index: true },
    fieldOfStudy: { type: String, required: true, trim: true, index: true },
    fundingType: { type: String, required: true, trim: true, index: true },
    scholarshipType: { type: String, required: true, trim: true },
    eligibilitySummary: { type: String, required: true, trim: true },
    eligibilityRequirements: { type: String, default: '' },
    deadline: { type: Date, required: true, index: true },
    applicationUrl: { type: String, required: true },
    requiredDocuments: { type: [String], default: [] },
    featured: { type: Boolean, default: false, index: true },
    baselineMatchPercentage: { type: Number, min: 0, max: 100, default: 50 },
    minGpa: { type: Number, default: 0, min: 0 },
    minIeltsScore: { type: Number, default: 0, min: 0, max: 9 },
    minToeflScore: { type: Number, default: 0, min: 0, max: 120 },
    minTopikScore: { type: Number, default: 0, min: 0, max: 6 },
    minWorkExperienceYears: { type: Number, default: 0, min: 0 },
    apostilleRequired: { type: Boolean, default: false },
    submissionMethod: { type: String, enum: ['online', 'postal', 'both'], default: 'online' },
    documentSubmissionGuidelines: { type: String, default: '' },
    coreValues: { type: [String], default: [] },
  },
  { timestamps: true },
)

ScholarshipSchema.index({ name: 'text', provider: 'text', country: 'text', fieldOfStudy: 'text' })

type ScholarshipShape = InferSchemaType<typeof ScholarshipSchema>
export const Scholarship =
  (models.Scholarship as Model<ScholarshipShape> | undefined) ||
  model<ScholarshipShape>('Scholarship', ScholarshipSchema)
