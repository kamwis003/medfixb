import { z } from 'zod'

export const specialistTypeSchema = z.enum(['gynecologist', 'fertility_specialist', 'endocrinologist'])

export const createConsultationRequestSchema = z.object({
  specialistType: specialistTypeSchema,
  doctorId: z.string().optional(),
  description: z.string().optional(),
  consentGiven: z.boolean(),
})

export const rejectConsultationRequestSchema = z.object({
  rejectionReason: z.string().optional(),
})

export const updateConsultationRequestStatusSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
  rejectionReason: z.string().optional(),
})

export type TCreateConsultationRequest = z.infer<typeof createConsultationRequestSchema>
export type TRejectConsultationRequest = z.infer<typeof rejectConsultationRequestSchema>
export type TUpdateConsultationRequestStatus = z.infer<typeof updateConsultationRequestStatusSchema>
