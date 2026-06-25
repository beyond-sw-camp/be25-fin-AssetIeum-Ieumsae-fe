import api from './client'
import type { BudgetHistoryItem, BudgetHistorySearchRequest, PageResponse } from '@/types'

export const budgetApi = {
  getHistories: (params?: BudgetHistorySearchRequest) =>
    api.get<PageResponse<BudgetHistoryItem>>('/budget-histories', params),
}
