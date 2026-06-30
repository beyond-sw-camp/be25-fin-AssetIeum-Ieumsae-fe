import { ApiError } from '@/api/client'

const UNSAFE_ERROR_PATTERN = /(sql|jdbc|hibernate|database|db\s|constraint|relation|table|column|stack|trace|exception|java\.|org\.|com\.|select\s|insert\s|update\s|delete\s+from|데이터베이스|테이블|컬럼)/i

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return fallback

  const message = error.message.trim()
  if (!message || UNSAFE_ERROR_PATTERN.test(message)) return fallback

  return message
}
