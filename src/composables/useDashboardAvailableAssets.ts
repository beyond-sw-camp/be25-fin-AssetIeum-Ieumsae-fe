import {
  intangibleAssetApi,
  intangibleItemApi,
  tangibleAssetApi,
  tangibleItemApi,
} from '@/api/asset.api'
import type {
  IntangibleAsset,
  IntangibleItem,
  IntangibleAssetStatus,
  OwnedAssetDetail,
  TangibleAsset,
  TangibleAssetItem,
} from '@/types'

interface AvailableAssetParams {
  departmentId?: string
  keyword?: string
}

type DashboardIntangibleAsset = IntangibleAsset & {
  intangibleAssetId?: string
  intangibleItemId?: string
  intangibleAssetItemId?: string
  productName?: string
  provider?: string
  category?: string
  categoryName?: string
}

export type DashboardAvailableAsset = OwnedAssetDetail

interface IntangibleAvailability {
  asset: DashboardIntangibleAsset
  availableCount: number
  totalCount: number
}

function tangibleAssetId(asset: TangibleAsset) {
  return String(asset.assetId ?? asset.tangibleAssetId ?? asset.id ?? '')
}

function intangibleAssetId(asset: DashboardIntangibleAsset) {
  return asset.assetId || asset.intangibleAssetId || ''
}

function normalizedText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ''
}

function tangibleItemId(item: TangibleAssetItem) {
  return item.assetItemId || item.tangibleAssetItemId || item.itemId || ''
}

function intangibleItemId(item: IntangibleItem) {
  return item.assetItemId || item.itemId || item.id || ''
}

async function loadAllTangibleAssets(params: AvailableAssetParams) {
  const assets = new Map<string, TangibleAsset>()
  let page = 0
  let totalPages = 1

  while (page < totalPages) {
    const response = await tangibleAssetApi.getList({
      ...params,
      status: 'AVAILABLE',
      page,
      size: 1000,
    })
    totalPages = response.data.totalPages

    for (const asset of response.data.content) {
      const assetId = tangibleAssetId(asset)
      if (assetId) assets.set(assetId, asset)
    }
    page += 1
  }

  return [...assets.values()]
}

async function loadAllIntangibleAssets(
  status: IntangibleAssetStatus,
  params: AvailableAssetParams,
) {
  const assets = new Map<string, DashboardIntangibleAsset>()
  let page = 0
  let totalPages = 1

  while (page < totalPages) {
    const response = await intangibleAssetApi.getList({
      ...params,
      status,
      page,
      size: 1000,
    })
    totalPages = response.data.totalPages

    for (const asset of response.data.content as DashboardIntangibleAsset[]) {
      const assetId = intangibleAssetId(asset)
      if (assetId) assets.set(assetId, asset)
    }
    page += 1
  }

  return [...assets.values()]
}

async function loadAllTangibleItems() {
  const response = await tangibleItemApi.getList({ page: 0, size: 1000 })
  return response.data.content
}

async function loadAllIntangibleItems() {
  const response = await intangibleItemApi.getList({ page: 0, size: 1000 })
  return response.data.content
}

function findTangibleItem(asset: TangibleAsset, items: TangibleAssetItem[]) {
  const assetItemId = asset.assetItemId ?? asset.tangibleItemId ?? asset.tangibleAssetItemId
  return items.find((item) => assetItemId && tangibleItemId(item) === assetItemId)
    ?? items.find((item) => normalizedText(item.productName ?? item.name) === normalizedText(
      asset.productName ?? asset.assetItemName,
    ))
}

function findIntangibleItem(asset: DashboardIntangibleAsset, items: IntangibleItem[]) {
  const assetItemId = asset.assetItemId ?? asset.intangibleItemId ?? asset.intangibleAssetItemId
  return items.find((item) => assetItemId && intangibleItemId(item) === assetItemId)
    ?? items.find((item) => normalizedText(item.productName) === normalizedText(
      asset.productName ?? asset.assetItemName,
    ))
}

function toTangibleDetail(
  asset: TangibleAsset,
  item?: TangibleAssetItem,
): DashboardAvailableAsset {
  return {
    assetType: 'TANGIBLE',
    assetId: tangibleAssetId(asset),
    assetName: asset.productName ?? asset.assetItemName ?? asset.assetCode,
    assetCode: asset.assetCode,
    categoryName: item?.categoryName ?? item?.category ?? null,
    departmentId: asset.departmentId,
    departmentName: asset.departmentName,
    dueDate: asset.returnDueDate ?? asset.warrantyExpiredAt,
    availableSeatCount: 1,
    seatCount: 1,
  }
}

