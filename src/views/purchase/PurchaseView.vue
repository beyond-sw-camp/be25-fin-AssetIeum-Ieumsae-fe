<template>
  <div
    class="relative flex h-full min-h-0 flex-col bg-background text-text-main"
  >
    <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <section
        v-if="selectedPlanId"
        class="relative flex min-h-full flex-col bg-background text-text-main"
      >
        <div class="flex-1 pb-14">
          <div class="mx-auto w-full max-w-[1500px] px-3 pb-8 pt-2">
            <div class="mb-3 flex items-center gap-2">
              <button
                type="button"
                class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-sub transition hover:bg-surface-secondary hover:text-primary"
                aria-label="구매 계획 목록으로 돌아가기"
                @click="closeDetail"
              >
                <ArrowLeft :size="15" />
              </button>
              <p class="page-subtitle">구매 계획 &gt; 상세내용</p>
            </div>

            <div
              v-if="detailError"
              class="mb-4 flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3"
            >
              <p class="text-sm font-semibold text-danger">{{ detailError }}</p>
              <Button
                variant="outline"
                size="sm"
                @click="fetchPlanDetail(selectedPlanId)"
              >
                <RefreshCw :size="15" />
                다시 조회
              </Button>
            </div>

            <div v-if="isDetailLoading" class="space-y-4">
              <div class="h-12 animate-pulse rounded-xl bg-surface-secondary" />
              <div
                class="h-44 animate-pulse rounded-2xl bg-surface-secondary"
              />
              <div class="grid gap-4 lg:grid-cols-2">
                <div
                  class="h-72 animate-pulse rounded-2xl bg-surface-secondary"
                />
                <div
                  class="h-72 animate-pulse rounded-2xl bg-surface-secondary"
                />
              </div>
            </div>

            <div v-else-if="selectedPlan" class="flex flex-col gap-4">
              <header
                class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
              >
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-xl font-semibold text-text-muted"
                      >#{{ selectedPlan.planNo }}</span
                    >
                    <span class="text-text-muted">|</span>
                    <h1 class="text-2xl font-bold text-text-main">
                      {{ purchasePlanTitle }}
                    </h1>
                  </div>
                  <div class="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      :class="[
                        'rounded-full px-3 py-1.5 text-xs font-bold',
                        getStatusBadgeClass(displayPlanStatus(selectedPlan)),
                      ]"
                    >
                      {{ getStatusLabel(displayPlanStatus(selectedPlan)) }}
                    </span>
                    <span class="text-sm text-text-sub">
                      신청 팀원 {{ selectedPlan.requesterName || "-" }} · 생성일
                      {{ formatDateTime(selectedPlan.createdAt) }}
                    </span>
                  </div>
                </div>

                <div
                  v-if="canChangeStatus && statusActionOptions.length > 0"
                  class="w-full shrink-0 lg:w-60"
                >
                  <div class="mb-1.5 flex items-center justify-between gap-2">
                    <label
                      for="purchase-plan-status-selector"
                      class="text-xs font-semibold text-text-muted"
                    >
                      상태 변경
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      class="shrink-0"
                      :loading="isStatusSaving"
                      :disabled="!canSaveSelectedStatus"
                      @click="changeSelectedStatus"
                    >
                      <Save :size="14" />
                      상태 저장
                    </Button>
                  </div>
                  <Dropdown
                    id="purchase-plan-status-selector"
                    :model-value="selectedStatusForDropdown"
                    :options="statusActionOptions"
                    :disabled="isStatusSaving"
                    root-option="변경할 상태 선택"
                    menu-align="right"
                    aria-label="구매 계획 상태"
                    @update:model-value="handleStatusSelect"
                  />
                </div>
              </header>

              <div class="space-y-4">
                <div class="grid items-stretch gap-4 lg:grid-cols-2">
                  <TicketDetailCard title="구매 계획 내역" class="h-full">
                    <template #icon>
                      <ClipboardCheck :size="18" class="text-primary" />
                    </template>

                    <dl
                      class="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      <div
                        v-for="item in purchasePlanInfoItems"
                        :key="item.label"
                        class="border-b border-border pb-3"
                      >
                        <dt class="text-xs font-semibold text-text-muted">
                          {{ item.label }}
                        </dt>
                        <dd
                          class="mt-1.5 break-words text-sm font-semibold text-text-main"
                        >
                          {{ item.value }}
                        </dd>
                      </div>
                    </dl>
                  </TicketDetailCard>

                  <TicketDetailCard title="집행 및 상태 정보" class="h-full">
                    <template #icon>
                      <ReceiptText :size="18" class="text-primary" />
                    </template>

                    <dl
                      class="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      <div
                        v-for="item in purchaseExecutionInfoItems"
                        :key="item.label"
                        class="border-b border-border pb-3"
                      >
                        <dt class="text-xs font-semibold text-text-muted">
                          {{ item.label }}
                        </dt>
                        <dd
                          class="mt-1.5 break-words text-sm font-semibold text-text-main"
                        >
                          {{ item.value }}
                        </dd>
                      </div>
                    </dl>
                  </TicketDetailCard>
                </div>

                <TicketDetailCard title="구매 품목" padding="none">
                  <template #icon>
                    <PackageCheck :size="18" class="text-primary" />
                  </template>

                  <Table
                    :columns="displayPlanItemColumns"
                    :rows="selectedPlanItems"
                    row-key="itemId"
                    empty-text="구매 품목이 없습니다."
                    class="rounded-none! border-0! [&_table]:min-w-[1100px]"
                  >
                    <template #cell-category="{ value }">
                      <span class="text-text-sub">{{ value || "-" }}</span>
                    </template>

                    <template #cell-itemName="{ value }">
                      <span class="font-semibold text-text-main">{{
                        value
                      }}</span>
                    </template>

                    <template #cell-ticketRequesterName="{ value }">
                      <span>{{ value || "-" }}</span>
                    </template>

                    <template #cell-ticketDepartmentName="{ value }">
                      <span>{{ value || "-" }}</span>
                    </template>

                    <template #cell-isStandard="{ row }">
                      <span>{{
                        row.isStandard === false ? "비표준" : "표준"
                      }}</span>
                    </template>

                    <template #cell-estimatedUnitPrice="{ value }">
                      <span>{{ formatCurrency(Number(value || 0)) }}</span>
                    </template>

                    <template #cell-totalAmount="{ value }">
                      <span class="font-semibold">{{
                        formatCurrency(Number(value || 0))
                      }}</span>
                    </template>

                    <template #cell-delivery="{ row }">
                      <div
                        v-if="canRegisterAssetFromItem(row)"
                        class="flex flex-col items-center gap-1"
                      >
                        <span
                          v-if="row.receivedAt"
                          class="text-xs font-semibold text-success"
                        >
                          {{ formatDate(row.receivedAt) }}
                        </span>
                        <span v-else class="text-xs font-semibold text-success">
                          {{ getStatusLabel(displayPlanStatus(selectedPlan)) }}
                        </span>
                        <Button
                          v-if="canChangeStatus"
                          variant="outline"
                          size="sm"
                          class="whitespace-nowrap text-xs"
                          @click.stop="openAssetRegisterDrawer(row)"
                        >
                          <BoxIcon :size="13" />
                          자산 등록
                        </Button>
                      </div>
                      <div
                        v-else-if="isPurchaseItemDeliverySettled(row)"
                        class="flex flex-col items-center gap-1"
                      >
                        <span
                          v-if="row.receivedAt"
                          class="text-xs font-semibold text-success"
                        >
                          {{ formatDate(row.receivedAt) }}
                        </span>
                        <span v-else class="text-xs font-semibold text-success">
                          {{ getStatusLabel(displayPlanStatus(selectedPlan)) }}
                        </span>
                      </div>
                      <Button
                        v-else
                        variant="outline"
                        size="sm"
                        class="min-w-[5.75rem] whitespace-nowrap px-3!"
                        :disabled="
                          !canConfirmDelivery(row) ||
                          isConfirmingPurchaseItem(row)
                        "
                        :loading="isConfirmingPurchaseItem(row)"
                        @click.stop="confirmDelivery(row)"
                      >
                        납품 확인
                      </Button>
                    </template>
                  </Table>
                </TicketDetailCard>

                <TicketDetailCard title="증빙자료">
                  <template #icon>
                    <FileWarning :size="18" class="text-text-muted" />
                  </template>

                  <div
                    class="rounded-xl border border-dashed border-border bg-surface-secondary/40 px-4 py-3"
                  >
                    <p class="text-sm leading-6 text-text-sub">
                      구매 증빙자료 업로드 API는 추후 개발 예정이라 현재
                      화면에서는 업로드를 연결하지 않았습니다.
                    </p>
                  </div>
                </TicketDetailCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      <template v-if="!selectedPlanId">
        <header
          class="page-header flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p class="page-subtitle mb-1">구매 계획</p>
            <h1 class="page-title">구매 계획 및 집행 관리</h1>
          </div>
          <Button v-if="canCreatePurchasePlan" @click="openCreateDrawer">
            <Plus :size="16" />
            구매 계획 등록
          </Button>
        </header>

        <section class="mx-3 mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <article
            v-for="card in statCards"
            :key="card.label"
            :class="[
              'relative overflow-hidden rounded-xl border bg-surface p-4 shadow-sm transition-colors duration-300',
              card.className,
            ]"
          >
            <span
              :class="['absolute inset-y-0 left-0 w-1', card.accentClass]"
              aria-hidden="true"
            ></span>
            <p class="text-xs font-semibold text-text-sub">{{ card.label }}</p>
            <p class="mt-2 text-2xl font-bold text-text-main">
              {{ card.value }}건
            </p>
          </article>
        </section>

        <section class="card mx-3 mb-6 flex flex-col border border-border">
          <div
            class="flex shrink-0 flex-col gap-3 border-b border-border pb-3 xl:flex-row xl:items-center xl:justify-between"
          >
            <div class="flex flex-wrap items-center gap-2">
              <Dropdown
                :model-value="pageSize"
                :options="PAGE_SIZE_OPTIONS"
                class="w-32!"
                aria-label="페이지 크기"
                @update:model-value="handlePageSizeChange"
              />
            </div>

            <form
              class="flex w-full flex-wrap items-center gap-2 xl:max-w-4xl xl:justify-end"
              @submit.prevent="handleSearch"
            >
              <Dropdown
                :model-value="statusFilter"
                :options="STATUS_FILTER_OPTIONS"
                class="w-40! shrink-0"
                menu-align="right"
                aria-label="진행 상태"
                @update:model-value="handleStatusChange"
              />
              <Dropdown
                :model-value="requesterFilter"
                :options="requesterOptions"
                class="w-44! shrink-0"
                menu-align="right"
                aria-label="신청한 구매자산팀원"
                @update:model-value="handleRequesterChange"
              />
              <input
                v-model="keywordInput"
                type="search"
                class="h-9 min-w-[240px] flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 xl:max-w-[22rem]"
                placeholder="계획 번호 또는 품목 검색"
                aria-label="구매 계획 검색"
              />
              <Button type="submit" class="shrink-0">
                <Search :size="16" />
                조회하기
              </Button>
            </form>
          </div>

          <div
            v-if="listError"
            class="mt-4 flex shrink-0 items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3"
          >
            <p class="text-sm font-semibold text-danger">{{ listError }}</p>
            <Button variant="outline" size="sm" @click="refreshList">
              <RefreshCw :size="15" />
              다시 조회
            </Button>
          </div>

          <div class="mt-4 rounded-xl border border-border bg-surface">
            <Table
              :columns="columns"
              :rows="plans"
              :loading="isListLoading"
              row-key="planId"
              empty-text="조회된 구매 계획이 없습니다."
              class="border-0!"
              @row-click="openDetail"
            >
              <template #cell-planNo="{ value }">
                <span class="font-bold text-text-main">{{ value }}</span>
              </template>

              <template #cell-itemName="{ row }">
                <span class="line-clamp-1 font-semibold text-text-main">{{
                  row.itemName || "-"
                }}</span>
              </template>

              <template #cell-requesterName="{ row }">
                <span>{{ row.requesterName || "-" }}</span>
              </template>

              <template #cell-estimatedAmount="{ value }">
                <span class="font-semibold">{{
                  formatCurrency(Number(value || 0))
                }}</span>
              </template>

              <template #cell-createdAt="{ value }">
                <span class="text-text-sub">{{
                  formatDate(String(value))
                }}</span>
              </template>

              <template #cell-status="{ row }">
                <span
                  :class="[
                    'rounded-full px-2.5 py-1 text-xs font-bold',
                    getStatusBadgeClass(displayListStatus(row)),
                  ]"
                >
                  {{ getStatusLabel(displayListStatus(row)) }}
                </span>
              </template>
            </Table>
          </div>

          <div
            class="flex shrink-0 items-center justify-center border-t border-border py-3"
          >
            <div class="flex items-center justify-center gap-1">
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
                :disabled="page === 0 || isListLoading"
                aria-label="이전 페이지"
                @click="page -= 1"
              >
                <ChevronLeft :size="16" />
              </button>
              <template v-for="item in paginationItems" :key="String(item)">
                <span
                  v-if="item === 'ellipsis'"
                  class="inline-flex h-8 min-w-8 items-center justify-center text-xs text-text-muted"
                >
                  ...
                </span>
                <button
                  v-else
                  type="button"
                  :class="[
                    'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors',
                    page === item
                      ? 'bg-primary text-white'
                      : 'text-text-sub hover:bg-surface-secondary',
                  ]"
                  @click="page = item"
                >
                  {{ item + 1 }}
                </button>
              </template>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
                :disabled="
                  totalPages === 0 || page >= totalPages - 1 || isListLoading
                "
                aria-label="다음 페이지"
                @click="page += 1"
              >
                <ChevronRight :size="16" />
              </button>
            </div>
          </div>
        </section>
      </template>
    </div>

    <div
      v-if="selectedPlanId && footerStatusActions.length > 0"
      class="absolute -bottom-4 -left-4 -right-4 z-20 flex min-h-14 flex-wrap items-center justify-end gap-3 border-t border-border bg-surface px-10 py-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
    >
      <Button
        v-for="action in footerStatusActions"
        :key="action.key ?? action.status ?? action.label"
        :variant="action.variant"
        :class="action.className"
        class="min-w-[5.75rem] shrink-0 whitespace-nowrap px-3!"
        :disabled="isStatusSaving"
        :loading="isStatusSaving && pendingReviewStatus === action.status"
        @click="handleFooterAction(action)"
      >
        <ShoppingCart v-if="action.status === 'ORDERED'" :size="16" />
        <PackageCheck v-else-if="action.status === 'DELIVERED'" :size="16" />
        <BoxIcon v-else-if="action.action === 'register-asset'" :size="16" />
        {{ action.label }}
      </Button>
    </div>

    <BaseDrawer
      :is-open="isCreateDrawerOpen"
      title="신규 구매 계획 등록"
      panel-class="w-full max-w-5xl"
      body-class="min-h-0 overflow-hidden! p-0"
      hide-footer
      @close="closeCreateDrawer"
    >
      <div class="flex h-full flex-col">
        <div
          v-if="eligibleError"
          class="mx-6 mt-4 flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3"
        >
          <p class="text-sm font-semibold text-danger">{{ eligibleError }}</p>
          <Button variant="outline" size="sm" @click="fetchEligibleTickets">
            <RefreshCw :size="15" />
            다시 조회
          </Button>
        </div>

        <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
          <div
            v-if="isEligibleLoading"
            class="flex h-full min-h-[320px] items-center justify-center"
          >
            <Loader2 class="animate-spin text-primary" :size="28" />
          </div>

          <Table
            v-else
            :columns="eligibleTicketColumns"
            :rows="eligibleTickets"
            row-key="ticketId"
            empty-text="구매 계획으로 등록할 결재 완료 요청이 없습니다."
            class="max-h-[400px] overflow-y-auto max-w-full rounded-xl! [&_table]:table-fixed [&_td]:align-middle [&_th]:whitespace-nowrap"
            @row-click="handleEligibleTicketRowClick"
          >
            <template #cell-select="{ row }">
              <div
                role="checkbox"
                :aria-checked="selectedTicketIds.includes(row.ticketId)"
                :aria-label="row.canCreate ? `${row.ticket.ticketNo} 선택` : `${row.ticket.ticketNo} 선택 불가: ${row.disabledReason}`"
                :title="row.canCreate ? '구매 계획 대상 선택' : row.disabledReason"
                class="flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-200"
                :class="[
                  selectedTicketIds.includes(row.ticketId)
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-border bg-surface text-transparent',
                  !row.canCreate && 'opacity-40 cursor-not-allowed border-border bg-surface-secondary text-transparent'
                ]"
              >
                <Check :size="14" :stroke-width="3" />
              </div>
            </template>

            <template #cell-ticketNo="{ row }">
              <span class="block truncate font-bold text-text-main">{{
                row.ticket.ticketNo
              }}</span>
            </template>

            <template #cell-requesterName="{ row }">
              <span class="block truncate">{{
                row.ticket.requesterName || "-"
              }}</span>
            </template>

            <template #cell-itemName="{ value }">
              <span
                class="block truncate font-semibold text-text-main"
                :title="String(value || '-')"
              >
                {{ value || "-" }}
              </span>
            </template>

            <template #cell-categoryName="{ value }">
              <span class="block truncate" :title="String(value || '-')">{{
                value || "-"
              }}</span>
            </template>

            <template #cell-estimatedUnitPrice="{ value }">
              <span class="whitespace-nowrap">{{
                formatCurrency(Number(value || 0))
              }}</span>
            </template>
          </Table>

          <section
            class="space-y-3 rounded-xl border border-border bg-surface p-4"
          >
            <div>
              <h2 class="text-sm font-bold text-text-main">
                티켓 없이 품목 추가
              </h2>
              <p class="mt-1 text-xs text-text-muted">
                구매 계획에 필요한 품목을 직접 입력해 요청 품목에 추가합니다.
              </p>
            </div>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div class="xl:col-span-2">
                <Input
                  id="direct-plan-item-name"
                  v-model="directItemForm.itemName"
                  label="품목명"
                  required
                  placeholder="예: MacBook Pro 14"
                  :disabled="isCreatingPlan"
                />
              </div>
              <div class="space-y-2 text-left">
                <label class="block px-0.5 text-sm font-semibold text-text-main"
                  >자산 유형</label
                >
                <Dropdown
                  :model-value="directItemForm.assetType"
                  :options="ASSET_TYPE_OPTIONS"
                  :disabled="isCreatingPlan"
                  @update:model-value="handleDirectAssetTypeChange"
                />
              </div>
              <div v-if="false" class="space-y-2 text-left">
                <label
                  for="direct-plan-category"
                  class="block px-0.5 text-sm font-semibold text-text-main"
                >
                  분류
                </label>
                <Dropdown
                  id="direct-plan-category"
                  :model-value="directItemForm.categoryName"
                  :options="directCategoryOptions"
                  :disabled="isDirectCategoryDisabled"
                  @update:model-value="handleDirectCategoryChange"
                />
              </div>
              <Input
                id="direct-plan-quantity"
                v-model="directItemForm.quantity"
                type="number"
                :min="1"
                label="수량"
                required
                :disabled="isCreatingPlan"
              />
              <div class="space-y-2 text-left">
                <label
                  for="direct-plan-unit-price"
                  class="flex items-center gap-0.5 px-0.5 text-sm font-semibold text-text-main"
                >
                  예상 단가
                  <span class="font-bold text-primary">*</span>
                </label>
                <div class="relative">
                  <input
                    id="direct-plan-unit-price"
                    :value="formattedDirectEstimatedUnitPrice"
                    inputmode="numeric"
                    placeholder="0"
                    :disabled="isCreatingPlan"
                    class="h-9 w-full rounded-xl border border-border bg-surface py-2.5 pl-4 pr-9 text-right text-sm text-text-main outline-none transition-all duration-200 placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-secondary disabled:text-text-muted disabled:opacity-60"
                    @input="handleDirectEstimatedUnitPriceInput"
                  />
                  <span
                    class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted"
                  >
                    원
                  </span>
                </div>
              </div>
              <div class="md:col-span-2 xl:col-span-4">
                <Input
                  id="direct-plan-url"
                  v-model="directItemForm.externalUrl"
                  label="구매 링크"
                  placeholder="https://"
                  :disabled="isCreatingPlan"
                />
              </div>
              <div class="flex items-end">
                <Button
                  class="w-full"
                  variant="outline"
                  :disabled="isCreatingPlan"
                  @click="addDirectPlanItem"
                >
                  <Plus :size="16" />
                  품목 추가
                </Button>
              </div>
            </div>

            <p v-if="directItemError" class="text-xs font-semibold text-danger">
              {{ directItemError }}
            </p>
          </section>

          <section class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-sm font-bold text-text-main">
                구매계획 요청 품목
              </h2>
              <span class="text-xs font-semibold text-text-muted"
                >총 {{ planRequestItems.length }}건</span
              >
            </div>

            <div
              v-if="planRequestItems.length === 0"
              class="rounded-xl border border-dashed border-border bg-surface-secondary px-4 py-8 text-center text-sm text-text-muted"
            >
              승인 완료 티켓을 선택하거나 직접 품목을 추가해주세요.
            </div>

            <div v-else class="max-h-[300px] overflow-y-auto overflow-x-auto rounded-xl border border-border">
              <div class="min-w-[820px]">
                <div
                  class="grid grid-cols-[88px_minmax(0,1.4fr)_120px_72px_120px_120px_48px] gap-3 bg-surface-secondary px-4 py-2 text-xs font-bold text-text-sub"
                >
                  <span>출처</span>
                  <span>품목</span>
                  <span>분류</span>
                  <span class="text-center">수량</span>
                  <span class="text-right">단가</span>
                  <span class="text-right">금액</span>
                  <span class="text-center">삭제</span>
                </div>
                <div
                  v-for="item in planRequestItems"
                  :key="item.id"
                  class="grid grid-cols-[88px_minmax(0,1.4fr)_120px_72px_120px_120px_48px] items-center gap-3 border-t border-border px-4 py-3 text-sm"
                >
                  <span
                    :class="[
                      'inline-flex w-fit rounded-full px-2 py-1 text-xs font-bold',
                      item.source === 'ticket'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-success/10 text-success',
                    ]"
                  >
                    {{ item.sourceLabel }}
                  </span>
                  <span
                    class="truncate font-semibold text-text-main"
                    :title="item.itemName"
                    >{{ item.itemName }}</span
                  >
                  <span
                    class="truncate text-text-sub"
                    :title="item.categoryName || '-'"
                    >{{ item.categoryName || "-" }}</span
                  >
                  <span class="text-center">{{ item.quantity }}</span>
                  <span class="text-right">{{
                    formatCurrency(item.estimatedUnitPrice)
                  }}</span>
                  <span class="text-right font-bold text-text-main">{{
                    formatCurrency(item.estimatedAmount)
                  }}</span>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                    :disabled="!item.canRemove || isCreatingPlan"
                    :aria-label="`${item.itemName} 삭제`"
                    @click="removePlanRequestItem(item.id)"
                  >
                    <Trash2 :size="15" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="border-t border-border px-6 py-4">
          <div
            class="mb-4 flex items-center justify-between rounded-xl bg-surface-secondary px-4 py-3"
          >
            <span class="text-sm font-semibold text-text-sub"
              >요청 품목 {{ planRequestItems.length }}건</span
            >
            <span class="text-lg font-bold text-text-main"
              >합계 {{ formatCurrency(selectedEstimatedAmount) }}</span
            >
          </div>
          <div class="grid grid-cols-2 gap-2">
            <Button class="w-full" variant="outline" @click="closeCreateDrawer"
              >취소</Button
            >
            <Button
              class="w-full"
              :disabled="planRequestItems.length === 0 || isCreatingPlan"
              :loading="isCreatingPlan"
              @click="createPlan"
            >
              등록
            </Button>
          </div>
        </div>
      </div>
    </BaseDrawer>

    <!-- 자산 등록 패널 -->
    <BaseDrawer
      :is-open="isActualAmountDrawerOpen"
      title="납품 확인"
      panel-class="w-full max-w-md"
      body-class="space-y-4 p-6"
      @close="closeActualAmountDrawer"
    >
      <div class="space-y-4">
        <p class="text-sm font-semibold text-text-sub">
          실제 결제금액을 입력하면 납품 확인 상태로 변경됩니다.
        </p>
        <div class="w-full space-y-2 text-left">
          <label
            for="purchase-actual-amount"
            class="flex items-center gap-0.5 px-0.5 text-sm font-semibold text-text-main"
          >
            실제 결제금액
            <span class="font-bold text-primary">*</span>
          </label>
          <div class="relative">
            <input
              id="purchase-actual-amount"
              :value="actualAmountInput"
              inputmode="numeric"
              placeholder="0"
              :disabled="isStatusSaving"
              :aria-invalid="Boolean(actualAmountError)"
              aria-describedby="purchase-actual-amount-error"
              class="w-full rounded-xl border border-border bg-surface px-4 py-3 pr-10 text-sm font-medium text-text-main outline-none transition-all placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted"
              :class="actualAmountError && 'border-danger focus:border-danger focus:ring-danger/20'"
              @input="handleActualAmountInput"
              @keydown.enter.prevent="submitActualAmount"
            />
            <span
              class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted"
            >
              원
            </span>
          </div>
          <p
            v-if="actualAmountError"
            id="purchase-actual-amount-error"
            class="mt-0.5 px-0.5 text-xs font-medium text-danger"
            role="alert"
          >
            {{ actualAmountError }}
          </p>
        </div>
      </div>

      <template #footer>
        <div class="grid grid-cols-2 gap-2">
          <Button
            class="w-full"
            variant="outline"
            :disabled="isStatusSaving"
            @click="closeActualAmountDrawer"
          >
            취소
          </Button>
          <Button
            class="w-full"
            :loading="isStatusSaving"
            @click="submitActualAmount"
          >
            납품 확인
          </Button>
        </div>
      </template>
    </BaseDrawer>

    <PurchaseAssetRegisterDrawer
      :is-open="isAssetRegisterDrawerOpen"
      :plan="selectedPlan"
      :item="assetRegisterTargetItem"
      :departments="departments"
      :members="members"
      @close="closeAssetRegisterDrawer"
      @registered="handlePurchaseAssetRegistered"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  Box as BoxIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileWarning,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCw,
  ReceiptText,
  Save,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-vue-next";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  ApiError,
  departmentApi,
  intangibleItemApi,
  memberApi,
  purchaseApi,
  tangibleItemApi,
  ticketApi,
} from "@/api";
import BaseDrawer from "@/components/common/BaseDrawer.vue";
import Button from "@/components/common/Button.vue";
import Dropdown from "@/components/common/Dropdown.vue";
import Input from "@/components/common/Input.vue";
import Table, { type Column } from "@/components/common/Table.vue";
import PurchaseAssetRegisterDrawer from "@/components/purchase/PurchaseAssetRegisterDrawer.vue";
import TicketDetailCard from "@/components/ticket/TicketDetailCard.vue";
import { usePermission } from "@/composables/usePermission";
import type {
  AssetType,
  Department,
  DropdownOption,
  IntangibleCategoryGroup,
  Member,
  PurchasePlanCandidateTicket,
  PurchasePlanCreateItem,
  PurchasePlanDetail,
  PurchasePlanItem,
  PurchasePlanListItem,
  PurchasePlanStatistics,
  PurchasePlanStatus,
  TangibleCategoryGroup,
} from "@/types";

