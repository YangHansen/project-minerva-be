export const normalizeAnswer = (value: unknown) => String(value ?? '').trim().toLowerCase()

export function scoreAnswers(questions: Array<Record<string, any>>, answers: Array<string | number>) {
  let score = 0
  questions.forEach((question, index) => {
    const given = normalizeAnswer(answers[index])
    if (given && given === normalizeAnswer(question.correctAnswer)) score += 1
  })
  return { score, totalQuestions: questions.length }
}
