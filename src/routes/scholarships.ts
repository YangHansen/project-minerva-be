import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { isValidObjectId } from 'mongoose'
import { Scholarship } from '../models/Scholarship'
import { UserProfile } from '../models/UserProfile'
import { User } from '../models/User'
import { Document } from '../models/Document'
import { getSupabase } from '../lib/supabase'
import { buildHardFilter, rankByPreference } from '../lib/matching'
import { getAiRecommendations } from '../lib/cvRecommender'
import { getConfig } from '../config'
import { Shortlist, buildChecklistItems } from '../models/Shortlist'

// Inline per Elysia/TS limitation: imported t.Object response schemas break handler return inference
const shortlistResponse = t.Object({
  success: t.Boolean(),
  message: t.String(),
  shortlist: t.Object({
    _id: t.String(),
    userId: t.String(),
    scholarshipId: t.String(),
    status: t.String(),
    notifiedStages: t.Array(t.String()),
    items: t.Array(
      t.Object({
        _id: t.String(),
        itemType: t.String(),
        isCompleted: t.Boolean(),
        documentId: t.Nullable(t.String())
      })
    ),
    createdAt: t.String(),
    updatedAt: t.String(),
    __v: t.Number()
  })
})

// List fields only (shared by catalog and recommendation wrappers)
function toListFields(doc: InstanceType<typeof Scholarship>) {
  return {
    id: String(doc._id),
    name: doc.name,
    provider: doc.provider,
    country: doc.country,
    university: (doc as unknown as Record<string, unknown>)['university'] ?? undefined,
    educationLevel: doc.educationLevel ?? undefined,
    fieldOfStudy: doc.fieldOfStudy,
    fundingType: doc.fundingType,
    deadline: doc.deadline
  }
}

