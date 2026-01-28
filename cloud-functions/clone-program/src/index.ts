import express from 'express'
import { PrismaClient } from '@prisma/client'
import { ProgramCloneJob, cloneStrengthProgramData, cloneCardioProgramData } from './cloning'

const app = express()
app.use(express.json({ limit: '1mb' }))

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
})

/**
 * Eventarc delivers Pub/Sub messages as HTTP POST to /
 * Message format: { message: { data: base64EncodedJSON } }
 */
app.post('/', async (req, res) => {
  const message = req.body.message

  if (!message || !message.data) {
    console.error('Bad request: missing message or message.data')
    res.status(400).send('Bad Request: missing message')
    return
  }

  let job: ProgramCloneJob
  try {
    const data = Buffer.from(message.data, 'base64').toString()
    job = JSON.parse(data)
  } catch (parseError) {
    console.error('Failed to parse message:', parseError)
    res.status(400).send('Bad Request: invalid message payload')
    return
  }

  if (!job.communityProgramId || !job.programId || !job.userId || !job.programType) {
    console.error('Invalid job payload:', job)
    res.status(400).send('Bad Request: missing required job fields')
    return
  }

  console.log(`Processing clone job: communityProgramId=${job.communityProgramId} programId=${job.programId} type=${job.programType}`)

  try {
    // Fetch programData from CommunityProgram table
    const communityProgram = await prisma.communityProgram.findUnique({
      where: { id: job.communityProgramId },
      select: { programData: true },
    })

    if (!communityProgram || !communityProgram.programData) {
      console.error(`Community program not found or has no data: ${job.communityProgramId}`)
      res.status(400).send('Bad Request: invalid community program')
      return
    }

    const programData = communityProgram.programData as any

    if (job.programType === 'cardio') {
      await cloneCardioProgramData(prisma, job.programId, programData, job.userId)
    } else {
      await cloneStrengthProgramData(prisma, job.programId, programData, job.userId)
    }

    console.log(`Clone job completed: programId=${job.programId}`)
    res.status(200).send('OK')
  } catch (error) {
    console.error(`Clone job failed for programId=${job.programId}:`, error)

    // Mark the shell program as failed so the frontend can report it
    try {
      if (job.programType === 'cardio') {
        await prisma.cardioProgram.update({
          where: { id: job.programId },
          data: { copyStatus: 'failed' },
        })
      } else {
        await prisma.program.update({
          where: { id: job.programId },
          data: { copyStatus: 'failed' },
        })
      }
    } catch (statusError) {
      console.error('Failed to update copyStatus to failed:', statusError)
    }

    // Return 500 so Pub/Sub retries the message
    res.status(500).send('Error processing clone job')
  }
})

// Health check for Cloud Run
app.get('/', (req, res) => {
  res.status(200).send('OK')
})

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`Clone worker listening on port ${port}`))
