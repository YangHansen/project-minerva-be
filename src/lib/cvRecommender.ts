/**
 * CV-based GPT recommendation module.
 *
 * Uses the OpenAI Files API + Responses API via native fetch — no SDK dependency.
 * The caller must supply raw PDF bytes, a user profile summary, candidate scholarships,
 * and a valid API key.
 *
 * File lifecycle:
 *   1. Upload PDF → get file_id
 *   2. Call Responses API referencing file_id
 *   3. Delete file (in finally block — always runs)
 */

const MODEL = 'gpt-4.1-mini';

export interface CvProfile {
  targetEducationLevel?: string | null;
  fieldOfStudy?: string | null;
  destinationCountry?: string | null;
  fundingPreference?: string | null;
}

export interface CvCandidate {
  id: string;
  name: string;
  country: string;
  educationLevel?: string | null;
  fundingType: string;
  deadline: Date;
}

export interface AiRecommendation {
  scholarship: CvCandidate;
  matchScore: number;
  reasoning: string;
}

// ─── OpenAI file upload ───────────────────────────────────────────────────────

/**
 * Uploads pdfBytes to OpenAI and returns the file_id.
 * Throws with a descriptive message on any non-2xx response.
 */
export async function uploadCvToOpenAI(
  pdfBytes: ArrayBuffer,
  apiKey: string,
  fetchFn: typeof fetch = fetch
): Promise<string> {
  const form = new FormData();
  form.append(
    'file',
    new Blob([pdfBytes], { type: 'application/pdf' }),
    'cv.pdf'
  );
  form.append('purpose', 'user_data');

  const res = await fetchFn('https://api.openai.com/v1/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI file upload failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { id?: string };
  if (!json.id) throw new Error('OpenAI file upload response missing id');
  return json.id;
}

// ─── OpenAI file deletion ─────────────────────────────────────────────────────

/**
 * Deletes a previously uploaded file. Errors are swallowed to avoid masking
 * earlier failures; the caller uses this in a finally block.
 */
export async function deleteOpenAiFile(
  fileId: string,
  apiKey: string,
  fetchFn: typeof fetch = fetch
): Promise<void> {
  try {
    await fetchFn(`https://api.openai.com/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiKey}` }
    });
  } catch {
    // Best-effort — do not surface deletion errors
  }
}

// ─── OpenAI Responses API call ────────────────────────────────────────────────

interface OpenAiEntry {
  id: string;
  matchScore: number;
  reasoning: string;
}

interface OpenAiResponsesResult {
  recommendations: OpenAiEntry[];
}

/**
 * Calls POST /v1/responses, referencing the uploaded CV file by file_id.
 * Returns parsed and validated JSON output.
 * Throws on non-2xx or unparseable responses.
 */
export async function callOpenAiResponses(
  params: {
    fileId: string;
    profile: CvProfile;
    candidates: CvCandidate[];
  },
  apiKey: string,
  fetchFn: typeof fetch = fetch
): Promise<OpenAiResponsesResult> {
  const profileText = [
    `Target education: ${params.profile.targetEducationLevel ?? 'unknown'}`,
    `Field of study: ${params.profile.fieldOfStudy ?? 'unknown'}`,
    `Destination country: ${params.profile.destinationCountry ?? 'unknown'}`,
    `Funding preference: ${params.profile.fundingPreference ?? 'unknown'}`
  ].join('\n');

  const candidatesText = params.candidates
    .map(
      (c, i) =>
        `${i + 1}. id=${c.id} name="${c.name}" country="${c.country}" level="${c.educationLevel ?? ''}" funding="${c.fundingType}" deadline="${c.deadline.toISOString()}"`
    )
    .join('\n');

  const systemPrompt =
    'You are a scholarship matching assistant. ' +
    'Analyse the attached CV and rank the provided scholarship candidates for the user. ' +
    'Return JSON with key "recommendations" containing an array of at most 5 objects. ' +
    'Each object must have: id (string, exact scholarship id from the list), ' +
    'matchScore (integer 0-100), reasoning (short explanation in Indonesian). ' +
    'Only include scholarships from the provided list. ' +
    'Output only valid JSON, no markdown.';

  const userContent = [
    {
      type: 'input_file',
      file_id: params.fileId
    },
    {
      type: 'input_text',
      text: `User profile:\n${profileText}\n\nScholarship candidates:\n${candidatesText}`
    }
  ];

  const body = {
    model: MODEL,
    input: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userContent
      }
    ],
    text: {
      format: {
        type: 'json_object'
      }
    }
  };

  const res = await fetchFn('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI Responses API failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  // Extract text from output[0].content[0].text
  const outputText =
    json.output?.[0]?.content?.[0]?.text;

  if (!outputText) {
    throw new Error('AI recommendation failed: empty response output');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error('AI recommendation failed: invalid JSON in response');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>)['recommendations'])
  ) {
    throw new Error('AI recommendation failed: unexpected response structure');
  }

  return parsed as OpenAiResponsesResult;
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * Full CV-based recommendation flow:
 *   1. Upload PDF
 *   2. Call Responses API
 *   3. Delete file (always)
 *   4. Validate, clamp, deduplicate results
 *   5. Map back to candidate objects
 */
export async function getAiRecommendations(
  pdfBytes: ArrayBuffer,
  profile: CvProfile,
  candidates: CvCandidate[],
  apiKey: string,
  fetchFn: typeof fetch = fetch
): Promise<AiRecommendation[]> {
  const candidateMap = new Map(candidates.map((c) => [c.id, c]));

  const fileId = await uploadCvToOpenAI(pdfBytes, apiKey, fetchFn);

  let rawResults: OpenAiResponsesResult;
  try {
    rawResults = await callOpenAiResponses(
      { fileId, profile, candidates },
      apiKey,
      fetchFn
    );
  } finally {
    await deleteOpenAiFile(fileId, apiKey, fetchFn);
  }

  // Validate, clamp, deduplicate
  const seen = new Set<string>();
  const results: AiRecommendation[] = [];

  for (const entry of rawResults.recommendations) {
    if (!entry || typeof entry.id !== 'string') continue;
    if (seen.has(entry.id)) continue;
    const candidate = candidateMap.get(entry.id);
    if (!candidate) continue; // unknown ID

    seen.add(entry.id);

    const rawScore = typeof entry.matchScore === 'number' ? entry.matchScore : 0;
    const matchScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    results.push({
      scholarship: candidate,
      matchScore,
      reasoning: typeof entry.reasoning === 'string' ? entry.reasoning : ''
    });
  }

  return results;
}
