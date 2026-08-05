import { expect, test } from 'bun:test';
import { buildChecklistItems, SHORTLIST_ITEM_TYPES } from './Shortlist';

test('builds one unchecked item per required document, deduped and filtered', () => {
  const items = buildChecklistItems(['cv', 'essay', 'cv', 'passport', 'not_a_type']);
  expect(items).toEqual([
    { itemType: 'cv', isCompleted: false, documentId: null },
    { itemType: 'essay', isCompleted: false, documentId: null },
    { itemType: 'passport', isCompleted: false, documentId: null }
  ]);
});

test('returns empty for empty or all-unknown required documents', () => {
  expect(buildChecklistItems()).toEqual([]);
  expect(buildChecklistItems(['unknown'])).toEqual([]);
});

test('item enum matches Document.documentType', () => {
  expect(SHORTLIST_ITEM_TYPES).toEqual([
    'cv', 'essay', 'research_plan', 'personal_statement', 'study_plan',
    'recommendation_letter', 'transcript', 'ielts_cert', 'passport',
    'portfolio', 'writing_sample', 'thesis_abstract', 'health_certificate',
    'family_relationship_proof', 'citizenship_proof'
  ]);
});
