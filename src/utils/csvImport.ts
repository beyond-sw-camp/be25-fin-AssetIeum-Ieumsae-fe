export const parseCsvText = (text: string) => {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const nextChar = text[index + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1
      }
      row.push(field)
      if (row.some((value) => value.trim())) {
        rows.push(row)
      }
      row = []
      field = ''
      continue
    }

    field += char
  }

  row.push(field)
  if (row.some((value) => value.trim())) {
    rows.push(row)
  }

  return rows
}

export const normalizeCsvCell = (value: string) =>
  value.replace(/^\uFEFF/, '').trim()

const escapeCsvCell = (value: string) => {
  if (!/[",\r\n]/.test(value)) return value
  return `"${value.replaceAll('"', '""')}"`
}

export const stringifyCsvRows = (rows: string[][]) =>
  rows
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n')

export const createNormalizedCsvFile = (rows: string[][], fileName: string) =>
  new File([stringifyCsvRows(rows)], fileName, { type: 'text/csv;charset=utf-8' })

export const validateCsvShape = (
  rows: string[][],
  expectedHeaders: string[],
  subject: string,
) => {
  if (rows.length === 0) {
    return `${subject} CSV 파일이 비어 있습니다.`
  }

  const headers = rows[0].map(normalizeCsvCell)
  const isHeaderValid = headers.length === expectedHeaders.length
    && headers.every((header, index) => header === expectedHeaders[index])

  if (!isHeaderValid) {
    return `첫 번째 줄은 ${expectedHeaders.join(',')} 순서여야 합니다.`
  }

  const invalidRowIndex = rows.slice(1).findIndex((row) => row.length !== expectedHeaders.length)
  if (invalidRowIndex >= 0) {
    return `${invalidRowIndex + 2}번째 줄의 열 개수가 ${expectedHeaders.length}개가 아닙니다.`
  }

  if (rows.length === 1) {
    return '등록할 데이터 행이 없습니다.'
  }

  return null
}
