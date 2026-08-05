import { UserProfile } from '../models/UserProfile'
import { Shortlist } from '../models/Shortlist'
import { Scholarship } from '../models/Scholarship'
import { User } from '../models/User'
import { getResend } from './resend'

const DAY_MS = 86_400_000

const STAGES = [
  { stage: '3_days', days: 3 },
  { stage: '7_days', days: 7 },
  { stage: '14_days', days: 14 },
  { stage: '30_days', days: 30 }
] as const

export type ReminderStage = (typeof STAGES)[number]['stage']

export function reminderStageFor(daysRemaining: number, notifiedStages: string[]): ReminderStage | null {
  if (daysRemaining < 0) return null
  for (const { stage, days } of STAGES) {
    if (daysRemaining <= days && !notifiedStages.includes(stage)) return stage
  }
  return null
}

/**
 * Scans shortlists with upcoming scholarship deadlines and emails one reminder
 * stage per shortlist (most urgent un-sent). Safe to call manually for testing.
 */
export async function scanAndSendReminders(): Promise<number> {
  const profiles = await UserProfile.find({ emailNotificationsEnabled: true })
  let sent = 0

  for (const profile of profiles) {
    const shortlists = await Shortlist.find({ userId: profile.userId })
    if (shortlists.length === 0) continue

    const scholarships = await Scholarship.find({ _id: { $in: shortlists.map((s) => s.scholarshipId) } })
    const byId = new Map(scholarships.map((s) => [String(s._id), s]))

    for (const shortlist of shortlists) {
      const scholarship = byId.get(String(shortlist.scholarshipId))
      if (!scholarship?.deadline || scholarship.deadline <= new Date()) continue

      const daysRemaining = Math.max(0, Math.floor((scholarship.deadline.getTime() - Date.now()) / DAY_MS))
      const stage = reminderStageFor(daysRemaining, shortlist.notifiedStages ?? [])
      if (!stage) continue

      try {
        const user = await User.findById(profile.userId)
        if (!user?.email) continue
        await getResend().emails.send({
          from: 'Project Minerva <onboarding@resend.dev>',
          to: user.email,
          subject: `Scholarship reminder: ${scholarship.name} closes in ${daysRemaining} days`,
          text:
            `Hi ${profile.name ?? 'there'},\n\n` +
            `Your shortlisted scholarship "${scholarship.name}" closes in ${daysRemaining} day(s), ` +
            `on ${scholarship.deadline.toISOString().slice(0, 10)}.\n\n` +
            (scholarship.applicationLink ? `Apply here: ${scholarship.applicationLink}\n\n` : '') +
            'Good luck!\nProject Minerva'
        })
        shortlist.notifiedStages.push(stage)
        await shortlist.save()
        sent += 1
      } catch (err) {
        console.error(`[reminder] failed for shortlist ${shortlist._id}:`, err)
      }
    }
  }

  return sent
}