interface EligibleTicket {
  ticketId: string;
  ticket: PurchasePlanCandidateTicket;
  itemName: string;
  categoryName: string;
  assetType: PurchasePlanCandidateTicket["assetType"];
  quantity: number;
  estimatedUnitPrice: number;
  assetItemId: string | null;
  tangibleAssetItemId: string | null;
  intangibleAssetItemId: string | null;
  isStandard: boolean;
  canCreate: boolean;
  disabledReason: string;
}

interface DirectPlanItem {
  localId: string;
  itemName: string;
  categoryName: string;
  assetType: AssetType;
  quantity: number;
  estimatedUnitPrice: number;
  externalUrl: string | null;
}

interface PlanRequestItem {
  id: string;
  source: "ticket" | "direct";
  sourceLabel: string;
  itemName: string;
  categoryName: string;
  assetType: AssetType;
  quantity: number;
  estimatedUnitPrice: number;
  estimatedAmount: number;
  canRemove: boolean;
}

interface DirectItemForm {
  itemName: string;
  categoryName: string;
  assetType: AssetType;
  quantity: string;
  estimatedUnitPrice: string;
  externalUrl: string;
}

interface FooterStatusAction {
  key?: string;
  label: string;
  action?: "change-status" | "register-asset";
  status?: PurchasePlanStatus;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  className?: string;
}

