import { prisma } from '@/data/data-sources/postgresql/prisma-client'
import type { DiaryEntry } from 'generated/prisma/client'
import type {
  DiaryEntryResponse,
  TCreateDiaryEntryInput,
  IDiaryEntriesService,
} from './interfaces/i-diary-entries-service'

export function mapDiaryEntry(entry: DiaryEntry): DiaryEntryResponse {
  return {
    id: entry.id,
    userId: entry.userId,
    date: entry.date.toISOString().split('T')[0],
    painLevel: entry.painLevel,
    painLocation: entry.painLocation,
    symptoms: entry.symptoms,
    hadSurgeryLast6Months: entry.hadSurgeryLast6Months,
    surgeryDescription: entry.surgeryDescription ?? null,
    hormonalTreatment: entry.hormonalTreatment,
    recentImaging: entry.recentImaging,
    cycleDay: entry.cycleDay ?? null,
    createdAt: entry.createdAt.toISOString(),
  }
}

export const diaryEntriesService: IDiaryEntriesService = {
  async getDiaryEntriesForUserPresentation(userId: string): Promise<DiaryEntryResponse[]> {
    const entries = await prisma.diaryEntry.findMany({
      where: { userId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })
    return entries.map(mapDiaryEntry)
  },

    async createDiaryEntry(userId: string, input: TCreateDiaryEntryInput): Promise<DiaryEntryResponse> {
    const dateObj = new Date(input.date + 'T00:00:00Z');

    const existing = await prisma.diaryEntry.findFirst({
      where: {
        userId,
        date: dateObj,
      },
    });

    const data = {
      userId,
      date: dateObj,
      painLevel: input.painLevel,
      painLocation: input.painLocation,
      symptoms: input.symptoms,
      hadSurgeryLast6Months: input.hadSurgeryLast6Months,
      surgeryDescription: input.hadSurgeryLast6Months && input.surgeryDescription
        ? input.surgeryDescription
        : null,
      hormonalTreatment: input.hormonalTreatment,
      recentImaging: input.recentImaging,
      cycleDay: typeof input.cycleDay === 'number' && input.cycleDay > 0
        ? input.cycleDay
        : null,
    };

    let entry: DiaryEntry;
    if (existing) {
      entry = await prisma.diaryEntry.update({
        where: { id: existing.id },
        data,
      });
    } else {
      entry = await prisma.diaryEntry.create({ data });
    }
    return mapDiaryEntry(entry);
  },
};
export const getDiaryEntriesForUserPresentation = diaryEntriesService.getDiaryEntriesForUserPresentation;
export const createDiaryEntry = diaryEntriesService.createDiaryEntry;
