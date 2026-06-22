import type {
  EmployeeInspectionTargetResponse,
  InspectionSearchResponse,
  InspectionStatus,
} from '@/types/inspection'

function textValue(...values: unknown[]) {
  return values.find((value): value is string | number => (
    (typeof value === 'string' && value.trim().length > 0) || typeof value === 'number'
  ))?.toString() ?? ''
}

function statusValue(value: unknown): InspectionStatus {
  if (value === 'READY' || value === 'IN_PROGRESS' || value === 'COMPLETED' || value === 'CLOSED') {
    return value
  }
  return 'READY'
}

function targetName(targets: EmployeeInspectionTargetResponse[]) {
  const names = Array.from(new Set(
    targets.map((target) => textValue(target.productName, target.itemName)).filter(Boolean),
  ))

  if (names.length === 0) return '배정 자산'
  if (names.length === 1) return names[0] ?? '배정 자산'
  return `${names[0]} 외 ${names.length - 1}개 품목`
}

export function groupMyInspectionTargets(
  targets: EmployeeInspectionTargetResponse[],
): InspectionSearchResponse[] {
  const groups = new Map<string, EmployeeInspectionTargetResponse[]>()

  targets.forEach((target) => {
    const inspectionId = textValue(target.inspectionId)
    if (!inspectionId) return
    const key = `${inspectionId}-${target.memberId ?? 'unknown'}`
    groups.set(key, [...(groups.get(key) ?? []), target])
  })

  return Array.from(groups.entries()).map(([groupKey, group]) => {
    const first = group[0]
    const inspectionId = textValue(first?.inspectionId)
    const inspectedAssetCount = group.filter((target) => (
      target.isResponded === true || target.responded === true
    )).length

    return {
      inspectionId,
      groupKey,
      targetName: targetName(group),
      inspectorName: first?.memberName ?? '본인',
      inspectorType: 'EMPLOYEE',
      inspectionStatus: statusValue(first?.inspectionStatus),
      startDate: textValue(first?.startDate),
      endDate: textValue(first?.endDate),
      description: '',
      targetAssetCount: group.length,
      inspectedAssetCount,
      completedAssetCount: inspectedAssetCount,
      followUpRequiredCount: 0,
    }
  })
}