const PAGE_SIZE_OPTIONS: DropdownOption[] = [
  { label: "10개씩 보기", value: 10 },
  { label: "20개씩 보기", value: 20 },
  { label: "50개씩 보기", value: 50 },
];

const ASSET_TYPE_OPTIONS: DropdownOption[] = [
  { label: "유형자산", value: "TANGIBLE" },
  { label: "무형자산", value: "INTANGIBLE" },
];

const STATUS_FILTER_OPTIONS: DropdownOption[] = [
  { label: "전체 상태", value: "" },
  { label: "승인 대기", value: "REQUESTED" },
  { label: "승인", value: "APPROVED" },
  { label: "반려", value: "REJECTED" },
  { label: "발주", value: "ORDERED" },
  { label: "납품 확인", value: "DELIVERED" },
  { label: "완료", value: "COMPLETED" },
  { label: "취소", value: "CANCELLED" },
];

const PURCHASE_PLAN_STATUS_TRANSITIONS: Record<
  PurchasePlanStatus,
  PurchasePlanStatus[]
> = {
  REQUESTED: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["ORDERED"],
  ORDERED: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: [],
};

const STATUS_ALL_OPTIONS: DropdownOption[] = [
  { label: "승인 대기", value: "REQUESTED" },
  { label: "승인", value: "APPROVED" },
  { label: "반려", value: "REJECTED" },
  { label: "발주", value: "ORDERED" },
  { label: "납품 확인", value: "DELIVERED" },
  { label: "완료", value: "COMPLETED" },
  { label: "취소", value: "CANCELLED" },
];

