import api from './client'
import type { BudgetHistoryItem, BudgetHistorySearchRequest, BudgetListItem, PageResponse } from '@/types'

export const budgetApi = {
  getList: (params?: { page?: number; size?: number; budgetYear?: number }) =>
    api.get<PageResponse<BudgetListItem>>('/budgets', params),

  getHistories: (params?: BudgetHistorySearchRequest) =>
    api.get<PageResponse<BudgetHistoryItem>>('/budget-histories', params),
}
