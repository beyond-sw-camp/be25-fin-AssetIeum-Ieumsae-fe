// src/api/index.ts - 모든 API를 한 곳에서 re-export

export { authApi } from './auth.api'
export { departmentApi } from './department.api'
export { memberApi } from './member.api'
export { dashboardApi } from './dashboard.api'
export { tangibleItemApi, tangibleAssetApi, intangibleItemApi, intangibleAssetApi } from './asset.api'
export { ticketApi, ticketCreateApi } from './ticket.api'
export { purchaseApi } from './purchase.api'
export { logApi } from './log.api'
export { ApiError, default as apiClient } from './client'