const STATUS_LABEL: Record<PurchasePlanStatus, string> = {
  REQUESTED: "승인 대기",
  APPROVED: "승인",
  REJECTED: "반려",
  ORDERED: "발주",
  DELIVERED: "납품 확인",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

const columns: Column<PurchasePlanListItem>[] = [
  { key: "planNo", label: "구매 계획 번호", width: "20%", align: "center" },
  { key: "itemName", label: "요청 품목", width: "28%", align: "center" },
  { key: "requesterName", label: "신청 팀원", width: "14%", align: "center" },
  { key: "itemCount", label: "품목 수", width: "10%", align: "center" },
  { key: "estimatedAmount", label: "예상 금액", width: "16%", align: "center" },
  { key: "status", label: "상태", width: "12%", align: "center" },
];

const planItemColumns: Column<PurchasePlanItem>[] = [
  { key: "category", label: "분류", width: "11%", align: "center" },
  { key: "itemName", label: "품목명", width: "20%", align: "center" },
  {
    key: "ticketRequesterName",
    label: "요청자",
    width: "10%",
    align: "center",
  },
  {
    key: "ticketDepartmentName",
    label: "요청 부서",
    width: "12%",
    align: "center",
  },
  { key: "isStandard", label: "표준 여부", width: "10%", align: "center" },
  { key: "quantity", label: "수량", width: "8%", align: "center" },
  { key: "estimatedUnitPrice", label: "단가", width: "12%", align: "center" },
  { key: "totalAmount", label: "합계", width: "12%", align: "center" },
  { key: "delivery", label: "납품", width: "12%", align: "center" },
];

const eligibleTicketColumns: Column<EligibleTicket>[] = [
  { key: "select", label: "선택", width: "7%", align: "center" },
  { key: "ticketNo", label: "티켓 번호", width: "15%", align: "center" },
  { key: "requesterName", label: "티켓 요청자", width: "13%", align: "center" },
  { key: "itemName", label: "품목", width: "22%", align: "center" },
  { key: "categoryName", label: "분류", width: "13%", align: "center" },
  { key: "quantity", label: "수량", width: "8%", align: "center" },
  {
    key: "estimatedUnitPrice",
    label: "예상 단가",
    width: "22%",
    align: "center",
  },
];

const EMPTY_STATISTICS: PurchasePlanStatistics = {
  totalCount: 0,
  approvalWaitingCount: 0,
  orderedCount: 0,
  completedCount: 0,
};

const { hasRole } = usePermission();
const route = useRoute();
const router = useRouter();
const canChangeStatus = computed(() =>
  hasRole("ADMIN", "SUPER_ADMIN", "ASSET_MANAGER"),
);
const canCreatePurchasePlan = computed(() =>
  hasRole("ASSET_TEAM", "ASSET_MANAGER"),
);

const plans = ref<PurchasePlanListItem[]>([]);
const statistics = ref<PurchasePlanStatistics>({ ...EMPTY_STATISTICS });
const page = ref(0);
const pageSize = ref(10);
const totalElements = ref(0);
const totalPages = ref(0);
const statusFilter = ref<PurchasePlanStatus | "">("");
const requesterFilter = ref("");
const keywordInput = ref("");
const keyword = ref("");
const isListLoading = ref(false);
const listError = ref("");
const assetTeamMembers = ref<Member[]>([]);
const departments = ref<Department[]>([]);
const members = ref<Member[]>([]);
const tangibleCategoryGroups = ref<TangibleCategoryGroup[]>([]);
const intangibleCategoryGroups = ref<IntangibleCategoryGroup[]>([]);

const selectedPlanId = ref<number | string | null>(null);
const selectedPlan = ref<PurchasePlanDetail | null>(null);
const isDetailLoading = ref(false);
const detailError = ref("");
const nextStatus = ref<PurchasePlanStatus | "">("");
const isStatusSaving = ref(false);
const pendingReviewStatus = ref<PurchasePlanStatus | null>(null);
const isConfirmingItem = ref<number | string | null>(null);
const isActualAmountDrawerOpen = ref(false);
const actualAmountInput = ref("");
const actualAmountError = ref("");

const isCreateDrawerOpen = ref(false);
const eligibleTickets = ref<EligibleTicket[]>([]);
const selectedTicketIds = ref<string[]>([]);
const directPlanItems = ref<DirectPlanItem[]>([]);
const directItemForm = ref<DirectItemForm>({
  itemName: "",
  categoryName: "",
  assetType: "TANGIBLE",
  quantity: "1",
  estimatedUnitPrice: "",
  externalUrl: "",
});
const directItemError = ref("");
const isEligibleLoading = ref(false);
const eligibleError = ref("");
const isCreatingPlan = ref(false);

const requesterOptions = computed<DropdownOption[]>(() => [
  { label: "전체 팀원", value: "" },
  ...assetTeamMembers.value.map((member) => ({
    label: member.name,
    value: member.memberId,
  })),
]);

const tangibleCategoryOptions = computed(() =>
  categoryGroupsToOptions(tangibleCategoryGroups.value),
);

const intangibleCategoryOptions = computed(() =>
  categoryGroupsToOptions(intangibleCategoryGroups.value),
);

const directCategoryOptions = computed<DropdownOption[]>(() => {
  const categories =
    directItemForm.value.assetType === "INTANGIBLE"
      ? intangibleCategoryOptions.value
      : tangibleCategoryOptions.value;

  return [{ label: "분류 선택", value: "" }, ...categories];
});

const isDirectCategoryDisabled = computed(() => isCreatingPlan.value);

const formattedDirectEstimatedUnitPrice = computed(() =>
  formatNumberInput(directItemForm.value.estimatedUnitPrice),
);

const statCards = computed(() => [
  {
    label: "전체",
    value: statistics.value.totalCount,
    className: "border-border",
    accentClass: "bg-text-muted",
  },
  {
    label: "승인 대기",
    value: statistics.value.approvalWaitingCount,
    className: "border-warning/30 ",
    accentClass: "bg-warning",
  },
  {
    label: "발주",
    value: statistics.value.orderedCount,
    className: "border-primary/30 bg-primary/5",
    accentClass: "bg-primary",
  },
  {
    label: "완료",
    value: statistics.value.completedCount,
    className: "border-success/30 bg-success/5",
    accentClass: "bg-success",
  },
]);

const selectedEligibleTickets = computed(() =>
  eligibleTickets.value.filter((item) =>
    selectedTicketIds.value.includes(item.ticketId),
  ),
);

const planRequestItems = computed<PlanRequestItem[]>(() => [
  ...selectedEligibleTickets.value
    .filter((item) => item.canCreate && item.assetType)
    .map((item) => ({
      id: `ticket-${item.ticketId}`,
      source: "ticket" as const,
      sourceLabel: item.ticket.ticketNo,
      itemName: item.itemName,
      categoryName: item.categoryName,
      assetType: item.assetType!,
      quantity: item.quantity,
      estimatedUnitPrice: item.estimatedUnitPrice,
      estimatedAmount: item.estimatedUnitPrice * item.quantity,
      canRemove: true,
    })),
  ...directPlanItems.value.map((item) => ({
    id: item.localId,
    source: "direct" as const,
    sourceLabel: "직접 추가",
    itemName: item.itemName,
    categoryName: item.categoryName,
    assetType: item.assetType,
    quantity: item.quantity,
    estimatedUnitPrice: item.estimatedUnitPrice,
    estimatedAmount: item.estimatedUnitPrice * item.quantity,
    canRemove: true,
  })),
]);

const selectedEstimatedAmount = computed(() =>
  planRequestItems.value.reduce((sum, item) => sum + item.estimatedAmount, 0),
);

const selectedStatusForDropdown = computed(() => {
  if (nextStatus.value) return nextStatus.value;
  return "";
});

const canSaveSelectedStatus = computed(() => {
  if (!selectedPlan.value || !nextStatus.value || isStatusSaving.value)
    return false;
  return nextStatus.value !== displayPlanStatus(selectedPlan.value);
});

const statusActionOptions = computed<DropdownOption[]>(() => {
  if (!selectedPlan.value) return [];
  const currentStatus = displayPlanStatus(selectedPlan.value);
  const allowedNextStatuses =
    PURCHASE_PLAN_STATUS_TRANSITIONS[currentStatus] ?? [];
  return STATUS_ALL_OPTIONS.filter((opt) =>
    allowedNextStatuses.includes(opt.value as PurchasePlanStatus),
  );
});

const footerStatusActions = computed<FooterStatusAction[]>(() => {
  if (!selectedPlan.value || !canChangeStatus.value) return [];

  const currentStatus = displayPlanStatus(selectedPlan.value);

  if (currentStatus === "REQUESTED") {
    return [
      {
        key: "status-rejected",
        action: "change-status",
        status: "REJECTED",
        label: "반려",
        variant: "outline",
        className: "border-danger! text-danger! hover:bg-danger/5!",
      },
      { status: "APPROVED", label: "승인" },
    ];
  }

  if (currentStatus === "APPROVED") {
    return [
      {
        key: "status-ordered",
        action: "change-status",
        status: "ORDERED",
        label: "발주",
        variant: "outline",
        className:
          "border-primary! bg-white! text-primary! hover:bg-primary/5!",
      },
    ];
  }

  if (currentStatus === "ORDERED") {
    return [
      {
        key: "status-delivered",
        action: "change-status",
        status: "DELIVERED",
        label: "납품확인",
        variant: "outline",
        className:
          "border-primary! bg-white! text-primary! hover:bg-primary/5!",
      },
    ];
  }

  if (currentStatus === "DELIVERED") {
    const hasRegisterableItem = selectedPlanItems.value.some(
      canRegisterAssetFromItem,
    );

    return [
      ...(hasRegisterableItem
        ? [
            {
              key: "register-asset",
              action: "register-asset" as const,
              label: "자산 등록",
              variant: "outline" as const,
              className: "border-primary! text-primary! hover:bg-primary/5!",
            },
          ]
        : []),
      {
        key: "status-completed",
        action: "change-status",
        status: "COMPLETED",
        label: "완료",
      },
    ];
  }

  return [];
});

const purchasePlanTitle = computed(() => {
  if (!selectedPlan.value) return "구매 계획 상세";
  const firstItemName = selectedPlanItems.value[0]?.itemName;
  if (firstItemName) {
    const extraCount = selectedPlanItems.value.length - 1;
    return extraCount > 0
      ? `${firstItemName} 외 ${extraCount}건`
      : firstItemName;
  }
  return "구매 계획 상세";
});

const selectedPlanItems = computed(() => selectedPlan.value?.items ?? []);

const selectedPlanDeliveryDate = computed(() => {
  if (!selectedPlan.value) return null;
  const itemDeliveryDates = selectedPlanItems.value
    .map((item) => item.receivedAt)
    .filter((value): value is string => Boolean(value))
    .sort();

  return (
    selectedPlan.value.receivedAt ??
    selectedPlan.value.deliveredAt ??
    itemDeliveryDates.at(-1) ??
    null
  );
});

const hasTicketLinkedPlanItem = computed(() =>
  selectedPlanItems.value.some(
    (item) =>
      item.ticketId ||
      item.ticketRequesterId ||
      item.ticketDepartmentId,
  ),
);

const displayPlanItemColumns = computed(() => {
  if (hasTicketLinkedPlanItem.value) return planItemColumns;
  return planItemColumns.filter(
    (column) =>
      !["category", "ticketRequesterName", "ticketDepartmentName"].includes(
        String(column.key),
      ),
  );
});

const purchasePlanInfoItems = computed(() => {
  if (!selectedPlan.value) return [];

  return [
    { label: "구매 계획 번호", value: selectedPlan.value.planNo },
    { label: "신청 팀원", value: selectedPlan.value.requesterName || "-" },
    { label: "품목 수", value: `${selectedPlanItems.value.length}종` },
    { label: "생성 일시", value: formatDateTime(selectedPlan.value.createdAt) },
    { label: "수정 일시", value: formatDateTime(selectedPlan.value.updatedAt) },
    {
      label: "현재 상태",
      value: getStatusLabel(displayPlanStatus(selectedPlan.value)),
    },
  ];
});

const purchaseExecutionInfoItems = computed(() => {
  if (!selectedPlan.value) return [];

  const totalQuantity = selectedPlanItems.value.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const standardCount = selectedPlanItems.value.filter(
    (item) => item.isStandard !== false,
  ).length;
  const actualAmount =
    selectedPlan.value.actualAmount == null
      ? "-"
      : formatCurrency(selectedPlan.value.actualAmount);

  return [
    {
      label: "예상 금액",
      value: formatCurrency(selectedPlan.value.estimatedAmount),
    },
    { label: "실제 집행 금액", value: actualAmount },
    { label: "총 수량", value: `${totalQuantity}개` },
    {
      label: "납품 확인일",
      value: formatDateTime(selectedPlanDeliveryDate.value ?? ""),
    },
    { label: "표준 품목", value: `${standardCount}건` },
    {
      label: "비표준 품목",
      value: `${selectedPlan.value.items.length - standardCount}건`,
    },
  ];
});

const paginationItems = computed<Array<number | "ellipsis">>(() => {
  if (totalPages.value <= 7) {
    return Array.from({ length: totalPages.value }, (_, index) => index);
  }

  const items: Array<number | "ellipsis"> = [0];
  const start = Math.max(1, page.value - 1);
  const end = Math.min(totalPages.value - 2, page.value + 1);

  if (start > 1) items.push("ellipsis");
  for (let index = start; index <= end; index += 1) items.push(index);
  if (end < totalPages.value - 2) items.push("ellipsis");
  items.push(totalPages.value - 1);

  return items;
});

watch([page, pageSize, statusFilter, requesterFilter], () => {
  fetchPlans();
});

watch(
  () => [route.query.planId, route.query.purchasePlanId],
  ([planId, purchasePlanId]) => {
    const nextPlanId = parsePlanQueryId(
      getQueryString(planId) ?? getQueryString(purchasePlanId),
    );

    if (!nextPlanId) {
      selectedPlanId.value = null;
      selectedPlan.value = null;
      detailError.value = "";
      nextStatus.value = "";
      return;
    }

    if (selectedPlanId.value === nextPlanId) return;
    selectedPlanId.value = nextPlanId;
    selectedPlan.value = null;
    void fetchPlanDetail(nextPlanId);
  },
  { immediate: true },
);

onMounted(() => {
  refreshList();
  fetchAssetTeamMembers();
  fetchPurchaseCategoryOptions();
  fetchAssetRegisterReferenceData();
});

async function refreshList() {
  await Promise.all([fetchPlans(), fetchStatistics()]);
}

async function fetchPlans() {
  isListLoading.value = true;
  listError.value = "";

  try {
    const response = await purchaseApi.getPlans({
      page: page.value,
      size: pageSize.value,
      status: statusFilter.value || undefined,
      requesterId: requesterFilter.value || undefined,
      keyword: keyword.value || undefined,
    });

    plans.value = response.data.content;
    totalElements.value = response.data.totalElements;
    totalPages.value = response.data.totalPages;
  } catch (error) {
    listError.value = getErrorMessage(
      error,
      "구매 계획 목록을 불러오지 못했습니다.",
    );
  } finally {
    isListLoading.value = false;
  }
}

async function fetchStatistics() {
  try {
    const response = await purchaseApi.getStatistics();
    statistics.value = response.data;
  } catch {
    statistics.value = { ...EMPTY_STATISTICS };
  }
}

async function fetchAssetTeamMembers() {
  try {
    const response = await memberApi.getList({
      page: 0,
      size: 100,
      status: "ACTIVE",
    });
    assetTeamMembers.value = response.data.content.filter(
      (member) =>
        member.role === "ASSET_TEAM" ||
        member.role === "ASSET_MANAGER" ||
        (member.role === "ADMIN" && member.departmentName === "구매자산팀"),
    );
  } catch {
    assetTeamMembers.value = [];
  }
}

async function fetchPurchaseCategoryOptions() {
  const [tangibleResult, intangibleResult] = await Promise.allSettled([
    tangibleItemApi.getCategories(),
    intangibleItemApi.getCategories(),
  ]);

  if (tangibleResult.status === "fulfilled") {
    tangibleCategoryGroups.value = tangibleResult.value.data;
  } else {
    tangibleCategoryGroups.value = [];
  }

  if (intangibleResult.status === "fulfilled") {
    intangibleCategoryGroups.value = normalizeIntangibleCategoryGroups(
      intangibleResult.value.data,
    );
  } else {
    intangibleCategoryGroups.value = [];
  }
}

async function fetchAssetRegisterReferenceData() {
  try {
    const [departmentResult, memberResult] = await Promise.allSettled([
      departmentApi.getList({ size: 999 }),
      memberApi.getList({ size: 999, status: "ACTIVE" }),
    ]);

    if (departmentResult.status === "fulfilled") {
      departments.value = departmentResult.value.data.content;
    }

    if (memberResult.status === "fulfilled") {
      members.value = memberResult.value.data.content;
    }
  } catch {
    departments.value = [];
    members.value = [];
  }
}

async function fetchPlanDetail(planId: number | string) {
  isDetailLoading.value = true;
  detailError.value = "";

  try {
    const response = await purchaseApi.getPlanDetail(planId);
    selectedPlan.value = response.data;
    nextStatus.value = "";
  } catch (error) {
    detailError.value = getErrorMessage(
      error,
      "구매 계획 상세를 불러오지 못했습니다.",
    );
  } finally {
    isDetailLoading.value = false;
  }
}

function handleSearch() {
  keyword.value = keywordInput.value.trim();
  page.value = 0;
  fetchPlans();
}

function handlePageSizeChange(value: string | number) {
  pageSize.value = Number(value);
  page.value = 0;
}

function handleStatusChange(value: string | number) {
  statusFilter.value = toStatusOption(value);
  page.value = 0;
}

function handleRequesterChange(value: string | number) {
  requesterFilter.value = String(value);
  page.value = 0;
}

function openDetail(row: PurchasePlanListItem) {
  void router.push({
    name: "Purchase",
    query: {
      ...route.query,
      planId: String(row.planId),
    },
  });
}

function closeDetail() {
  const query = { ...route.query };
  delete query.planId;
  delete query.purchasePlanId;
  void router.replace({ name: "Purchase", query });
  refreshList();
}

function openCreateDrawer() {
  if (!canCreatePurchasePlan.value) return;

  isCreateDrawerOpen.value = true;
  selectedTicketIds.value = [];
  directPlanItems.value = [];
  resetDirectItemForm();
  void fetchPurchaseCategoryOptions();
  fetchEligibleTickets();
}

function closeCreateDrawer() {
  isCreateDrawerOpen.value = false;
  selectedTicketIds.value = [];
  directPlanItems.value = [];
  eligibleError.value = "";
  directItemError.value = "";
}

async function fetchEligibleTickets() {
  isEligibleLoading.value = true;
  eligibleError.value = "";

  try {
    const response = await ticketApi.getPurchasePlanCandidates({
      page: 0,
      size: 100,
    });

    eligibleTickets.value = response.data.content.map(toEligibleTicket);
  } catch (error) {
    eligibleError.value = getErrorMessage(
      error,
      "구매 계획 대상 요청을 불러오지 못했습니다.",
    );
  } finally {
    isEligibleLoading.value = false;
  }
}

function toEligibleTicket(ticket: PurchasePlanCandidateTicket): EligibleTicket {
  const itemName =
    ticket.itemName ||
    ticket.requestedItemName ||
    ticket.requestedItemDetail ||
    ticket.productName ||
    "";
  const quantity = ticket.quantity ?? 1;
  const estimatedUnitPrice =
    ticket.estimatedUnitPrice ??
    ticket.expectedPrice ??
    ticket.purchasePrice ??
    ticket.unitPrice ??
    0;
  const assetItemIds = resolvePurchasePlanCandidateItemIds(ticket);
  const disabledReasons: string[] = [];

  if (!ticket.assetType) disabledReasons.push("자산 유형 없음");
  if (!estimatedUnitPrice) disabledReasons.push("예상 단가 없음");
  if (
    ticket.isStandard !== false &&
    ticket.isStandard !== 0 &&
    !assetItemIds.assetItemId
  ) {
    disabledReasons.push("자산 품목 ID 없음");
  }

  return {
    ticketId: ticket.ticketId,
    ticket,
    itemName,
    categoryName: ticket.categoryName || "",
    assetType: ticket.assetType,
    quantity,
    estimatedUnitPrice,
    assetItemId: assetItemIds.assetItemId,
    tangibleAssetItemId: assetItemIds.tangibleAssetItemId,
    intangibleAssetItemId: assetItemIds.intangibleAssetItemId,
    isStandard: ticket.isStandard !== false && ticket.isStandard !== 0,
    canCreate: disabledReasons.length === 0,
    disabledReason: disabledReasons.join(", "),
  };
}

function toggleTicketSelection(ticketId: string) {
  if (selectedTicketIds.value.includes(ticketId)) {
    selectedTicketIds.value = selectedTicketIds.value.filter(
      (id) => id !== ticketId,
    );
    return;
  }

  selectedTicketIds.value = [...selectedTicketIds.value, ticketId];
}

function handleEligibleTicketRowClick(request: EligibleTicket) {
  if (!request.canCreate) return;
  toggleTicketSelection(request.ticketId);
}

function handleStatusSelect(value: string | number) {
  nextStatus.value = toStatusOption(value);
}

function handleDirectCategoryChange(value: string | number) {
  directItemForm.value.categoryName = String(value);
}

function resetDirectItemForm() {
  directItemForm.value = {
    itemName: "",
    categoryName: "",
    assetType: "TANGIBLE",
    quantity: "1",
    estimatedUnitPrice: "",
    externalUrl: "",
  };
  directItemError.value = "";
}

function handleDirectAssetTypeChange(value: string | number) {
  directItemForm.value.assetType =
    value === "INTANGIBLE" ? "INTANGIBLE" : "TANGIBLE";
  directItemForm.value.categoryName = "";
}

function handleDirectEstimatedUnitPriceInput(event: Event) {
  const target = event.target as HTMLInputElement;
  directItemForm.value.estimatedUnitPrice = normalizeNumberInput(target.value);
}

function addDirectPlanItem() {
  directItemError.value = "";
  const itemName = directItemForm.value.itemName.trim();
  const quantity = Number(directItemForm.value.quantity);
  const estimatedUnitPrice = Number(directItemForm.value.estimatedUnitPrice);

  if (!itemName) {
    directItemError.value = "품목명을 입력해주세요.";
    return;
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    directItemError.value = "수량은 1개 이상 입력해주세요.";
    return;
  }

  if (!Number.isFinite(estimatedUnitPrice) || estimatedUnitPrice <= 0) {
    directItemError.value = "예상 단가는 1원 이상 입력해주세요.";
    return;
  }

  directPlanItems.value = [
    ...directPlanItems.value,
    {
      localId: `direct-${Date.now()}-${directPlanItems.value.length}`,
      itemName,
      categoryName: "",
      assetType: directItemForm.value.assetType,
      quantity,
      estimatedUnitPrice,
      externalUrl: directItemForm.value.externalUrl.trim() || null,
    },
  ];
  resetDirectItemForm();
}

function removePlanRequestItem(id: string) {
  if (id.startsWith("ticket-")) {
    const ticketId = id.replace("ticket-", "");
    selectedTicketIds.value = selectedTicketIds.value.filter(
      (tid) => tid !== ticketId,
    );
  } else {
    directPlanItems.value = directPlanItems.value.filter(
      (item) => item.localId !== id,
    );
  }
}

async function createPlan() {
  if (!canCreatePurchasePlan.value) return;

  const ticketItems: PurchasePlanCreateItem[] = selectedEligibleTickets.value
    .filter((item) => item.canCreate && item.assetType)
    .map((item) => ({
      ticketId: item.ticketId,
      productName: item.itemName,
      assetType: item.assetType!,
      assetItemId: item.assetItemId,
      quantity: item.quantity,
      isStandard: item.isStandard ? 1 : 0,
      estimatedUnitPrice: item.estimatedUnitPrice,
      estimatedAmount: item.estimatedUnitPrice * item.quantity,
      externalUrl: null,
    }));

  const directItems: PurchasePlanCreateItem[] = directPlanItems.value.map(
    (item) => {
      return {
        ticketId: null,
        productName: item.itemName,
        assetType: item.assetType,
        assetItemId: null,
        quantity: item.quantity,
        isStandard: 0,
        estimatedUnitPrice: item.estimatedUnitPrice,
        estimatedAmount: item.estimatedUnitPrice * item.quantity,
        externalUrl: item.externalUrl,
      };
    },
  );

  const items = [...ticketItems, ...directItems];

  if (items.length === 0) return;

  isCreatingPlan.value = true;

  try {
    const response = await purchaseApi.createPlan({ items });
    closeCreateDrawer();
    await refreshList();
    void router.push({
      name: "Purchase",
      query: {
        ...route.query,
        planId: String(response.data.planId),
      },
    });
  } catch (error) {
    eligibleError.value = getErrorMessage(
      error,
      "구매 계획 등록에 실패했습니다.",
    );
  } finally {
    isCreatingPlan.value = false;
  }
}

async function reviewPlan(status: PurchasePlanStatus) {
  if (status === "DELIVERED") {
    openActualAmountDrawer();
    return;
  }

  pendingReviewStatus.value = status;
  await changeStatus(status);
  pendingReviewStatus.value = null;
}

async function handleFooterAction(action: FooterStatusAction) {
  if (action.action === "register-asset") {
    openFirstAssetRegisterDrawer();
    return;
  }

  if (action.status) {
    await reviewPlan(action.status);
  }
}

function changeSelectedStatus() {
  if (!nextStatus.value) return;
  void reviewPlan(nextStatus.value);
}

async function changeStatus(
  status: PurchasePlanStatus,
  data: { actualAmount?: number } = {},
) {
  if (!selectedPlanId.value) return false;
  isStatusSaving.value = true;

  try {
    await purchaseApi.changePlanStatus(selectedPlanId.value, {
      status,
      ...data,
    });
    nextStatus.value = "";
    await fetchPlanDetail(selectedPlanId.value);
    await refreshList();
    return true;
  } catch (error) {
    detailError.value = getErrorMessage(error, "상태 변경에 실패했습니다.");
    return false;
  } finally {
    isStatusSaving.value = false;
  }
}

function openActualAmountDrawer() {
  actualAmountInput.value = formatAmountInput(
    selectedPlan.value?.actualAmount ?? selectedPlan.value?.estimatedAmount,
  );
  actualAmountError.value = "";
  isActualAmountDrawerOpen.value = true;
}

function closeActualAmountDrawer() {
  if (isStatusSaving.value) return;
  isActualAmountDrawerOpen.value = false;
  actualAmountError.value = "";
}

async function submitActualAmount() {
  const actualAmount = parseAmountInput(actualAmountInput.value);
  if (!Number.isFinite(actualAmount) || actualAmount <= 0) {
    actualAmountError.value = "실제 결제금액을 입력해주세요.";
    return;
  }

  actualAmountError.value = "";
  pendingReviewStatus.value = "DELIVERED";
  const isChanged = await changeStatus("DELIVERED", { actualAmount });
  pendingReviewStatus.value = null;

  if (isChanged) {
    isActualAmountDrawerOpen.value = false;
  }
}

function handleActualAmountInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const cursor = target.selectionStart ?? target.value.length;
  const digitCountBeforeCursor = target.value
    .slice(0, cursor)
    .replace(/[^\d]/g, "").length;

  actualAmountInput.value = formatAmountInput(parseAmountInput(target.value));
  actualAmountError.value = "";

  void nextTick(() => {
    const nextCursor = findFormattedCursorPosition(
      actualAmountInput.value,
      digitCountBeforeCursor,
    );
    target.setSelectionRange(nextCursor, nextCursor);
  });
}

