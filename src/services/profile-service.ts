import { prisma } from '@/data/data-sources/postgresql/prisma-client'

export async function listProfiles() {
  return prisma.profile.findMany({
    where: { role: 'USER' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: 'desc' }]
  })
}

export async function getProfileById(id: string) {
  return prisma.profile.findUnique({ where: { id } })
}

export async function getDiaryEntriesByUserId(userId: string) {
  return prisma.diaryEntry.findMany({
    where: { userId },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  })
}
