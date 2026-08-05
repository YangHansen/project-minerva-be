import { describe, expect, test, mock } from 'bun:test';
import {
  reviewPdf,
  reviewText,
  parseReviewOutput,
  buildReviewPrompt
} from './aiReviewer';

const makeJsonResponse = (body: unknown, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  );

const PDF = new ArrayBuffer(4);
const API_KEY = 'sk-test';

const gptEnvelope = (feedback: unknown) => ({
  output: [{ content: [{ text: JSON.stringify({ feedback }) }] }]
});

const FEEDBACK = {
  completeness: 'Riwayat lengkap.',
  formatting: 'Beri jarak baris.',
  relevance: 'Relevan.',
  suggestedImprovements: 'Tambah pencapaian numerik.'
};

describe('parseReviewOutput', () => {
  test('returns feedback object with string values', () => {
    expect(parseReviewOutput(JSON.stringify({ feedback: FEEDBACK }))).toEqual({
      feedback: FEEDBACK
    });
  });

  test('drops non-string feedback values', () => {
    const result = parseReviewOutput(
      JSON.stringify({ feedback: { completeness: 'ok', relevance: 5, grammar: null } })
    );
    expect(result.feedback).toEqual({ completeness: 'ok' });
  });

  test('throws on invalid JSON', () => {
    expect(() => parseReviewOutput('not json {{')).toThrow('invalid JSON');
  });

  test('throws when feedback is missing or not an object', () => {
    expect(() => parseReviewOutput(JSON.stringify({ score: 85 }))).toThrow('unexpected response structure');
    expect(() => parseReviewOutput(JSON.stringify({ feedback: 'nope' }))).toThrow('unexpected response structure');
  });

  test('throws when feedback is empty', () => {
    expect(() => parseReviewOutput(JSON.stringify({ feedback: {} }))).toThrow('empty feedback');
  });
});

describe('buildReviewPrompt', () => {
  test('CV prompt demands the CV feedback keys', () => {
    const prompt = buildReviewPrompt('cv');
    for (const key of ['completeness', 'formatting', 'relevance', 'suggestedImprovements']) {
      expect(prompt).toContain(`"${key}"`);
    }
    expect(prompt).toContain('Output only valid JSON');
  });

  test('essay prompt demands the essay feedback keys', () => {
    const prompt = buildReviewPrompt('essay');
    for (const key of ['structure', 'relevance', 'grammar', 'motivation', 'suggestedImprovements']) {
      expect(prompt).toContain(`"${key}"`);
    }
  });
});

describe('reviewText', () => {
  test('makes a single Responses call and returns feedback', async () => {
    const mockFetch = mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
    mockFetch.mockImplementationOnce(() => makeJsonResponse(gptEnvelope(FEEDBACK)));
    const result = await reviewText('My essay', { reviewType: 'essay' }, API_KEY, mockFetch as unknown as typeof fetch);
    expect(result).toEqual({ feedback: FEEDBACK });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0];
    expect((init?.body as string).includes('essay')).toBe(true);
  });

  test('throws on non-2xx response', async () => {
    const mockFetch = mock(() => makeJsonResponse({ error: 'bad' }, 500));
    await expect(
      reviewText('My essay', { reviewType: 'essay' }, API_KEY, mockFetch as unknown as typeof fetch)
    ).rejects.toThrow('Responses API failed');
  });
});

describe('reviewPdf', () => {
  test('uploads, calls Responses, deletes the file, returns feedback', async () => {
    const mockFetch = mock()
      .mockImplementationOnce(() => makeJsonResponse({ id: 'file-1' }))
      .mockImplementationOnce(() => makeJsonResponse(gptEnvelope(FEEDBACK)))
      .mockImplementationOnce(() => makeJsonResponse({ deleted: true }));

    const result = await reviewPdf(PDF, { reviewType: 'cv' }, API_KEY, mockFetch as unknown as typeof fetch);
    expect(result).toEqual({ feedback: FEEDBACK });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  test('file is deleted even when the Responses call fails', async () => {
    const mockFetch = mock()
      .mockImplementationOnce(() => makeJsonResponse({ id: 'file-2' }))
      .mockImplementationOnce(() => makeJsonResponse({ error: 'bad' }, 500))
      .mockImplementationOnce(() => makeJsonResponse({ deleted: true }));

    await expect(
      reviewPdf(PDF, { reviewType: 'cv' }, API_KEY, mockFetch as unknown as typeof fetch)
    ).rejects.toThrow();

    expect(mockFetch).toHaveBeenCalledTimes(3);
    const deleteCall = mockFetch.mock.calls[2];
    expect(deleteCall[0]).toContain('file-2');
    expect(deleteCall[1]?.method).toBe('DELETE');
  });
});
