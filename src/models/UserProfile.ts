import { type InferSchemaType, type Model, Schema, model, models } from 'mongoose'

const LanguageCertificateSchema = new Schema(
  {
    type: { type: String, required: true, trim: true },
    score: { type: String, required: true, trim: true },
  },
  { _id: false },
)

const UserProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    age: { type: Number, min: 13, max: 120, default: null },
    country: { type: String, trim: true, default: '' },
    destinationCountry: { type: String, trim: true, default: 'South Korea' },
    currentEducationLevel: { type: String, trim: true, default: '' },
    targetEducationLevel: {
      type: String,
      enum: ['', 'Bachelor', 'Master', 'Doctorate', 'Postgraduate'],
      default: '',
    },
    gpa: { type: Number, default: null, min: 0 },
    gpaScale: { type: Number, default: 4, min: 1, max: 100 },
    fieldOfStudy: { type: String, trim: true, default: '' },
    scholarshipType: { type: String, trim: true, default: '' },
    fundingPreference: { type: String, trim: true, default: '' },
    englishLevel: { type: String, trim: true, default: '' },
    ieltsScore: { type: Number, default: null, min: 0, max: 9 },
    toeflScore: { type: Number, default: null, min: 0, max: 120 },
    topikScore: { type: Number, default: null, min: 0, max: 6 },
    languageCertificate: { type: String, trim: true, default: '' },
    languageScore: { type: String, trim: true, default: '' },
    languageCertificates: { type: [LanguageCertificateSchema], default: [] },
    availableDocuments: { type: [String], default: [] },
    workExperienceYears: { type: Number, default: 0, min: 0, max: 80 },
    enrollmentYear: { type: Number, default: null, min: 2000, max: 2200 },
    emailNotificationsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
)

UserProfileSchema.set('toJSON', {
  virtuals: true,
  transform: (_document, result) => {
    const value = result as Record<string, unknown>
    delete value._id
    delete value.__v
    delete value.userId
    return result
  },
})

type UserProfileShape = InferSchemaType<typeof UserProfileSchema>
export const UserProfile =
  (models.UserProfile as Model<UserProfileShape> | undefined) ||
  model<UserProfileShape>('UserProfile', UserProfileSchema)
