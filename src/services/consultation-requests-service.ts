import { prisma } from '@/data/data-sources/postgresql/prisma-client'
import type { ConsultationRequest } from 'generated/prisma/client'
import { NotFoundError } from '@/utils/errors/app-errors'
import { createLogger } from '@/utils/functions/logger'
import type {
  ConsultationRequestResponse,
  TCreateConsultationRequestInput,
  IConsultationRequestsService,
} from './interfaces/i-consultation-requests-service'

const logger = createLogger('ConsultationRequestsService')

function mapConsultationRequest(request: ConsultationRequest): ConsultationRequestResponse {
  return {
    id: request.id,
    patientId: request.patientId,
    doctorId: request.doctorId,
    description: request.description,
    status: request.status,
    rejectionReason: request.rejectionReason,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  }
}

export const consultationRequestsService: IConsultationRequestsService = {
  async createConsultationRequest(
    patientId: string,
    input: TCreateConsultationRequestInput
  ): Promise<ConsultationRequestResponse> {
    const request = await prisma.consultationRequest.create({
      data: {
        patientId,
        description: input.description,
        doctorId: input.doctorId ?? null,
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
      orderBy: { createdAt: 'desc' },
    })
    return requests.map(mapConsultationRequest)
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
export const acceptConsultationRequest = consultationRequestsService.acceptConsultationRequest
export const rejectConsultationRequest = consultationRequestsService.rejectConsultationRequest
