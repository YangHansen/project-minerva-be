import { scholarshipSeed } from '../data/scholarships'
import { Scholarship } from '../models/Scholarship'

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
