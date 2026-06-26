import { api } from './client'
import type { FileMetadata, FileTargetType, FileUploadRequest } from '@/types/file'

function compactParams(params?: Record<string, unknown>) {
  if (!params) return undefined

  const entries = Object.entries(params).filter(([, value]) => (
    value !== undefined && value !== null && value !== ''
  ))
  return entries.length ? Object.fromEntries(entries) : undefined
}

export const fileApi = {
  upload: ({ file, targetType, targetId }: FileUploadRequest) => {
    const formData = new FormData()
    formData.append('file', file)
    if (targetType) formData.append('targetType', targetType)
    if (targetId !== undefined && targetId !== null) formData.append('targetId', String(targetId))

    return api.upload<FileMetadata>('/files', formData)
  },

  getFiles: (params?: { targetType?: FileTargetType; targetId?: number | string }) =>
    api.get<FileMetadata[]>('/files', compactParams(params)),

  deleteFile: (fileId: number | string) =>
    api.delete<null>(`/files/${fileId}`),
}
