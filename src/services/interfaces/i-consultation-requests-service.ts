export type ConsultationRequestPatient = {
  id: string
  firstName: string
  lastName: string
  email: string | null
}

export type ConsultationRequestResponse = {
  id: string
  userId: string
  specialistType: string
  doctorId: string | null
  description: string | null
  consentGiven: boolean
  status: string
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
  patient?: ConsultationRequestPatient
}

export type TCreateConsultationRequestInput = {
  specialistType: string
  doctorId?: string
  description?: string
  consentGiven: boolean
}

export type TUpdateConsultationRequestStatusInput = {
  status: 'accepted' | 'rejected'
  rejectionReason?: string
}

export interface IConsultationRequestsService {
  createConsultationRequest(
    patientId: string,
    input: TCreateConsultationRequestInput
  ): Promise<ConsultationRequestResponse>
  getMyConsultationRequests(patientId: string): Promise<ConsultationRequestResponse[]>
  getAllConsultationRequests(): Promise<ConsultationRequestResponse[]>
  updateConsultationRequestStatus(
    id: string,
    input: TUpdateConsultationRequestStatusInput
  ): Promise<ConsultationRequestResponse>
  acceptConsultationRequest(id: string): Promise<ConsultationRequestResponse>
  rejectConsultationRequest(
    id: string,
    rejectionReason?: string
  ): Promise<ConsultationRequestResponse>
}
