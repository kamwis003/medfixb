import { z } from 'zod'

export const updateUserProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'First name is required' })
    .max(100, { message: 'First name must be at most 100 characters' }),
  lastName: z
    .string()
    .min(1, { message: 'Last name is required' })
    .max(100, { message: 'Last name must be at most 100 characters' }),
})

export type TUpdateUserProfile = z.infer<typeof updateUserProfileSchema>