function parseAmountInput(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function formatAmountInput(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("ko-KR").format(value);
}

function findFormattedCursorPosition(value: string, digitCount: number) {
  if (digitCount <= 0) return 0;

  let seenDigits = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) {
      seenDigits += 1;
    }
    if (seenDigits >= digitCount) {
      return index + 1;
    }
  }

  return value.length;
}

async function confirmDelivery(item: PurchasePlanItem) {
  const itemId = getPurchasePlanItemId(item);
  if (!selectedPlanId.value || itemId == null) return;
  isConfirmingItem.value = itemId;

  try {
    await purchaseApi.confirmDelivery(selectedPlanId.value, itemId);
    await fetchPlanDetail(selectedPlanId.value);
    await refreshList();
  } catch (error) {
    detailError.value = getErrorMessage(error, "납품 확인에 실패했습니다.");
  } finally {
    isConfirmingItem.value = null;
  }
}

function canConfirmDelivery(item: PurchasePlanItem) {
  if (
    !canChangeStatus.value ||
    getPurchasePlanItemId(item) == null ||
    item.receivedAt
  )
    return false;
  if (!selectedPlan.value) return false;

  const confirmableStatuses: PurchasePlanStatus[] = ["ORDERED"];
  return confirmableStatuses.includes(displayPlanStatus(selectedPlan.value));
}

