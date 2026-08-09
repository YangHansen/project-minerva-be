import { type InferSchemaType, type Model, Schema, model, models } from 'mongoose'

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, required: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
    tokenBalance: { type: Number, default: 12, min: 0, required: true },
  },
  { timestamps: true },
)

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (_document, result) => {
    const value = result as Record<string, unknown>
    delete value._id
    delete value.__v
    delete value.passwordHash
    return result
  },
})

type UserShape = InferSchemaType<typeof UserSchema>
export const User = (models.User as Model<UserShape> | undefined) || model<UserShape>('User', UserSchema)
