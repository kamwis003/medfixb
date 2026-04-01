/**
 * File upload data types supported by Supabase Storage
 */
export type FileBody = File | Buffer | Blob | Uint8Array

/**
 * Image transformation options for getFileUrl
 * Used to resize, crop, and optimize images on-the-fly
 */
export interface ITransformOptions {
  /** Width in pixels */
  width?: number
  /** Height in pixels */
  height?: number
  /** Resize mode: 'cover' | 'contain' | 'fill' */
  resize?: 'cover' | 'contain' | 'fill'
  /** Image quality (1-100) */
  quality?: number
  /** Output format: 'origin' | 'webp' | 'avif' */
  format?: 'origin' | 'webp' | 'avif'
}

/**
 * Options for file upload operations
 */
export interface IFileOptions {
  /** Cache control header value (e.g., '3600', 'max-age=3600') */
  cacheControl?: string
  /** Content type / MIME type (e.g., 'image/png', 'application/pdf') */
  contentType?: string
  /** Whether to overwrite existing file (default: false) */
  upsert?: boolean
  /** Custom metadata as key-value pairs */
  metadata?: Record<string, string>
}

/**
 * Arguments for uploading a file to storage
 */
export interface IUploadFileArgs {
  /** Name of the storage bucket */
  bucketId: string
  /** Path where file will be stored (e.g., 'folder/file.txt') */
  filePath: string
  /** File content to upload */
  fileBody: FileBody
  /** Optional upload configuration */
  options?: IFileOptions
}

/**
 * Result returned after successful file upload
 */
export interface IUploadFileResult {
  /** Full path to the uploaded file */
  path: string
  /** Bucket ID where file was uploaded */
  bucketId: string
  /** Full URL path to the file */
  fullPath: string
}

/**
 * Arguments for deleting files from storage
 */
export interface IDeleteFileArgs {
  /** Name of the storage bucket */
  bucketId: string
  /** Array of file paths to delete */
  filePaths: string[]
}

/**
 * Individual file object returned by list operation
 */
export interface IFileObject {
  /** File name */
  name: string
  /** Full path to the file */
  id: string
  /** Timestamp when file was last updated */
  updated_at: string
  /** Timestamp when file was created */
  created_at: string
  /** Timestamp of last access (may be null) */
  last_accessed_at: string | null
  /** File metadata */
  metadata: Record<string, unknown> | null
  /** Bucket ID */
  bucket_id?: string
  /** File size in bytes (present for files, null for folders) */
  size?: number
}

/**
 * Options for listing files in a bucket
 */
export interface IListFilesOptions {
  /** Maximum number of files to return (default: 100) */
  limit?: number
  /** Number of files to skip for pagination */
  offset?: number
  /** Sort by column (e.g., 'name', 'created_at', 'updated_at') */
  sortBy?: {
    column?: string
    order?: 'asc' | 'desc'
  }
  /** Search query to filter files by name */
  search?: string
}

/**
 * Arguments for listing files in a bucket
 */
export interface IListFilesArgs {
  /** Name of the storage bucket */
  bucketId: string
  /** Folder path to list files from (default: root '') */
  folderPath?: string
  /** Optional listing configuration */
  options?: IListFilesOptions
}

/**
 * Result returned when listing files
 */
export interface IListFilesResult {
  /** Array of file objects */
  files: IFileObject[]
}

/**
 * URL type for file access
 */
export type UrlType = 'public' | 'signed'

/**
 * Arguments for getting a file URL
 */
export interface IGetFileUrlArgs {
  /** Name of the storage bucket */
  bucketId: string
  /** Path to the file */
  filePath: string
  /** Type of URL to generate: 'public' or 'signed' (default: 'public') */
  urlType?: UrlType
  /** Expiration time in seconds (required for signed URLs, e.g., 3600 for 1 hour) */
  expiresIn?: number
  /** Optional image transformation options */
  transform?: ITransformOptions
  /** Download file instead of viewing inline (signed URLs only) */
  download?: boolean | string
}

