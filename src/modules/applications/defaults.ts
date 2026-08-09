export const defaultChecklistItems = [
  ['cv', 'Update CV', 'Tailored CV uploaded and ready for review', 'Core documents', true],
  ['essay', 'Draft leadership essay', 'Write the first draft for the leadership and influence prompt', 'Written materials', true],
  ['study-plan', 'Prepare study plan', 'Outline academic goals and post-study impact', 'Written materials', true],
  ['recommendation', 'Request recommendation letter', 'Ask your referee and send submission instructions', 'References', true],
  ['transcript', 'Upload academic transcript', 'Add your latest official academic record', 'Core documents', true],
  ['ielts', 'Add English test certificate', 'Upload IELTS, TOEFL, or another accepted result if required', 'Language', false],
  ['passport', 'Upload passport copy', 'Identity document required for application submission', 'Core documents', true],
  ['application', 'Complete application form', 'Review every response before the official submission', 'Submission', true],
].map(([itemKey, title, description, category, required], order) => ({
  itemKey: String(itemKey),
  title: String(title),
  description: String(description),
  category: String(category),
  required: Boolean(required),
  status: 'pending' as const,
  notes: '',
  order,
}))

export const defaultDocuments = [
  {
    blueprintKey: 'cv', kind: 'cv' as const, title: 'CV / Resume', description: 'Experience, leadership, and measurable outcomes',
    category: 'CV', prompt: 'Present the experience, leadership, and measurable outcomes most relevant to this scholarship.',
  },
  {
    blueprintKey: 'leadership-essay', kind: 'essay' as const, title: 'Leadership Essay', description: 'A prompt-specific scholarship response',
    category: 'Essay', prompt: 'Describe a time when you took the lead in a challenging situation. What was the impact and what did you learn?',
  },
  {
    blueprintKey: 'personal-statement', kind: 'personal' as const, title: 'Personal Statement', description: 'Motivation, background, and long-term impact',
    category: 'Personal Statement', prompt: 'Connect your background, motivation, and future contribution to this scholarship.',
  },
  {
    blueprintKey: 'statement-of-purpose', kind: 'purpose' as const, title: 'Statement of Purpose', description: 'Academic direction and program fit',
    category: 'Statement of Purpose', prompt: 'Explain your academic direction, program fit, and the change you intend to create.',
  },
  {
    blueprintKey: 'study-plan', kind: 'study' as const, title: 'Study Plan', description: 'Academic goals and learning pathway',
    category: 'Study Plan', prompt: 'Outline what you will study, why it matters, and how you will apply it after graduation.',
  },
  {
    blueprintKey: 'research-plan', kind: 'research' as const, title: 'Research Plan', description: 'Research question, methods, and expected contribution',
    category: 'Research Plan', prompt: 'Define the research question, method, feasibility, and expected contribution.',
  },
  {
    blueprintKey: 'academic-transcript', kind: 'transcript' as const, title: 'Academic Transcript', description: 'Official academic record and supporting notes',
    category: 'Transcript', prompt: 'Upload your official transcript and record any translation or certification requirements.',
  },
].map((document, order) => ({
  ...document,
  contentHtml: '',
  contentText: '',
  status: 'missing' as const,
  order,
}))
