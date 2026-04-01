import { Profile } from '../../../generated/prisma/client'

export interface IUserService {
  getUser: (userId: string) => Promise<Profile>
  updateUserProfile: (userId: string, firstName: string, lastName: string) => Promise<Profile>
  deleteUser: (userId: string) => Promise<void>
}