/**
 * Result returned when getting a file URL
 */
export interface IGetFileUrlResult {
  /** Generated URL for file access */
  url: string
}

/**
 * Individual file path for bulk signed URL creation
 */
export interface ISignedUrlFile {
  /** Path to the file */
  path: string
  /** Optional transformation options for this specific file */
  transform?: ITransformOptions
}

/**
 * Arguments for creating multiple signed URLs
 */
export interface ICreateSignedUrlsArgs {
  /** Name of the storage bucket */
  bucketId: string
  /** Array of file paths or file objects with transform options */
  filePaths: string[] | ISignedUrlFile[]
  /** Expiration time in seconds (e.g., 3600 for 1 hour) */
  expiresIn: number
  /** Download files instead of viewing inline */
  download?: boolean | string
}

/**
 * Individual signed URL result
 */
export interface ISignedUrlResult {
  /** File path */
  path: string
  /** Generated signed URL */
  signedUrl: string
  /** Error message if URL generation failed */
  error?: string
}

/**
 * Result returned when creating multiple signed URLs
 */
export interface ICreateSignedUrlsResult {
  /** Array of signed URL results */
  urls: ISignedUrlResult[]
}

/**
 * Arguments for moving/renaming a file
 */
export interface IMoveFileArgs {
  /** Name of the storage bucket */
  bucketId: string
  /** Current path of the file */
  fromPath: string
  /** New path for the file */
  toPath: string
}

/**
 * Result returned after moving a file
 */
export interface IMoveFileResult {
  /** Message confirming the move operation */
  message: string
}

/**
 * Arguments for deleting a folder and its contents
 */
export interface IDeleteFolderArgs {
  /** Name of the storage bucket */
  bucketId: string
  /** Path to the folder to delete */
  folderPath: string
}

/**
 * Result returned after deleting a folder
 */
export interface IDeleteFolderResult {
  /** Number of files deleted */
  filesDeleted: number
  /** Message confirming the deletion */
  message: string
}

/**
 * Main interface for Supabase Storage Service
 * Provides methods for file upload, download, deletion, and URL generation
 */
export interface ISupabaseStorageService {
  /**
   * Upload a file to a storage bucket
   * @param args - Upload configuration including bucket, path, and file content
   * @returns Promise with upload result containing file path and URL
   */
  uploadFile(args: IUploadFileArgs): Promise<IUploadFileResult>

  /**
   * Delete one or more files from a storage bucket
   * @param args - Deletion configuration including bucket and file paths
   * @returns Promise that resolves when files are deleted
   */
  deleteFile(args: IDeleteFileArgs): Promise<void>

  /**
   * List files in a storage bucket folder
   * @param args - List configuration including bucket, folder path, and options
   * @returns Promise with array of file objects
   */
  listFiles(args: IListFilesArgs): Promise<IListFilesResult>

  /**
   * Get a public or signed URL for a file
   * @param args - URL configuration including bucket, path, URL type, and transform options
   * @returns Promise with generated URL
   */
  getFileUrl(args: IGetFileUrlArgs): Promise<IGetFileUrlResult>

  /**
   * Create signed URLs for multiple files at once
   * Useful for batch operations and generating temporary access links
   * @param args - Configuration including bucket, file paths, expiration, and options
   * @returns Promise with array of signed URLs
   */
  createSignedUrls(args: ICreateSignedUrlsArgs): Promise<ICreateSignedUrlsResult>

  /**
   * Move or rename a file within the same bucket
   * @param args - Move configuration including bucket, source path, and destination path
   * @returns Promise with move operation result
   */
  moveFile(args: IMoveFileArgs): Promise<IMoveFileResult>

  /**
   * Delete a folder and all its contents recursively
   * Warning: This operation cannot be undone
   * @param args - Deletion configuration including bucket and folder path
   * @returns Promise with deletion result including count of files deleted
   */
  deleteFolder(args: IDeleteFolderArgs): Promise<IDeleteFolderResult>
}
