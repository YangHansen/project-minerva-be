import { Schema, model, models } from 'mongoose';

const SubscriptionPlanSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'IDR' },
  tokensAwarded: { type: Number, required: true },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const SubscriptionPlan = models.SubscriptionPlan || model('SubscriptionPlan', SubscriptionPlanSchema);
