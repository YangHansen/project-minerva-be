import { scholarshipSeed } from '../data/scholarships'
import { ieltsSeed } from '../data/ielts'
import { Scholarship } from '../models/Scholarship'
import { IELTSExercise } from '../models/IELTS'

export async function seedScholarships() {
  if (!scholarshipSeed.length) return
  await Scholarship.bulkWrite(
    scholarshipSeed.map((scholarship) => ({
      updateOne: {
        filter: { slug: scholarship.slug },
        update: { $set: scholarship },
        upsert: true,
      },
    })),
  )
}

export async function seedIelts() {
  if (!ieltsSeed.length) return
  await IELTSExercise.bulkWrite(
    ieltsSeed.map((exercise) => ({
      updateOne: {
        filter: { setNumber: exercise.setNumber, order: exercise.order },
        update: { $set: exercise },
        upsert: true,
      },
    })),
  )
}
