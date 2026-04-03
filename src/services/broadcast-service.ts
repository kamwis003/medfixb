import nodemailer from 'nodemailer'
import { prisma } from '@/data/data-sources/postgresql/prisma-client'
import { AppError } from '@/utils/errors/app-errors'
import { createLogger } from '@/utils/functions/logger'
import { env } from '@/config/env'

const logger = createLogger('BroadcastService')

export type BroadcastInput = {
  patientIds: string[]
  subject: string
  body: string
}

export type BroadcastResult = {
  sent: number
  failed: number
}

function createTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new AppError(
      'Email service is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS environment variables.',
      500,
      undefined,
      'errors.email_not_configured'
    )
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  })
}

export async function broadcastEmail(input: BroadcastInput): Promise<BroadcastResult> {
  const { patientIds, subject, body } = input

  const patients = await prisma.profile.findMany({
    where: { id: { in: patientIds }, role: 'USER' },
    select: { id: true, email: true, firstName: true, lastName: true },
  })

  if (patients.length === 0) {
    logger.warn('No patients found for broadcast', { patientIds })
    return { sent: 0, failed: 0 }
  }

  const transporter = createTransporter()
  const from = env.SMTP_FROM ?? env.SMTP_USER

  let sent = 0
  let failed = 0

  await Promise.allSettled(
    patients.map(async (patient) => {
      if (!patient.email) {
        logger.warn('Patient has no email, skipping', { patientId: patient.id })
        failed++
        return
      }

      try {
        await transporter.sendMail({
          from,
          to: patient.email,
          subject,
          text: body,
          html: body.replace(/\n/g, '<br>'),
        })
        logger.info('Broadcast email sent', { patientId: patient.id, email: patient.email })
        sent++
      } catch (error) {
        logger.error('Failed to send broadcast email', { patientId: patient.id, error })
        failed++
      }
    })
  )

  logger.info('Broadcast complete', { sent, failed, total: patients.length })
  return { sent, failed }
}
