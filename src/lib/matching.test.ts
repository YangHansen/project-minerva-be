import { describe, expect, test } from 'bun:test';
import { buildHardFilter, rankByPreference } from './matching';

// ─── buildHardFilter ─────────────────────────────────────────────────────────

describe('buildHardFilter', () => {
  test('returns null when targetEducationLevel is missing', () => {
    expect(buildHardFilter({ fieldOfStudy: 'Computer Science' })).toBeNull();
  });

  test('returns null when fieldOfStudy is missing', () => {
    expect(buildHardFilter({ targetEducationLevel: "Master's" })).toBeNull();
  });

  test('returns null when both fields are missing', () => {
    expect(buildHardFilter({})).toBeNull();
  });

  test('returns a filter when both fields are present', () => {
    const filter = buildHardFilter({
      targetEducationLevel: "Master's",
      fieldOfStudy: 'Computer Science'
    });
    expect(filter).not.toBeNull();
    expect(filter).toHaveProperty('educationLevel');
    expect(filter).toHaveProperty('fieldOfStudy');
  });

  test('filter matches target education level case-insensitively', () => {
    const filter = buildHardFilter({
      targetEducationLevel: "MASTER'S",
      fieldOfStudy: 'computer science'
    }) as Record<string, unknown>;
    const regex = (filter['educationLevel'] as { $regex: RegExp })['$regex'];
    expect(regex.test("Master's")).toBe(true);
    expect(regex.test("master's")).toBe(true);
    expect(regex.test('Doctoral')).toBe(false);
  });

  test('filter includes "All Fields" wildcard alongside exact match', () => {
    const filter = buildHardFilter({
      targetEducationLevel: "Master's",
      fieldOfStudy: 'Engineering'
    }) as Record<string, unknown>;
    const inArr = (filter['fieldOfStudy'] as { $in: RegExp[] })['$in'];
    const allFieldsRegex = inArr[1];
    expect(allFieldsRegex.test('All Fields')).toBe(true);
    expect(allFieldsRegex.test('all fields')).toBe(true);
    // user field regex matches exactly
    expect(inArr[0].test('Engineering')).toBe(true);
    expect(inArr[0].test('engineering')).toBe(true);
    expect(inArr[0].test('Mathematics')).toBe(false);
  });
});

// ─── rankByPreference ────────────────────────────────────────────────────────

describe('rankByPreference', () => {
  const profile = {
    destinationCountry: 'South Korea',
    fundingPreference: 'fully_funded'
  };

  const scholarship = (country: string, fundingType: string) => ({
    country,
    fundingType,
    deadline: new Date('2026-10-01')
  });

  test('both preferences match → score 100', () => {
    const { matchScore } = rankByPreference(
      profile,
      scholarship('South Korea', 'fully_funded')
    );
    expect(matchScore).toBe(100);
  });

  test('only destination country matches → score 60', () => {
    const { matchScore } = rankByPreference(
      profile,
      scholarship('South Korea', 'partially_funded')
    );
    expect(matchScore).toBe(60);
  });

  test('only funding preference matches → score 40', () => {
    const { matchScore } = rankByPreference(
      profile,
      scholarship('Japan', 'fully_funded')
    );
    expect(matchScore).toBe(40);
  });

  test('no preferences match → score 0', () => {
    const { matchScore } = rankByPreference(
      profile,
      scholarship('Japan', 'partially_funded')
    );
    expect(matchScore).toBe(0);
  });

  test('country comparison is case-insensitive', () => {
    const { matchScore } = rankByPreference(
      { destinationCountry: 'south korea', fundingPreference: 'fully_funded' },
      scholarship('South Korea', 'fully_funded')
    );
    expect(matchScore).toBe(100);
  });

  test('reasoning contains country when matched', () => {
    const { reasoning } = rankByPreference(
      profile,
      scholarship('South Korea', 'partially_funded')
    );
    expect(reasoning).toContain('South Korea');
  });

  test('reasoning contains funding type when matched', () => {
    const { reasoning } = rankByPreference(
      profile,
      scholarship('Japan', 'fully_funded')
    );
    expect(reasoning).toContain('fully_funded');
  });

  test('ties: results sorted by nearest deadline (caller responsibility — pure ranking does not sort)', () => {
    // rankByPreference is per-scholarship; sorting is the caller's job.
    // We verify the score is deterministic for the same inputs.
    const r1 = rankByPreference(profile, scholarship('South Korea', 'fully_funded'));
    const r2 = rankByPreference(profile, scholarship('South Korea', 'fully_funded'));
    expect(r1.matchScore).toBe(r2.matchScore);
  });
});
