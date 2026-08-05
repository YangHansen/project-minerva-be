import { Schema, model, models } from 'mongoose';

// Same value set as Document.documentType — items map to owned documents and to scholarship.requiredDocuments
export const SHORTLIST_ITEM_TYPES = [
  'cv', 'essay', 'research_plan', 'personal_statement', 'study_plan',
  'recommendation_letter', 'transcript', 'ielts_cert', 'passport',
  'portfolio', 'writing_sample', 'thesis_abstract', 'health_certificate',
  'family_relationship_proof', 'citizenship_proof'
] as const;

export interface ChecklistItemInput {
  itemType: string;
  isCompleted: boolean;
  documentId: null;
}

export function buildChecklistItems(requiredDocuments: string[] = []): ChecklistItemInput[] {
  const seen = new Set<string>();
  const items: ChecklistItemInput[] = [];
  for (const docType of requiredDocuments) {
    if (!(SHORTLIST_ITEM_TYPES as readonly string[]).includes(docType) || seen.has(docType)) continue;
    seen.add(docType);
    items.push({ itemType: docType, isCompleted: false, documentId: null });
  }
  return items;
}

const ShortlistItemSchema = new Schema({
  itemType: { type: String, enum: SHORTLIST_ITEM_TYPES, required: true },
  isCompleted: { type: Boolean, default: false },
  documentId: { type: Schema.Types.ObjectId, ref: 'Document', default: null }
});

const ShortlistSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scholarshipId: { type: Schema.Types.ObjectId, ref: 'Scholarship', required: true },
  status: { type: String, enum: ['saved', 'preparing'], default: 'saved' },
  notifiedStages: [{ type: String, enum: ['30_days', '14_days', '7_days', '3_days'] }],
  items: [ShortlistItemSchema]
}, { timestamps: true });

ShortlistSchema.index({ userId: 1, scholarshipId: 1 }, { unique: true });

export const Shortlist = model('Shortlist', ShortlistSchema);