function canRegisterAssetFromItem(item: PurchasePlanItem) {
  void item;
  if (!selectedPlan.value) return false;
  return displayPlanStatus(selectedPlan.value) === "DELIVERED";
}

function isPurchaseItemDeliverySettled(item: PurchasePlanItem) {
  if (item.receivedAt) return true;
  if (!selectedPlan.value) return false;
  return displayPlanStatus(selectedPlan.value) === "COMPLETED";
}

function isConfirmingPurchaseItem(item: PurchasePlanItem) {
  const itemId = getPurchasePlanItemId(item);
  return (
    isConfirmingItem.value !== null &&
    itemId !== null &&
    isConfirmingItem.value === itemId
  );
}

function displayListStatus(plan: PurchasePlanListItem): PurchasePlanStatus {
  return plan.status || plan.purchaseRequestStatus || "REQUESTED";
}

function displayPlanStatus(plan: PurchasePlanDetail): PurchasePlanStatus {
  return plan.status || plan.purchaseRequestStatus || "REQUESTED";
}

function getStatusLabel(status: PurchasePlanStatus) {
  return STATUS_LABEL[status];
}

function getStatusBadgeClass(status: PurchasePlanStatus) {
  if (status === "APPROVED")
    return "border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/35 dark:text-sky-200";
  if (status === "REJECTED")
    return "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200";
  if (status === "CANCELLED")
    return "border border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300";
  if (status === "ORDERED")
    return "border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200";
  if (status === "DELIVERED")
    return "border border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-200";
  if (status === "COMPLETED")
    return "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200";
  return "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200";
}

