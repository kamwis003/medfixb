import { supabase } from '../data/data-sources/supabase/supabase-client'
import { AppError } from '../utils/errors/app-errors'
import { createLogger } from '@/utils/functions/logger'
import {
  ISupabaseStorageService,
  IUploadFileArgs,
  IUploadFileResult,
  IDeleteFileArgs,
  IListFilesArgs,
  IListFilesResult,
  IGetFileUrlArgs,
  IGetFileUrlResult,
  ICreateSignedUrlsArgs,
  ICreateSignedUrlsResult,
  IMoveFileArgs,
  IMoveFileResult,
  IDeleteFolderArgs,
  IDeleteFolderResult,
  ISignedUrlResult,
  ISignedUrlFile,
} from './interfaces/i-supabase-storage-service'

const logger = createLogger('SupabaseStorageService')

export const supabaseStorageService: ISupabaseStorageService = {
  async uploadFile({
    bucketId,
    filePath,
    fileBody,
    options,
  }: IUploadFileArgs): Promise<IUploadFileResult> {
    logger.info('Starting file upload', { bucketId, filePath })

    try {
      const { data, error } = await supabase.storage.from(bucketId).upload(filePath, fileBody, {
        cacheControl: options?.cacheControl,
        contentType: options?.contentType,
        upsert: options?.upsert ?? false,
        ...(options?.metadata && {
          metadata: options.metadata,
        }),
      })

      if (error) {
        logger.error('File upload failed', {
          bucketId,
          filePath,
          error: error.message,
          errorCode: error.name,
        })
        throw new AppError(
          `Failed to upload file: ${error.message}`,
          500,
          { errorCode: error.name },
          'errors.storage_upload_failed'
        )
      }

      if (!data) {
        logger.error('File upload returned no data', { bucketId, filePath })
        throw new AppError(
          'File upload failed - no data returned',
          500,
          undefined,
          'errors.storage_upload_no_data'
        )
      }

      logger.info('File uploaded successfully', {
        bucketId,
        filePath,
        path: data.path,
      })

      return {
        path: data.path,
        bucketId,
        fullPath: data.fullPath,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      logger.error('Unexpected error during file upload', {
        bucketId,
        filePath,
        error,
      })
      throw new AppError('Failed to upload file', 500, undefined, 'errors.storage_upload_failed')
    }
  },

  async deleteFile({ bucketId, filePaths }: IDeleteFileArgs): Promise<void> {
    logger.info('Starting file deletion', {
      bucketId,
      fileCount: filePaths.length,
    })

    try {
      const { data, error } = await supabase.storage.from(bucketId).remove(filePaths)

      if (error) {
        logger.error('File deletion failed', {
          bucketId,
          filePaths,
          error: error.message,
          errorCode: error.name,
        })
        throw new AppError(
          `Failed to delete files: ${error.message}`,
          500,
          { errorCode: error.name },
          'errors.storage_delete_failed'
        )
      }

      logger.info('Files deleted successfully', {
        bucketId,
        deletedCount: data?.length ?? 0,
      })
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      logger.error('Unexpected error during file deletion', {
        bucketId,
        filePaths,
        error,
      })
      throw new AppError('Failed to delete files', 500, undefined, 'errors.storage_delete_failed')
    }
  },

  async listFiles({
    bucketId,
    folderPath = '',
    options,
  }: IListFilesArgs): Promise<IListFilesResult> {
    logger.info('Starting file listing', { bucketId, folderPath })

    try {
      const { data, error } = await supabase.storage.from(bucketId).list(folderPath, {
        limit: options?.limit,
        offset: options?.offset,
        sortBy: options?.sortBy,
        search: options?.search,
      })

      if (error) {
        logger.error('File listing failed', {
          bucketId,
          folderPath,
          error: error.message,
          errorCode: error.name,
        })
        throw new AppError(
          `Failed to list files: ${error.message}`,
          500,
          { errorCode: error.name },
          'errors.storage_list_failed'
        )
      }

      if (!data) {
        logger.error('File listing returned no data', { bucketId, folderPath })
        throw new AppError(
          'File listing failed - no data returned',
          500,
          undefined,
          'errors.storage_list_no_data'
        )
      }

      logger.info('Files listed successfully', {
        bucketId,
        folderPath,
        fileCount: data.length,
      })

      return {
        files: data.map((file) => ({
          name: file.name,
          id: file.id,
          updated_at: file.updated_at,
          created_at: file.created_at,
          last_accessed_at: file.last_accessed_at,
          metadata: file.metadata ?? null,
          bucket_id: file.bucket_id,
          size: typeof file.metadata?.size === 'number' ? file.metadata.size : undefined,
        })),
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      logger.error('Unexpected error during file listing', {
        bucketId,
        folderPath,
        error,
      })
      throw new AppError('Failed to list files', 500, undefined, 'errors.storage_list_failed')
    }
  },

  async getFileUrl({
    bucketId,
    filePath,
    urlType = 'public',
    expiresIn,
    transform,
    download,
  }: IGetFileUrlArgs): Promise<IGetFileUrlResult> {
    logger.info('Starting file URL generation', {
      bucketId,
      filePath,
      urlType,
    })

    try {
      if (urlType === 'signed') {
        if (!expiresIn) {
          logger.error('Signed URL requested without expiresIn', {
            bucketId,
            filePath,
          })
          throw new AppError(
            'expiresIn is required for signed URLs',
            400,
            undefined,
            'errors.storage_signed_url_missing_expiry'
          )
        }

        const { data, error } = await supabase.storage.from(bucketId).createSignedUrl(
          filePath,
          expiresIn,
          transform || download !== undefined
            ? ({
                ...(transform && { transform }),
                ...(download !== undefined && { download }),
                // Type assertion needed: Supabase SDK has stricter types for transform options
                // than what's actually accepted by the API. The options object is compatible.
              } as unknown as Parameters<
                ReturnType<typeof supabase.storage.from>['createSignedUrl']
              >[2])
            : undefined
        )

        if (error) {
          logger.error('Signed URL generation failed', {
            bucketId,
            filePath,
            error: error.message,
            errorCode: error.name,
          })
          throw new AppError(
            `Failed to generate signed URL: ${error.message}`,
            500,
            { errorCode: error.name },
            'errors.storage_signed_url_failed'
          )
        }

        if (!data?.signedUrl) {
          logger.error('Signed URL generation returned no URL', {
            bucketId,
            filePath,
          })
          throw new AppError(
            'Signed URL generation failed - no URL returned',
            500,
            undefined,
            'errors.storage_signed_url_no_data'
          )
        }

        logger.info('Signed URL generated successfully', {
          bucketId,
          filePath,
          expiresIn,
        })

        return { url: data.signedUrl }
      }

      const { data } = supabase.storage.from(bucketId).getPublicUrl(
        filePath,
        transform || download !== undefined
          ? ({
              ...(transform && { transform }),
              ...(download !== undefined && { download }),
              // Type assertion needed: Supabase SDK has stricter types for transform options
              // than what's actually accepted by the API. The options object is compatible.
            } as unknown as Parameters<ReturnType<typeof supabase.storage.from>['getPublicUrl']>[1])
          : undefined
      )

      if (!data?.publicUrl) {
        logger.error('Public URL generation returned no URL', {
          bucketId,
          filePath,
        })
        throw new AppError(
          'Public URL generation failed - no URL returned',
          500,
          undefined,
          'errors.storage_public_url_no_data'
        )
      }

      logger.info('Public URL generated successfully', {
        bucketId,
        filePath,
      })

      return { url: data.publicUrl }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      logger.error('Unexpected error during URL generation', {
        bucketId,
        filePath,
        urlType,
        error,
      })
      throw new AppError('Failed to generate file URL', 500, undefined, 'errors.storage_url_failed')
    }
  },

  async createSignedUrls({
    bucketId,
    filePaths,
    expiresIn,
    download,
  }: ICreateSignedUrlsArgs): Promise<ICreateSignedUrlsResult> {
    logger.info('Starting bulk signed URL creation', {
      bucketId,
      fileCount: filePaths.length,
      expiresIn,
    })

    try {
      const pathsArray: string[] = []
      const transformMap = new Map<string, ISignedUrlFile['transform']>()

      filePaths.forEach((filePathItem) => {
        if (typeof filePathItem === 'string') {
          pathsArray.push(filePathItem)
        } else {
          pathsArray.push(filePathItem.path)
          if (filePathItem.transform) {
            transformMap.set(filePathItem.path, filePathItem.transform)
          }
        }
      })

      const { data, error } = await supabase.storage.from(bucketId).createSignedUrls(
        pathsArray,
        expiresIn,
        download !== undefined
          ? ({
              download,
              // Type assertion needed: Supabase SDK has stricter types for the download option
              // than what's actually accepted by the API. The options object is compatible.
            } as unknown as Parameters<
              ReturnType<typeof supabase.storage.from>['createSignedUrls']
            >[2])
          : undefined
      )

      if (error) {
        logger.error('Bulk signed URL creation failed', {
          bucketId,
          fileCount: pathsArray.length,
          error: error.message,
          errorCode: error.name,
        })
        throw new AppError(
          `Failed to create signed URLs: ${error.message}`,
          500,
          { errorCode: error.name },
          'errors.storage_signed_urls_failed'
        )
      }

      if (!data) {
        logger.error('Bulk signed URL creation returned no data', {
          bucketId,
          fileCount: pathsArray.length,
        })
        throw new AppError(
          'Signed URLs creation failed - no data returned',
          500,
          undefined,
          'errors.storage_signed_urls_no_data'
        )
      }

      const urls: ISignedUrlResult[] = data.map((item) => {
        if (item.error) {
          return {
            path: item.path ?? '',
            signedUrl: '',
            error: item.error,
          }
        }

        return {
          path: item.path ?? '',
          signedUrl: item.signedUrl ?? '',
        }
      })

      const successCount = urls.filter((url) => !url.error).length
      const errorCount = urls.filter((url) => url.error).length

      logger.info('Bulk signed URLs created', {
        bucketId,
        total: urls.length,
        successful: successCount,
        failed: errorCount,
      })

      return { urls }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      logger.error('Unexpected error during bulk signed URL creation', {
        bucketId,
        fileCount: filePaths.length,
        error,
      })
      throw new AppError(
        'Failed to create signed URLs',
        500,
        undefined,
        'errors.storage_signed_urls_failed'
      )
    }
  },

  async moveFile({ bucketId, fromPath, toPath }: IMoveFileArgs): Promise<IMoveFileResult> {
    logger.info('Starting file move', { bucketId, fromPath, toPath })

    try {
      const { data, error } = await supabase.storage.from(bucketId).move(fromPath, toPath)

      if (error) {
        logger.error('File move failed', {
          bucketId,
          fromPath,
          toPath,
          error: error.message,
          errorCode: error.name,
        })
        throw new AppError(
          `Failed to move file: ${error.message}`,
          500,
          { errorCode: error.name },
          'errors.storage_move_failed'
        )
      }

      logger.info('File moved successfully', {
        bucketId,
        fromPath,
        toPath,
        newPath: data?.message,
      })

      return {
        message: `File moved from ${fromPath} to ${toPath}`,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      logger.error('Unexpected error during file move', {
        bucketId,
        fromPath,
        toPath,
        error,
      })
      throw new AppError('Failed to move file', 500, undefined, 'errors.storage_move_failed')
    }
  },

  async deleteFolder({ bucketId, folderPath }: IDeleteFolderArgs): Promise<IDeleteFolderResult> {
    logger.info('Starting folder deletion', { bucketId, folderPath })

    try {
      const { data: files, error: listError } = await supabase.storage
        .from(bucketId)
        .list(folderPath, {
          limit: 1000,
        })

      if (listError) {
        logger.error('Failed to list files in folder for deletion', {
          bucketId,
          folderPath,
          error: listError.message,
          errorCode: listError.name,
        })
        throw new AppError(
          `Failed to list files in folder: ${listError.message}`,
          500,
          { errorCode: listError.name },
          'errors.storage_folder_list_failed'
        )
      }

      if (!files || files.length === 0) {
        logger.info('Folder is empty or does not exist', {
          bucketId,
          folderPath,
        })
        return {
          filesDeleted: 0,
          message: 'Folder is empty or does not exist',
        }
      }

      const filePaths = files.map((file) => {
        const normalizedFolderPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`
        return `${normalizedFolderPath}${file.name}`
      })

      const { error: deleteError } = await supabase.storage.from(bucketId).remove(filePaths)

      if (deleteError) {
        logger.error('Failed to delete files in folder', {
          bucketId,
          folderPath,
          fileCount: filePaths.length,
          error: deleteError.message,
          errorCode: deleteError.name,
        })
        throw new AppError(
          `Failed to delete folder contents: ${deleteError.message}`,
          500,
          { errorCode: deleteError.name },
          'errors.storage_folder_delete_failed'
        )
      }

      logger.info('Folder deleted successfully', {
        bucketId,
        folderPath,
        filesDeleted: filePaths.length,
      })

      return {
        filesDeleted: filePaths.length,
        message: `Deleted ${filePaths.length} file(s) from folder ${folderPath}`,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      logger.error('Unexpected error during folder deletion', {
        bucketId,
        folderPath,
        error,
      })
      throw new AppError(
        'Failed to delete folder',
        500,
        undefined,
        'errors.storage_folder_delete_failed'
      )
    }
  },
}