export const scholarshipRoutes = new Elysia({ prefix: '/api/scholarships' })
  .use(jwt({ name: 'jwt', secret: getConfig().jwtSecret }))
  .derive(async ({ headers, jwt, set }) => {
    const token = headers.authorization?.replace('Bearer ', '')
    const verified = token ? await jwt.verify(token) : false
    const sub = verified && typeof verified !== 'boolean' ? verified.sub : null
    if (!sub) {
      set.status = 401
      throw new Error('Unauthorized')
    }
    return { userId: sub as string }
  })

  // ── GET /api/scholarships ────────────────────────────────────────────────────
  .get(
    '/',
    async ({ query }) => {
      const filter: Record<string, unknown> = {}

      if (query.search) {
        const rx = new RegExp(query.search, 'i')
        filter['$or'] = [{ name: rx }, { provider: rx }, { university: rx }]
      }
      if (query.country)        filter['country']        = new RegExp(`^${query.country}$`, 'i')
      if (query.educationLevel) filter['educationLevel'] = new RegExp(`^${query.educationLevel}$`, 'i')
      if (query.fieldOfStudy)   filter['fieldOfStudy']   = new RegExp(`^${query.fieldOfStudy}$`, 'i')
      if (query.fundingType)    filter['fundingType']    = query.fundingType

      const scholarships = await Scholarship.find(filter).sort({ deadline: 1 })
      return {
        success: true,
        scholarships: scholarships.map(toListFields)
      }
    },
    {
      query: t.Object({
        search:         t.Optional(t.String()),
        country:        t.Optional(t.String()),
        educationLevel: t.Optional(t.String()),
        fieldOfStudy:   t.Optional(t.String()),
        fundingType:    t.Optional(t.String())
      })
    }
  )

  // ── GET /api/scholarships/recommendations ────────────────────────────────────
  .get('/recommendations', async ({ userId }) => {
    const profile = await UserProfile.findOne({ userId })

    const hardFilter = profile ? buildHardFilter({
      targetEducationLevel: profile.targetEducationLevel,
      fieldOfStudy: profile.fieldOfStudy
    }) : null

    if (!hardFilter) {
      return {
        success: true,
        recommendations: [],
        message: 'Lengkapi profil onboarding Anda terlebih dahulu untuk mendapatkan rekomendasi.'
      }
    }

    const candidates = await Scholarship.find(hardFilter).sort({ deadline: 1 })

    const matchProfile = {
      destinationCountry: profile?.destinationCountry,
      fundingPreference: profile?.fundingPreference
    }

    const ranked = candidates
      .map((sch) => {
        const { matchScore, reasoning } = rankByPreference(matchProfile, {
          country: sch.country,
          fundingType: sch.fundingType,
          deadline: sch.deadline
        })
        return { sch, matchScore, reasoning }
      })
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
        return (a.sch.deadline?.getTime() ?? 0) - (b.sch.deadline?.getTime() ?? 0)
      })
      .slice(0, 5)

    return {
      success: true,
      recommendations: ranked.map(({ sch, matchScore, reasoning }) => ({
        scholarship: {
          id: String(sch._id),
          name: sch.name,
          provider: sch.provider,
          country: sch.country,
          educationLevel: sch.educationLevel ?? undefined,
          fundingType: sch.fundingType,
          deadline: sch.deadline
        },
        matchScore,
        reasoning
      }))
    }
  })

  // ── GET /api/scholarships/recommendations/ai ─────────────────────────────────
  .get('/recommendations/ai', async ({ userId, set }) => {
    const config = getConfig()

    // Gate: require profile fields
    const profile = await UserProfile.findOne({ userId })
    const hardFilter = profile ? buildHardFilter({
      targetEducationLevel: profile.targetEducationLevel,
      fieldOfStudy: profile.fieldOfStudy
    }) : null

    if (!hardFilter) {
      set.status = 400
      throw new Error('Complete your profile first')
    }

    // Require API key before any I/O
    if (!config.openaiApiKey) {
      set.status = 503
      throw new Error('AI recommendation is unavailable')
    }

    // Build candidates (≤ 20, nearest deadline)
    const candidates = await Scholarship.find(hardFilter).sort({ deadline: 1 }).limit(20)

    if (candidates.length === 0) {
      return { success: true, recommendations: [] }
    }

    // Find latest CV
    const cvDoc = await Document.findOne({ userId, documentType: 'cv' }).sort({ createdAt: -1 })

    if (!cvDoc) {
      set.status = 400
      throw new Error('Unggah CV terlebih dahulu untuk rekomendasi berbasis CV')
    }

    if (!cvDoc.fileType.includes('pdf') && cvDoc.fileType !== 'application/pdf') {
      set.status = 400
      throw new Error('CV harus berupa file PDF')
    }

    // Download from Supabase (service-role client — private bucket)
    const { data: downloadData, error: downloadError } = await getSupabase()
      .storage.from('documents').download(cvDoc.fileUrl)

    if (downloadError || !downloadData) {
      set.status = 502
      throw new Error('Failed to download CV')
    }

    const pdfBytes = await downloadData.arrayBuffer()

    const cvProfile = {
      targetEducationLevel: profile?.targetEducationLevel,
      fieldOfStudy: profile?.fieldOfStudy,
      destinationCountry: profile?.destinationCountry,
      fundingPreference: profile?.fundingPreference
    }

    const cvCandidates = candidates.map((sch) => ({
      id: String(sch._id),
      name: sch.name,
      country: sch.country,
      educationLevel: sch.educationLevel ?? undefined,
      fundingType: sch.fundingType,
      deadline: sch.deadline
    }))

    let aiResults
    try {
      aiResults = await getAiRecommendations(pdfBytes, cvProfile, cvCandidates, config.openaiApiKey)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('upload failed') || msg.includes('file upload')) {
        set.status = 502
        throw new Error('Failed to upload CV')
      }
      set.status = 502
      throw new Error('AI recommendation failed')
    }

    return {
      success: true,
      recommendations: aiResults.map(({ scholarship, matchScore, reasoning }) => ({
        scholarship,
        matchScore,
        reasoning
      }))
    }
  })

  // ── GET /api/scholarships/:id ────────────────────────────────────────────────
  .get('/:id', async ({ params, set }) => {
    if (!isValidObjectId(params.id)) {
      set.status = 400
      throw new Error('Invalid scholarship id')
    }
    const scholarship = await Scholarship.findById(params.id)
    if (!scholarship) {
      set.status = 404
      throw new Error('Scholarship not found')
    }
    return { success: true, scholarship }
  })

  // ── POST /api/scholarships/:id/shortlist ────────────────────────────────────
  .post(
    '/:id/shortlist',
    async ({ params, body, userId, set }) => {
      if (!isValidObjectId(params.id)) {
        set.status = 400
        throw new Error('Invalid scholarship id')
      }
      const scholarship = await Scholarship.findById(params.id)
      if (!scholarship) {
        set.status = 404
        throw new Error('Scholarship not found')
      }
      const existing = await Shortlist.findOne({ userId, scholarshipId: params.id })
      if (existing) {
        return {
          success: true,
          message: 'Scholarship already in shortlist',
          shortlist: JSON.parse(JSON.stringify(existing))
        }
      }
      const shortlist = await Shortlist.create({
        userId,
        scholarshipId: params.id,
        status: body.status ?? 'saved',
        items: buildChecklistItems(scholarship.requiredDocuments)
      })
      set.status = 201
      return {
        success: true,
        message: 'Scholarship added to shortlist',
        shortlist: JSON.parse(JSON.stringify(shortlist))
      }
    },
    {
      body: t.Object({
        status: t.Optional(t.Union([t.Literal('saved'), t.Literal('preparing')]))
      }),
      response: shortlistResponse,
      detail: {
        tags: ['Scholarships'],
        security: [{ bearerAuth: [] }],
        summary: 'Simpan beasiswa ke shortlist',
        description: 'Menyimpan beasiswa ke shortlist pengguna dan otomatis membuat checklist items dari requiredDocuments beasiswa. Idempotent: mengembalikan shortlist yang sudah ada tanpa duplikasi.'
      }
    }
  )

  // ── POST /api/scholarships (admin only) ──────────────────────────────────────
  .post(
    '/',
    async ({ body, userId, set }) => {
      const user = await User.findById(userId)
      if (!user || user.role !== 'admin') {
        set.status = 403
        throw new Error('Forbidden')
      }
      await Scholarship.create(body)
      set.status = 201
      return { success: true, message: 'Scholarship added successfully' }
    },
    {
      body: t.Object({
        name:                       t.String(),
        provider:                   t.String(),
        country:                    t.String(),
        university:                 t.Optional(t.String()),
        program:                    t.Optional(t.String()),
        educationLevel:             t.Optional(t.String()),
        fieldOfStudy:               t.String(),
        fundingType:                t.Union([
          t.Literal('fully_funded'),
          t.Literal('partially_funded'),
          t.Literal('self_funded')
        ]),
        deadline:                   t.String(),
        minGpa:                     t.Optional(t.Number()),
        minIeltsScore:              t.Optional(t.Number()),
        minToeflScore:              t.Optional(t.Number()),
        minTopikScore:              t.Optional(t.Number()),
        minWorkExperienceYears:     t.Optional(t.Number()),
        eligibilityRequirements:    t.Optional(t.String()),
        applicationLink:            t.Optional(t.String()),
        requiredDocuments:          t.Optional(t.Array(t.String())),
        apostilleRequired:          t.Optional(t.Boolean()),
        submissionMethod:           t.Optional(t.Union([
          t.Literal('online'),
          t.Literal('postal'),
          t.Literal('both')
        ])),
        documentSubmissionGuidelines: t.Optional(t.String()),
        coreValues:                 t.Optional(t.Array(t.String()))
      })
    }
  )
