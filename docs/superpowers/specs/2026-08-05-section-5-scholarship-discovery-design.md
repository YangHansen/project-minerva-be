# Section 5 Scholarship and Discovery Design

## Goal

Complete Section 5 of `docs/task.md` with working, correct scholarship catalog, detail, deterministic recommendation, CV-based AI recommendation, and admin creation endpoints.

## Scope

Section 5 exposes five JWT-protected endpoints:

```text
GET  /api/scholarships
GET  /api/scholarships/recommendations
GET  /api/scholarships/recommendations/ai
GET  /api/scholarships/:id
POST /api/scholarships
```

Static recommendation routes must be registered before `/:id`.

This section does not add pagination, recommendation persistence, caching, bulk import, scholarship update/delete, or token billing.

## Architecture

Use two focused library modules and one route module:

| File | Responsibility | Dependencies |
| --- | --- | --- |
| `src/lib/matching.ts` | Pure hard-filter and deterministic ranking logic | None |
| `src/lib/cvRecommender.ts` | OpenAI GPT request via the Files API and Responses API, prompt, response parsing, and validation | Config and `fetch` |
| `src/routes/scholarships.ts` | Authentication, database/storage access, HTTP validation, status codes, and response shaping | Libraries and existing models |

The route group follows the established `user.ts` and `documents.ts` pattern: inline `.use(jwt()).derive()` authentication returning `{ userId }`. A shared guard is not introduced because Elysia 1.4.29 does not propagate derived types through `.use()`.

`src/models/Scholarship.ts` already contains the fields needed by Section 5 and is exported from `src/models/index.ts`. It remains unchanged. The unused `UserProfile.scholarshipType` does not cause a new Scholarship field; scholarship type is excluded from deterministic ranking.

The pure matching module can later be reused by Section 6 when persisting `Shortlist.matchScore`.

## Scholarship Catalog

### `GET /api/scholarships`

Supported optional query parameters:

- `search`: case-insensitive match against `name`, `provider`, or `university`
- `country`
- `educationLevel`
- `fieldOfStudy`
- `fundingType`

Results sort by nearest deadline and return list fields only:

```json
{
  "success": true,
  "scholarships": [
    {
      "id": "...",
      "name": "GKS Scholarship",
      "provider": "NIIED",
      "country": "South Korea",
      "university": "...",
      "educationLevel": "Master's",
      "fieldOfStudy": "Computer Science",
      "fundingType": "fully_funded",
      "deadline": "2026-10-01T00:00:00.000Z"
    }
  ]
}
```

### `GET /api/scholarships/:id`

The detail endpoint returns the complete Scholarship document.

- Matching valid ObjectId: `200`
- Valid ObjectId with no document: `404 Scholarship not found`
- Invalid ObjectId: `400 Invalid scholarship id`

## Deterministic Recommendation

### `GET /api/scholarships/recommendations`

The endpoint reads the user's onboarding profile and applies two stages.

### Hard filter

Candidates must match both:

1. `UserProfile.targetEducationLevel` to `Scholarship.educationLevel`
2. `UserProfile.fieldOfStudy` to `Scholarship.fieldOfStudy`

Matching is case-insensitive. A Scholarship field of study equal to `All Fields` is a wildcard and matches any user field.

If either required profile field is missing, the endpoint returns `200` with an empty recommendation list and a message instructing the user to complete onboarding. A complete profile with no eligible scholarships also returns `200` with an empty list.

### Ranking

Eligible scholarships receive a score from two preferences:

- Destination country match: 60 points
- Funding preference match: 40 points

Results sort by descending score, then nearest deadline. The endpoint returns at most five recommendations with short Indonesian reasoning describing the matched preferences.

```json
{
  "success": true,
  "recommendations": [
    {
      "scholarship": {
        "id": "...",
        "name": "GKS Scholarship",
        "provider": "NIIED",
        "country": "South Korea",
        "educationLevel": "Master's",
        "fundingType": "fully_funded",
        "deadline": "2026-10-01T00:00:00.000Z"
      },
      "matchScore": 100,
      "reasoning": "Negara tujuan South Korea. Pendanaan fully_funded."
    }
  ]
}
```

`src/lib/matching.ts` provides pure operations equivalent to:

```ts
buildHardFilter(profile) => filter | null
rankByPreference(profile, scholarship) => { matchScore, reasoning }
```

## CV-Based GPT Recommendation

### `GET /api/scholarships/recommendations/ai`

This endpoint combines the user's latest uploaded CV with their onboarding profile and sends both to OpenAI GPT. It is separate from deterministic recommendations so AI latency and failures do not affect the standard experience.

### Data flow