function toIntangibleDetail(
  availability: IntangibleAvailability,
  item?: IntangibleItem,
): DashboardAvailableAsset {
  const { asset, availableCount, totalCount } = availability

  return {
    assetType: 'INTANGIBLE',
    assetId: intangibleAssetId(asset),
    assetName: asset.assetItemName || asset.productName || asset.assetCode,
    assetCode: asset.assetCode,
    categoryName: item?.category ?? asset.categoryName ?? asset.category ?? null,
    departmentId: asset.departmentId,
    departmentName: asset.departmentName,
    dueDate: asset.expiredAt,
    availableSeatCount: availableCount,
    seatCount: totalCount,
  }
}

async function getIntangibleAvailability(
  asset: DashboardIntangibleAsset,
  shouldLoadAssignments: boolean,
): Promise<IntangibleAvailability> {
  const assetId = intangibleAssetId(asset)
  if (!assetId) return { asset, availableCount: 0, totalCount: 0 }

  const detailResponse = await intangibleAssetApi.getDetail(assetId).catch(() => null)
  const detailedAsset = { ...asset, ...detailResponse?.data } as DashboardIntangibleAsset
  const seatCount = Math.max(1, Number(detailedAsset.seatCount) || 1)
  if (!shouldLoadAssignments) {
    return { asset: detailedAsset, availableCount: seatCount, totalCount: seatCount }
  }

  const assignmentResponse = await intangibleAssetApi.getAssignments(assetId).catch((error) => {
    console.error(`무형자산 ${assetId} 배정 현황 조회 실패`, error)
    return null
  })
  if (!assignmentResponse) {
    return { asset: detailedAsset, availableCount: 0, totalCount: seatCount }
  }

  const activeAssignmentCount = assignmentResponse.data.filter((assignment) => {
    const status = assignment.assignmentStatus.toUpperCase()
    return status === 'ACTIVE' || status === 'ASSIGNED'
  }).length

  return {
    asset: detailedAsset,
    availableCount: Math.max(seatCount - activeAssignmentCount, 0),
    totalCount: seatCount,
  }
}

async function loadTangibleDetail(asset: TangibleAsset) {
  const assetId = tangibleAssetId(asset)
  if (!assetId) return asset

  const response = await tangibleAssetApi.getDetail(assetId).catch(() => null)
  return response ? { ...asset, ...response.data } : asset
}

export function useDashboardAvailableAssets() {
  async function loadAvailableAssets(params: AvailableAssetParams = {}) {
    const [
      tangibleResult,
      availableIntangibleResult,
      inUseIntangibleResult,
      tangibleItemResult,
      intangibleItemResult,
    ] = await Promise.allSettled([
      loadAllTangibleAssets(params),
      loadAllIntangibleAssets('AVAILABLE', params),
      loadAllIntangibleAssets('IN_USE', params),
      loadAllTangibleItems(),
      loadAllIntangibleItems(),
    ])

    if (
      tangibleResult.status === 'rejected'
      && availableIntangibleResult.status === 'rejected'
      && inUseIntangibleResult.status === 'rejected'
    ) {
      throw tangibleResult.reason
    }

    const tangibleAssets = tangibleResult.status === 'fulfilled' ? tangibleResult.value : []
    const availableIntangibleAssets = availableIntangibleResult.status === 'fulfilled'
      ? availableIntangibleResult.value
      : []
    const inUseIntangibleAssets = inUseIntangibleResult.status === 'fulfilled'
      ? inUseIntangibleResult.value
      : []
    const tangibleItems = tangibleItemResult.status === 'fulfilled' ? tangibleItemResult.value : []
    const intangibleItems = intangibleItemResult.status === 'fulfilled' ? intangibleItemResult.value : []
    const [detailedTangibleAssets, availableIntangible, inUseIntangible] = await Promise.all([
      Promise.all(tangibleAssets.map(loadTangibleDetail)),
      Promise.all(availableIntangibleAssets.map((asset) => getIntangibleAvailability(asset, false))),
      Promise.all(inUseIntangibleAssets.map((asset) => getIntangibleAvailability(asset, true))),
    ])

    return [
      ...detailedTangibleAssets.map((asset) => (
        toTangibleDetail(asset, findTangibleItem(asset, tangibleItems))
      )),
      ...availableIntangible.map((availability) => (
        toIntangibleDetail(availability, findIntangibleItem(availability.asset, intangibleItems))
      )),
      ...inUseIntangible.flatMap((availability) => {
        if (availability.availableCount <= 0) return []
        return [toIntangibleDetail(
          availability,
          findIntangibleItem(availability.asset, intangibleItems),
        )]
      }),
    ]
  }

  return { loadAvailableAssets }
}
