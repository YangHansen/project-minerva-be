/**
 * AI CV/essay review module.
 *
 * Uses the OpenAI Responses API via native fetch — no SDK dependency.
 * PDF input reuses the file upload/delete helpers from cvRecommender.
 * The caller must supply PDF bytes (or essay text), a review type, and a valid API key.
 *
 * Reviews return structured feedback only (no score).
 */

import { uploadCvToOpenAI, deleteOpenAiFile } from './cvRecommender'

const MODEL = 'gpt-4.1-mini'

export type ReviewType = 'cv' | 'essay'

export interface ReviewOpts {
  reviewType: ReviewType
  targetScholarshipId?: string
}

export interface ReviewResult {
  feedback: Record<string, string>
}

const FEEDBACK_KEYS: Record<ReviewType, string[]> = {
  cv: ['completeness', 'formatting', 'relevance', 'suggestedImprovements'],
  essay: ['structure', 'relevance', 'grammar', 'motivation', 'suggestedImprovements']
}

export function buildReviewPrompt(
  reviewType: ReviewType,
  targetScholarshipId?: string
): string {
  const keys = FEEDBACK_KEYS[reviewType].join('", "')
  const focus =
    reviewType === 'cv'
      ? 'Evaluate the attached CV as a scholarship application document.'
      : 'Evaluate the essay as a scholarship application essay.'
  const scholarshipLine = targetScholarshipId
    ? ` The essay should be tailored to the scholarship with id ${targetScholarshipId}.`
    : ''
  return (
    'You are a scholarship application reviewer. ' +
    focus +
    ' Provide constructive, specific feedback in Indonesian.' +
    scholarshipLine +
    ' Return JSON with exactly one key "feedback" containing all of these string fields: ' +
    `"${keys}". ` +
    'Every field must be a non-empty string. Output only valid JSON, no markdown.'
  )
}

// ─── OpenAI Responses API call ────────────────────────────────────────────────

interface ReviewResponsesInput {
  fileId?: string
  text?: string
}

/**
 * Calls POST /v1/responses with either an uploaded PDF file_id or pasted essay text.
 * Returns parsed and validated `{ feedback }`.
 * Throws on non-2xx or unparseable responses.
 */
export async function callOpenAiReview(
  params: ReviewResponsesInput & ReviewOpts,
  apiKey: string,
  fetchFn: typeof fetch = fetch
): Promise<ReviewResult> {
  const content: unknown[] = []
  if (params.fileId) {
    content.push({ type: 'input_file', file_id: params.fileId })
  }
  content.push({
    type: 'input_text',
    text: params.text ?? 'Please review the attached document.'
  })

  const body = {
    model: MODEL,
    input: [
      { role: 'system', content: buildReviewPrompt(params.reviewType, params.targetScholarshipId) },
      { role: 'user', content }
    ],
    text: { format: { type: 'json_object' } }
  }

  const res = await fetchFn('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenAI Responses API failed (${res.status}): ${text}`)
  }

  const json = (await res.json()) as {
    output?: Array<{ content?: Array<{ text?: string }> }>
  }
  const outputText = json.output?.[0]?.content?.[0]?.text
  if (!outputText) throw new Error('AI review failed: empty response output')

  return parseReviewOutput(outputText)
}

// ─── Output validation ────────────────────────────────────────────────────────

/**
 * Parses the GPT JSON output and keeps only string feedback values.
 * Throws a descriptive error on malformed or missing output.
 */
export function parseReviewOutput(outputText: string): ReviewResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(outputText)
  } catch {
    throw new Error('AI review failed: invalid JSON in response')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>)['feedback'] !== 'object' ||
    (parsed as Record<string, unknown>)['feedback'] === null
  ) {
    throw new Error('AI review failed: unexpected response structure')
  }

  const feedback: Record<string, string> = {}
  for (const [key, value] of Object.entries(
    (parsed as Record<string, unknown>)['feedback'] as Record<string, unknown>
  )) {
    if (typeof value === 'string' && value.length > 0) feedback[key] = value
  }
  if (Object.keys(feedback).length === 0) {
    throw new Error('AI review failed: empty feedback')
  }

  return { feedback }
}

// ─── Orchestrators ────────────────────────────────────────────────────────────

/**
 * Reviews a PDF: uploads to OpenAI, calls Responses, deletes the file (always).
 */
export async function reviewPdf(
  pdfBytes: ArrayBuffer,
  opts: ReviewOpts,
  apiKey: string,
  fetchFn: typeof fetch = fetch
): Promise<ReviewResult> {
  const fileId = await uploadCvToOpenAI(pdfBytes, apiKey, fetchFn)
  try {
    return await callOpenAiReview({ fileId, ...opts }, apiKey, fetchFn)
  } finally {
    await deleteOpenAiFile(fileId, apiKey, fetchFn)
  }
}

/**
 * Reviews pasted essay text without a file upload.
 */
export async function reviewText(
  text: string,
  opts: ReviewOpts,
  apiKey: string,
  fetchFn: typeof fetch = fetch
): Promise<ReviewResult> {
  return callOpenAiReview({ text, ...opts }, apiKey, fetchFn)
}
