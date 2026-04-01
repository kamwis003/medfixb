export type DiaryEntryResponse = {
  id: string;
  userId: string;
  date: string;
  painLevel: number;
  painLocation: string;
  symptoms: string;
  hadSurgeryLast6Months: boolean;
  surgeryDescription?: string | null;
  hormonalTreatment: boolean;
  recentImaging: boolean;
  cycleDay?: number | null;
  createdAt: string;
};

export type TCreateDiaryEntryInput = {
  date: string;
  painLevel: number;
  painLocation: string;
  symptoms: string;
  hadSurgeryLast6Months: boolean;
  surgeryDescription?: string;
  hormonalTreatment: boolean;
  recentImaging: boolean;
  cycleDay?: number;
};

export interface IDiaryEntriesService {
  getDiaryEntriesForUserPresentation(userId: string): Promise<DiaryEntryResponse[]>;
  createDiaryEntry(userId: string, input: TCreateDiaryEntryInput): Promise<DiaryEntryResponse>;
}
