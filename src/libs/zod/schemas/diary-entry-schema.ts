import { z } from 'zod'

export const diaryEntrySchema = z.object({
  date: z.string().min(1, { message: 'Date is required' }),
  painLevel: z
    .number()
    .min(0, { message: 'Pain level must be at least 0' })
    .max(10, { message: 'Pain level must be at most 10' }),
  painLocation: z.string().min(1, { message: 'Location is required' }),
  symptoms: z.string(),
  hadSurgeryLast6Months: z.boolean(),
  surgeryDescription: z.string().optional(),
  hormonalTreatment: z.boolean(),
  recentImaging: z.boolean(),
  cycleDay: z
    .number()
    .int()
    .min(1, { message: 'Cycle day must be at least 1' })
    .max(40, { message: 'Cycle day must be at most 40' })
    .optional()
    .or(z.literal(''))
})

export type TCreateDiaryEntry = z.infer<typeof diaryEntrySchema>
