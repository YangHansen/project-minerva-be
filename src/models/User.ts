import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  tokenBalance: { type: Number, default: 0 }
}, { timestamps: true });

export const User = models.User || model('User', UserSchema);