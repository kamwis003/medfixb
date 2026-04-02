import type { ConsultationRequestStatus } from 'generated/prisma/client'

export type ConsultationRequestResponse = {
  id: string
  patientId: string
  doctorId: string | null
  description: string
  status: ConsultationRequestStatus
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
}

export type TCreateConsultationRequestInput = {
  description: string
  doctorId?: string
}

export interface IConsultationRequestsService {
  createConsultationRequest(
    patientId: string,
    input: TCreateConsultationRequestInput
  ): Promise<ConsultationRequestResponse>
  getMyConsultationRequests(patientId: string): Promise<ConsultationRequestResponse[]>
  getAllConsultationRequests(): Promise<ConsultationRequestResponse[]>
  acceptConsultationRequest(id: string): Promise<ConsultationRequestResponse>
  rejectConsultationRequest(
    id: string,
    rejectionReason?: string
  ): Promise<ConsultationRequestResponse>
}