1. Load the UserProfile.
2. Build the same hard filter used by deterministic recommendations.
3. Query at most 20 eligible scholarships, ordered by nearest deadline.
4. If there are no candidates, return `200` with an empty list without downloading the CV or calling OpenAI.
5. Find the user's newest Document with `documentType: 'cv'`, ordered by `createdAt`.
6. Require the CV to have PDF MIME type.
7. Download the file bytes directly from the private Supabase `documents` bucket with the service-role client.
8. Upload the PDF to OpenAI with `POST /v1/files` (multipart `FormData`, filename ending in `.pdf`) and capture the returned `file_id`.
9. Call `POST /v1/responses` with the profile text, the candidate scholarship data, and the uploaded file referenced by `file_id`.
10. Always delete the uploaded file with `DELETE /v1/files/:id` in a `finally` block, so files do not linger on OpenAI when the call fails.
11. Parse and validate the JSON output from the response.
12. Map returned IDs back to the queried Scholarship documents.

The caller cannot supply a storage path or document ID, preventing access to another user's CV.

The GPT call uses a fixed model constant, defaulting to `gpt-4.1-mini` with `detail: "low"` to keep PDF page-image input tokens small. The response requests structured JSON output via `text: { format: { type: "json_object" } }`.

GPT must return no more than five entries containing:

```json
{
  "id": "existing scholarship id",
  "matchScore": 92,
  "reasoning": "Short explanation in Indonesian"
}
```

The backend clamps scores to integer values from 0 through 100, removes duplicate and unknown scholarship IDs, and shapes each result like the deterministic endpoint.

The endpoint is free and does not debit user tokens. Token billing remains in Section 7 for CV and essay reviews.

### AI configuration

`src/config.ts` gains optional `openaiApiKey: string`, read from `OPENAI_API_KEY` with an empty-string default. The application must continue to start when it is absent; only the AI recommendation endpoint is unavailable.

OpenAI is called through the native `fetch` API. No new dependency is added.

### Error mapping

| Condition | HTTP response |
| --- | --- |
| Missing target education or field of study | `400 Complete your profile first` |
| No uploaded CV | `400 Unggah CV terlebih dahulu untuk rekomendasi berbasis CV` |
| Latest CV is not a PDF | `400 CV harus berupa file PDF` |
| Missing `OPENAI_API_KEY` | `503 AI recommendation is unavailable` |
| Supabase download failure | `502 Failed to download CV` |
| OpenAI file upload failure | `502 Failed to upload CV` |
| OpenAI response failure, timeout, or invalid JSON | `502 AI recommendation failed` |
| No eligible scholarships | `200` with `recommendations: []` |

## Admin Creation

### `POST /api/scholarships`

The endpoint resolves `userId` from the JWT, loads User, and requires `role: 'admin'`.

- Missing or non-admin user: `403 Forbidden`
- Invalid body: Elysia validation response `422`
- Valid body: create Scholarship and return `201`

Required fields are `name`, `provider`, `country`, `educationLevel`, `fieldOfStudy`, `fundingType`, and `deadline`. The body also accepts the optional fields already supported by the Scholarship schema.

`requiredDocuments` remains a string array aligned with `Document.documentType`. It is not narrowed to a hardcoded enum so new document types remain possible.

```json
{
  "success": true,
  "message": "Scholarship added successfully"
}
```

## Error Handling

All endpoints use the existing global JSON error handler. Route handlers set explicit status codes before throwing errors so the global handler preserves `400`, `403`, `404`, `502`, and `503`.

Catalog and deterministic failures must not depend on OpenAI configuration. AI failures are explicit rather than silently falling back to deterministic results because the frontend must distinguish retryable service failures from missing user data.

## Testing

### Unit tests

Test `src/lib/matching.ts` with plain objects:

- hard filter includes target education and field of study
- incomplete profile produces no hard filter
- matching is case-insensitive
- `All Fields` behaves as a wildcard
- both ranking preferences score 100
- destination-only match scores 60
- funding-only match scores 40
- no preferences match scores 0
- ties order by nearest deadline

Test CV recommendation parsing with an injected or mocked `fetch`:

- valid GPT JSON output is accepted
- scores are converted to integers and clamped to 0-100
- duplicate and unknown IDs are removed
- malformed output and non-2xx responses fail cleanly
- the uploaded file is deleted even when the response call fails
- absent API key does not call `fetch`

### Route smoke checks

- JWT required for every endpoint
- catalog list and each filter
- invalid and missing detail IDs
- deterministic recommendation ordering and empty outcomes
- non-admin creation returns `403`
- admin creation returns `201`
- invalid admin body returns `422`
- AI endpoint handles missing profile, missing CV, non-PDF CV, missing key, empty candidates, storage failure, OpenAI upload failure, and OpenAI response failure
- one optional live GPT check using a real uploaded PDF after `OPENAI_API_KEY` is configured

Final verification runs `bun test` and `bunx tsc --noEmit`.

## Deferred Work

- Pagination: add when catalog size or response time requires it.
- AI result caching or persistence: add when repeated request cost is measurable.
- Bulk import and scholarship update/delete: add when admin catalog management is in scope.
- Token billing for recommendations: add only if product policy changes.
- GPT file-id reuse or caching: add if repeated AI recommendation cost is measurable.
- Official OpenAI SDK: add if the raw Responses API calls outgrow plain `fetch`.