function toStatusOption(value: string | number): PurchasePlanStatus | "" {
  const status = String(value);
  return Object.hasOwn(STATUS_LABEL, status)
    ? (status as PurchasePlanStatus)
    : "";
}

function parseAssetItemId(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function resolvePurchasePlanCandidateItemIds(ticket: PurchasePlanCandidateTicket) {
  const assetItemId = parseAssetItemId(ticket.assetItemId);
  const tangibleAssetItemId = parseAssetItemId(ticket.tangibleAssetItemId);
  const intangibleAssetItemId = parseAssetItemId(ticket.intangibleAssetItemId);

  if (ticket.assetType === "INTANGIBLE") {
    const resolvedIntangibleItemId = intangibleAssetItemId ?? assetItemId;
    return {
      assetItemId: assetItemId ?? resolvedIntangibleItemId,
      tangibleAssetItemId: null,
      intangibleAssetItemId: resolvedIntangibleItemId,
    };
  }

  const resolvedTangibleItemId = tangibleAssetItemId ?? assetItemId;
  return {
    assetItemId: assetItemId ?? resolvedTangibleItemId,
    tangibleAssetItemId: resolvedTangibleItemId,
    intangibleAssetItemId: null,
  };
}

function getPurchasePlanItemId(item: PurchasePlanItem | null | undefined) {
  const itemId = item?.itemId ?? item?.purchasePlanItemId ?? item?.id;
  if (itemId === null || itemId === undefined) return null;
  const normalized = String(itemId).trim();
  return normalized || null;
}

function normalizeNumberInput(value: string) {
  return value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
}

function formatNumberInput(value: string) {
  const normalized = normalizeNumberInput(value);
  if (!normalized) return "";
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function categoryGroupsToOptions(groups: unknown): DropdownOption[] {
  return [...new Set(collectCategoryNames(groups))].map((name) => ({
    label: name,
    value: name,
  }));
}

function collectCategoryNames(value: unknown): string[] {
  if (typeof value === "string") {
    const name = value.trim();
    return name ? [name] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectCategoryNames);
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const category = value as Record<string, unknown>;
  const names = [
    ...collectCategoryNames(category.mainCategory),
    ...collectCategoryNames(category.name),
    ...collectCategoryNames(category.categoryName),
    ...collectCategoryNames(category.children),
    ...collectCategoryNames(category.subCategories),
  ];

  if (
    category.childCategories &&
    typeof category.childCategories === "object"
  ) {
    Object.entries(category.childCategories).forEach(([name, children]) => {
      names.push(...collectCategoryNames(name));
      names.push(...collectCategoryNames(children));
    });
  }

  return names;
}

function normalizeIntangibleCategoryGroups(
  categories: IntangibleCategoryGroup[] | string[],
): IntangibleCategoryGroup[] {
  if (!categories.length) return [];

  if (typeof categories[0] === "string") {
    return (categories as string[]).map((category) => ({
      mainCategory: category,
      subCategories: [],
    }));
  }

  return categories as IntangibleCategoryGroup[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

function getQueryString(value: unknown) {
  if (Array.isArray(value))
    return typeof value[0] === "string" ? value[0] : null;
  return typeof value === "string" && value.trim() ? value : null;
}

function parsePlanQueryId(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : value;
}

// ─── 자산 등록 패널 ────────────────────────────────────────────────────────────

const isAssetRegisterDrawerOpen = ref(false);
const assetRegisterTargetItem = ref<PurchasePlanItem | null>(null);

async function handlePurchaseAssetRegistered() {
  const planId = selectedPlan.value?.planId;
  closeAssetRegisterDrawer();

  if (planId) {
    await fetchPlanDetail(planId);
  }
  await refreshList();
}

function openAssetRegisterDrawer(item: PurchasePlanItem) {
  assetRegisterTargetItem.value = item;
  isAssetRegisterDrawerOpen.value = true;
  void fetchAssetRegisterReferenceData();
}

function openFirstAssetRegisterDrawer() {
  const targetItem = selectedPlanItems.value.find(canRegisterAssetFromItem);
  if (!targetItem) return;
  openAssetRegisterDrawer(targetItem);
}

function closeAssetRegisterDrawer() {
  isAssetRegisterDrawerOpen.value = false;
  assetRegisterTargetItem.value = null;
}
</script>
