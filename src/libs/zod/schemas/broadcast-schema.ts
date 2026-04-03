import { z } from 'zod'

export const broadcastSchema = z.object({
  patientIds: z.array(z.string()).min(1, { message: 'At least one patientId is required' }),
  subject: z.string().min(1, { message: 'Subject is required' }),
  body: z.string().min(1, { message: 'Body is required' }),
})

export type TBroadcast = z.infer<typeof broadcastSchema>
