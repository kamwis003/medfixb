import { z } from 'zod'

export const createConsultationRequestSchema = z.object({
  description: z.string().min(1, { message: 'Description is required' }),
  doctorId: z.string().optional(),
})

export const rejectConsultationRequestSchema = z.object({
  rejectionReason: z.string().optional(),
})

export type TCreateConsultationRequest = z.infer<typeof createConsultationRequestSchema>
export type TRejectConsultationRequest = z.infer<typeof rejectConsultationRequestSchema>
