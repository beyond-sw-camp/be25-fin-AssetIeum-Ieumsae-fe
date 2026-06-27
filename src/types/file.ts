export type FileTargetType = 'TICKET' | 'PURCHASE_PLAN_ITEM'

export interface FileMetadata {
  fileId: number
  fileUrl: string
  originalFilename: string
  fileSize: number
  extension?: string | null
  uploadedAt?: string | null
}

export interface FileUploadRequest {
  file: File
  targetType?: FileTargetType
  targetId?: string
}

export interface FileDownloadUrlResponse {
  downloadUrl: string
  expiresInSeconds: number
}
