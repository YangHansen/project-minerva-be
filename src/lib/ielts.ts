/**
 * Pure IELTS grading logic — no DB or network I/O.
 *
 * gradeAnswers  — scores submitted answers against stored questions
 * toBandScore   — converts a raw score fraction to a 0-9 IELTS band (1 d.p.)
 */

export interface IELTSQuestion {
  correctAnswer: number;
  explanation?: string | null;
}

export interface QuestionResult {
  questionIndex: number;
  isCorrect: boolean;
  correctAnswer: number;
  explanation: string | null;
}

export interface GradeResult {
  score: number;
  results: QuestionResult[];
}

/**
 * Grades submitted answers against the question list.
 *
 * Leniency rules (spec §Decisions):
 *   - count mismatch (fewer or extra answers) → missing/out-of-range → incorrect
 *   - non-numeric values won't reach this function (Elysia validates t.Array(t.Number()))
 *
 * @param questions  Stored question objects (correctAnswer + optional explanation)
 * @param answers    Submitted answer indices (0-based)
 */
export function gradeAnswers(
  questions: IELTSQuestion[],
  answers: number[]
): GradeResult {
  let score = 0;
  const results: QuestionResult[] = questions.map((q, i) => {
    const submitted = answers[i];
    const isCorrect =
      typeof submitted === 'number' &&
      Number.isFinite(submitted) &&
      submitted >= 0 &&
      submitted === q.correctAnswer;

    if (isCorrect) score++;

    return {
      questionIndex: i,
      isCorrect,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation ?? null
    };
  });

  return { score, results };
}

/**
 * Converts a raw score fraction to an IELTS band (0-9, 1 decimal place).
 *
 *   toBandScore(0, 0) = 0   (guard against divide-by-zero)
 *   toBandScore(9, 9) = 9.0
 */
export function toBandScore(score: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((score / total) * 9 * 10) / 10;
}
