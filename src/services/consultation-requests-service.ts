import { prisma } from '@/data/data-sources/postgresql/prisma-client'
import { SpecialistType, ConsultationRequestStatus } from 'generated/prisma/client'
import type { ConsultationRequest, Profile } from 'generated/prisma/client'
import { NotFoundError } from '@/utils/errors/app-errors'
import { createLogger } from '@/utils/functions/logger'
import type {
  ConsultationRequestResponse,
  TCreateConsultationRequestInput,
  TUpdateConsultationRequestStatusInput,
  IConsultationRequestsService,
} from './interfaces/i-consultation-requests-service'

const logger = createLogger('ConsultationRequestsService')

type ConsultationRequestWithOptionalPatient = ConsultationRequest & {
  patient?: Pick<Profile, 'id' | 'firstName' | 'lastName' | 'email'>
}

function mapConsultationRequest(
  request: ConsultationRequestWithOptionalPatient
): ConsultationRequestResponse {
  const base: ConsultationRequestResponse = {
    id: request.id,
    userId: request.patientId,
    specialistType: request.specialistType.toLowerCase(),
    doctorId: request.doctorId,
    description: request.description,
    consentGiven: request.consentGiven,
    status: request.status.toLowerCase(),
    rejectionReason: request.rejectionReason,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  }

  if (request.patient) {
    base.patient = {
      id: request.patient.id,
      firstName: request.patient.firstName,
      lastName: request.patient.lastName,
      email: request.patient.email,
    }
  }

  return base
}

export const consultationRequestsService: IConsultationRequestsService = {
  async createConsultationRequest(
    patientId: string,
    input: TCreateConsultationRequestInput
  ): Promise<ConsultationRequestResponse> {
    const request = await prisma.consultationRequest.create({
      data: {
        patientId,
        specialistType: SpecialistType[input.specialistType.toUpperCase() as keyof typeof SpecialistType],
        description: input.description ?? null,
        doctorId: input.doctorId ?? null,
        consentGiven: input.consentGiven,
      },
    })
    logger.info('Consultation request created', { id: request.id, patientId })
    return mapConsultationRequest(request)
  },

  async getMyConsultationRequests(patientId: string): Promise<ConsultationRequestResponse[]> {
    const requests = await prisma.consultationRequest.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    })
    return requests.map(mapConsultationRequest)
  },

  async getAllConsultationRequests(): Promise<ConsultationRequestResponse[]> {
    const requests = await prisma.consultationRequest.findMany({
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
    })
    return requests.map(mapConsultationRequest)
  },

  async updateConsultationRequestStatus(
    id: string,
    input: TUpdateConsultationRequestStatusInput
  ): Promise<ConsultationRequestResponse> {
    try {
      const updated = await prisma.consultationRequest.update({
        where: { id },
        data: {
          status: ConsultationRequestStatus[input.status.toUpperCase() as keyof typeof ConsultationRequestStatus],
          rejectionReason: input.status === 'rejected' ? (input.rejectionReason ?? null) : null,
        },
      })
      logger.info('Consultation request status updated', { id, status: input.status })
      return mapConsultationRequest(updated)
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2025'
      ) {
        throw new NotFoundError('Consultation request not found', 'errors.consultation_request_not_found')
      }
      throw error
    }
  },

  async acceptConsultationRequest(id: string): Promise<ConsultationRequestResponse> {
    try {
      const updated = await prisma.consultationRequest.update({
        where: { id },
        data: { status: 'ACCEPTED' },
      })
      logger.info('Consultation request accepted', { id })
      return mapConsultationRequest(updated)
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2025'
      ) {
        throw new NotFoundError('Consultation request not found', 'errors.consultation_request_not_found')
      }
      throw error
    }
  },

  async rejectConsultationRequest(
    id: string,
    rejectionReason?: string
  ): Promise<ConsultationRequestResponse> {
    try {
      const updated = await prisma.consultationRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason ?? null,
        },
      })
      logger.info('Consultation request rejected', { id, rejectionReason })
      return mapConsultationRequest(updated)
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2025'
      ) {
        throw new NotFoundError('Consultation request not found', 'errors.consultation_request_not_found')
      }
      throw error
    }
  },
}

export const createConsultationRequest = consultationRequestsService.createConsultationRequest
export const getMyConsultationRequests = consultationRequestsService.getMyConsultationRequests
export const getAllConsultationRequests = consultationRequestsService.getAllConsultationRequests
export const updateConsultationRequestStatus = consultationRequestsService.updateConsultationRequestStatus
export const acceptConsultationRequest = consultationRequestsService.acceptConsultationRequest
export const rejectConsultationRequest = consultationRequestsService.rejectConsultationRequest
