import { describe, expect, test } from 'bun:test';
import { gradeAnswers, toBandScore } from './ielts';

// ─── gradeAnswers ─────────────────────────────────────────────────────────────

describe('gradeAnswers', () => {
  const questions = [
    { correctAnswer: 0, explanation: 'First answer is A.' },
    { correctAnswer: 2, explanation: 'Third option is correct.' },
    { correctAnswer: 1, explanation: null },
    { correctAnswer: 3, explanation: undefined }
  ];

  test('all-correct answers → score = total', () => {
    const { score, results } = gradeAnswers(questions, [0, 2, 1, 3]);
    expect(score).toBe(4);
    expect(results.every((r) => r.isCorrect)).toBe(true);
  });

  test('all-wrong answers → score = 0', () => {
    const { score, results } = gradeAnswers(questions, [1, 0, 0, 0]);
    expect(score).toBe(0);
    expect(results.every((r) => !r.isCorrect)).toBe(true);
  });

  test('partial answers + out-of-range indices → incorrect', () => {
    // answers[2] = -1 (negative — out-of-range), answers[3] = 999 (out-of-range)
    const { score, results } = gradeAnswers(questions, [0, 2, -1, 999]);
    expect(score).toBe(2);
    expect(results[0].isCorrect).toBe(true);
    expect(results[1].isCorrect).toBe(true);
    expect(results[2].isCorrect).toBe(false);
    expect(results[3].isCorrect).toBe(false);
  });

  test('fewer answers than questions → missing treated as incorrect', () => {
    const { score, results } = gradeAnswers(questions, [0, 2]); // only 2 submitted
    expect(score).toBe(2);
    expect(results[2].isCorrect).toBe(false);
    expect(results[3].isCorrect).toBe(false);
  });

  test('extra answers beyond question count are silently ignored', () => {
    const { score, results } = gradeAnswers(questions, [0, 2, 1, 3, 99, 100]);
    expect(score).toBe(4);
    expect(results).toHaveLength(4); // only as many results as questions
  });

  test('missing explanation returns null in result', () => {
    const { results } = gradeAnswers(questions, [0, 2, 1, 3]);
    expect(results[2].explanation).toBeNull(); // null stored
    expect(results[3].explanation).toBeNull(); // undefined → null
  });

  test('each result carries questionIndex, correctAnswer', () => {
    const { results } = gradeAnswers(questions, [0, 2, 1, 3]);
    results.forEach((r, i) => {
      expect(r.questionIndex).toBe(i);
      expect(r.correctAnswer).toBe(questions[i].correctAnswer);
    });
  });
});

// ─── toBandScore ──────────────────────────────────────────────────────────────

describe('toBandScore', () => {
  test('(0, 0) returns 0 — divide-by-zero guard', () => {
    expect(toBandScore(0, 0)).toBe(0);
  });

  test('(0, 10) returns 0', () => {
    expect(toBandScore(0, 10)).toBe(0);
  });

  test('(10, 10) returns 9', () => {
    expect(toBandScore(10, 10)).toBe(9);
  });

  test('rounds to 1 decimal place', () => {
    // 5/9 * 9 = 5.0 exactly
    expect(toBandScore(5, 9)).toBe(5);
    // 1/3 * 9 = 3 → 3.0
    expect(toBandScore(1, 3)).toBe(3);
    // 2/3 * 9 = 6 → 6.0
    expect(toBandScore(2, 3)).toBe(6);
  });

  test('fractional band with 1 decimal place', () => {
    // 7/10 * 9 = 6.3
    expect(toBandScore(7, 10)).toBe(6.3);
  });

  test('negative total treated as ≤0 → 0', () => {
    expect(toBandScore(5, -1)).toBe(0);
  });
});
