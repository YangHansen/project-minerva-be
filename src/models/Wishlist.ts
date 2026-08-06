import { Schema, model } from 'mongoose';

const WishlistSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scholarshipId: { type: Schema.Types.ObjectId, ref: 'Scholarship', required: true }
}, { timestamps: true });

WishlistSchema.index({ userId: 1, scholarshipId: 1 }, { unique: true });

export const Wishlist = model('Wishlist', WishlistSchema);
