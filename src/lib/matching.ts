/**
 * Pure scholarship matching logic — no DB or network I/O.
 *
 * Exported functions:
 *   buildHardFilter  — builds a case-insensitive Mongoose query filter or null
 *   rankByPreference — scores a single scholarship and produces Indonesian reasoning
 */

export interface MatchProfile {
  targetEducationLevel?: string | null;
  fieldOfStudy?: string | null;
  destinationCountry?: string | null;
  fundingPreference?: string | null;
  gpa?: number | null;
  ieltsScore?: number | null;
}

export interface MatchScholarship {
  educationLevel?: string | null;
  fieldOfStudy?: string | null;
  country?: string | null;
  fundingType?: string | null;
  deadline?: Date | null;
  minGpa?: number | null;
  minIeltsScore?: number | null;
}

/**
 * Returns a Mongoose filter that hard-filters by education level and field of study,
 * or null when the profile is missing either required field.
 *
 * "All Fields" in the scholarship collection is treated as a wildcard; the filter
 * uses a $in array so that documents with fieldOfStudy "All Fields" always pass.
 */
export function buildHardFilter(
  profile: MatchProfile
): Record<string, unknown> | null {
  const edu = profile.targetEducationLevel?.trim();
  const field = profile.fieldOfStudy?.trim();

  if (!edu || !field) return null;

  return {
    educationLevel: { $regex: new RegExp(`^${escapeRegex(edu)}$`, 'i') },
    fieldOfStudy: {
      $in: [
        new RegExp(`^${escapeRegex(field)}$`, 'i'),
        /^All Fields$/i
      ]
    }
  };
}

export interface RankResult {
  matchScore: number;
  reasoning: string;
}

/**
 * Scores a scholarship against user preferences.
 *   Destination country match : 60 points
 *   Funding preference match  : 40 points
 *
 * Returns score and short Indonesian reasoning string.
 */
export function rankByPreference(
  profile: MatchProfile,
  scholarship: MatchScholarship
): RankResult {
  let score = 0;
  const parts: string[] = [];

  // Country — 60 pts
  if (
    profile.destinationCountry?.trim() &&
    scholarship.country?.trim() &&
    normalize(profile.destinationCountry) === normalize(scholarship.country)
  ) {
    score += 60;
    parts.push(`Negara tujuan ${scholarship.country.trim()}.`);
  }

  // Funding — 40 pts
  if (
    profile.fundingPreference?.trim() &&
    scholarship.fundingType?.trim() &&
    normalize(profile.fundingPreference) === normalize(scholarship.fundingType)
  ) {
    score += 40;
    parts.push(`Pendanaan ${scholarship.fundingType.trim()}.`);
  }

  // Deduct points heavily if GPA or IELTS is below requirement
  if (scholarship.minGpa && (profile.gpa ?? 0) < scholarship.minGpa) {
    score -= 100;
    parts.push(`GPA kurang dari minimum (${scholarship.minGpa}).`);
  }

  if (scholarship.minIeltsScore && (profile.ieltsScore ?? 0) < scholarship.minIeltsScore) {
    score -= 100;
    parts.push(`IELTS kurang dari minimum (${scholarship.minIeltsScore}).`);
  }

  return {
    matchScore: score,
    reasoning: parts.join(' ')
  };
}

// ─── helpers ────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
