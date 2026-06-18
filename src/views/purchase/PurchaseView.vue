<template>
  <div class="flex h-full min-h-0 flex-col bg-background text-text-main">
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
                      신청 팀원 {{ selectedPlan.requesterName || '-' }} · 생성일
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
                    :columns="planItemColumns"
                    :rows="selectedPlan.items"
                    row-key="itemId"
                    empty-text="구매 품목이 없습니다."
                    class="rounded-none! border-0! [&_table]:min-w-[860px]"
                  >
                    <template #cell-category="{ value }">
                      <span class="text-text-sub">{{ value || "-" }}</span>
                    </template>

                    <template #cell-itemName="{ value }">
                      <span class="font-semibold text-text-main">{{
                        value
                      }}</span>
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
                      <div v-if="row.receivedAt" class="flex flex-col items-center gap-1">
                        <span class="text-xs font-semibold text-success">
                          {{ formatDate(row.receivedAt) }}
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
                      <Button
                        v-else
                        variant="outline"
                        size="sm"
                        :disabled="
                          !canConfirmDelivery(row) ||
                          isConfirmingItem === row.itemId
                        "
                        :loading="isConfirmingItem === row.itemId"
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
          <Button @click="openCreateDrawer">
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

              <template #cell-itemSummary="{ row }">
                <span class="line-clamp-1 font-semibold text-text-main">{{
                  row.itemSummary || "-"
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
      v-if="selectedPlanId && canApprovePlan"
      class="flex min-h-14 w-full shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border bg-surface px-6 py-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
    >
      <Button
        variant="outline"
        class="shrink-0 border-danger! text-danger! hover:bg-danger/5!"
        :disabled="!canReviewCurrentPlan || isStatusSaving"
        :loading="isStatusSaving && pendingReviewStatus === 'REJECTED'"
        @click="reviewPlan('REJECTED')"
      >
        반려
      </Button>
      <Button
        class="shrink-0"
        :disabled="!canReviewCurrentPlan || isStatusSaving"
        :loading="isStatusSaving && pendingReviewStatus === 'APPROVED'"
        @click="reviewPlan('APPROVED')"
      >
        승인
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
            class="h-full max-w-full rounded-xl! [&_table]:table-fixed [&_td]:align-middle [&_th]:whitespace-nowrap"
            @row-click="handleEligibleTicketRowClick"
          >
            <template #cell-select="{ row }">
              <input
                type="checkbox"
                class="pointer-events-none h-4 w-4 rounded border-border text-primary focus:ring-primary"
                :checked="selectedTicketIds.includes(row.ticketId)"
                :disabled="!row.canCreate"
                :aria-label="`${row.ticket.ticketNo} 선택`"
                tabindex="-1"
              />
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

            <template #cell-validation="{ row }">
              <span
                v-if="row.canCreate"
                class="whitespace-nowrap text-xs font-semibold text-success"
                >등록 가능</span
              >
              <span
                v-else
                class="block truncate text-xs font-semibold text-danger"
                :title="row.disabledReason"
              >
                {{ row.disabledReason }}
              </span>
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

            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
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
              <Input
                id="direct-plan-category"
                v-model="directItemForm.categoryName"
                label="분류"
                placeholder="예: 노트북"
                :disabled="isCreatingPlan"
              />
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
              <Input
                id="direct-plan-quantity"
                v-model="directItemForm.quantity"
                type="number"
                :min="1"
                label="수량"
                required
                :disabled="isCreatingPlan"
              />
              <Input
                id="direct-plan-unit-price"
                v-model="directItemForm.estimatedUnitPrice"
                :min="1"
                label="예상 단가"
                required
                placeholder="0"
                :disabled="isCreatingPlan"
              />
              <div class="md:col-span-2 xl:col-span-5">
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

            <div v-else class="overflow-x-auto rounded-xl border border-border">
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
                    @click="removeDirectPlanItem(item.id)"
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
          <div class="flex justify-end gap-2">
            <Button variant="outline" @click="closeCreateDrawer">취소</Button>
            <Button
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
      :is-open="isAssetRegisterDrawerOpen"
      title="자산 등록 및 할당"
      panel-class="w-full max-w-xl"
      body-class="min-h-0 overflow-hidden! p-0"
      hide-footer
      @close="closeAssetRegisterDrawer"
    >
      <div class="flex h-full flex-col">
        <!-- 자산 유형 탭 -->
        <div class="flex shrink-0 border-b border-border">
          <button
            type="button"
            :class="[
              'flex-1 py-3 text-sm font-semibold transition-colors',
              assetRegisterTab === 'TANGIBLE'
                ? 'border-b-2 border-primary text-primary'
                : 'text-text-sub hover:text-text-main',
            ]"
            @click="assetRegisterTab = 'TANGIBLE'"
          >
            유형자산
          </button>
          <button
            type="button"
            :class="[
              'flex-1 py-3 text-sm font-semibold transition-colors',
              assetRegisterTab === 'INTANGIBLE'
                ? 'border-b-2 border-primary text-primary'
                : 'text-text-sub hover:text-text-main',
            ]"
            @click="assetRegisterTab = 'INTANGIBLE'"
          >
            무형자산
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <!-- 품목 정보 표시 -->
          <div v-if="assetRegisterTargetItem" class="rounded-xl bg-surface-secondary px-4 py-3 text-sm">
            <p class="text-xs font-semibold text-text-muted mb-1">등록 대상 품목</p>
            <p class="font-semibold text-text-main">{{ assetRegisterTargetItem.itemName }}</p>
            <p class="text-xs text-text-sub mt-0.5">{{ assetRegisterTargetItem.category || '-' }}</p>
          </div>

          <!-- 유형자산 폼 -->
          <template v-if="assetRegisterTab === 'TANGIBLE'">
            <section class="space-y-4">
              <h3 class="text-sm font-bold text-text-main flex items-center gap-2">
                <span class="inline-block h-4 w-1 rounded-full bg-primary"></span>
                기본 정보
              </h3>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="tangible-serial-number"
                  v-model="tangibleForm.serialNumber"
                  label="시리얼 번호"
                  required
                  placeholder="SN-20260101-001"
                  :disabled="isRegisteringAsset"
                />
                <Input
                  id="tangible-location"
                  v-model="tangibleForm.location"
                  label="위치"
                  required
                  placeholder="예: 본사 3층 개발팀"
                  :disabled="isRegisteringAsset"
                />
                <Input
                  id="tangible-purchase-date"
                  v-model="tangibleForm.purchaseDate"
                  type="date"
                  label="구매일"
                  required
                  :disabled="isRegisteringAsset"
                />
                <Input
                  id="tangible-purchase-price"
                  v-model="tangibleForm.purchasePrice"
                  type="number"
                  label="구매 금액"
                  required
                  placeholder="0"
                  :disabled="isRegisteringAsset"
                />
                <Input
                  id="tangible-purchase-vendor"
                  v-model="tangibleForm.purchaseVendor"
                  label="구매처"
                  required
                  placeholder="예: 삼성전자"
                  :disabled="isRegisteringAsset"
                />
                <Input
                  id="tangible-warranty"
                  v-model="tangibleForm.warrantyExpiredAt"
                  type="date"
                  label="보증 만료일"
                  required
                  :disabled="isRegisteringAsset"
                />
                <div class="space-y-2">
                  <label class="block px-0.5 text-sm font-semibold text-text-main">사용 유형</label>
                  <Dropdown
                    id="tangible-usage-type"
                    :model-value="tangibleForm.usageType"
                    :options="TANGIBLE_USAGE_TYPE_OPTIONS"
                    :disabled="isRegisteringAsset"
                    @update:model-value="(v) => tangibleForm.usageType = String(v)"
                  />
                </div>
                <div class="space-y-2">
                  <label class="block px-0.5 text-sm font-semibold text-text-main">자산 사용 구분</label>
                  <Dropdown
                    id="tangible-asset-usage-type"
                    :model-value="tangibleForm.assetUsageType"
                    :options="TANGIBLE_ASSET_USAGE_TYPE_OPTIONS"
                    :disabled="isRegisteringAsset"
                    @update:model-value="(v) => tangibleForm.assetUsageType = String(v)"
                  />
                </div>
              </div>
            </section>

            <section class="space-y-4">
              <h3 class="text-sm font-bold text-text-main flex items-center gap-2">
                <span class="inline-block h-4 w-1 rounded-full bg-text-muted"></span>
                사용 정보
                <span class="text-xs font-normal text-text-muted">(선택)</span>
              </h3>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="tangible-member-id"
                  v-model="tangibleForm.memberId"
                  label="사용자 ID"
                  placeholder="멤버 UUID"
                  :disabled="isRegisteringAsset"
                />
                <Input
                  id="tangible-department-id"
                  v-model="tangibleForm.departmentId"
                  label="부서 ID"
                  placeholder="부서 UUID"
                  :disabled="isRegisteringAsset"
                />
                <Input
                  id="tangible-used-started-at"
                  v-model="tangibleForm.usedStartedAt"
                  type="date"
                  label="사용 시작일"
                  :disabled="isRegisteringAsset"
                />
                <Input
                  id="tangible-return-due-date"
                  v-model="tangibleForm.returnDueDate"
                  type="date"
                  label="반납 예정일"
                  :disabled="isRegisteringAsset"
                />
              </div>
            </section>
          </template>

          <!-- 무형자산 폼 -->
          <template v-else>
            <section class="space-y-4">
              <h3 class="text-sm font-bold text-text-main flex items-center gap-2">
                <span class="inline-block h-4 w-1 rounded-full bg-primary"></span>
                기본 정보
              </h3>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="intangible-seat-count"
                  v-model="intangibleForm.seatCount"
                  type="number"
                  label="최대 사용 인원"
                  required
                  placeholder="1"
                  :disabled="isRegisteringAsset"
                />
                <Input
                  id="intangible-purchase-date"
                  v-model="intangibleForm.purchaseDate"
                  type="date"
                  label="구매일"
                  required
                  :disabled="isRegisteringAsset"
                />
                <Input
                  id="intangible-purchase-price"
                  v-model="intangibleForm.purchasePrice"
                  type="number"
                  label="구매 금액"
                  required
                  placeholder="0"
                  :disabled="isRegisteringAsset"
                />
                <Input
                  id="intangible-purchase-vendor"
                  v-model="intangibleForm.purchaseVendor"
                  label="구매처"
                  required
                  placeholder="예: Microsoft Korea"
                  :disabled="isRegisteringAsset"
                />
                <div class="space-y-2">
                  <label class="block px-0.5 text-sm font-semibold text-text-main">자동 연장</label>
                  <Dropdown
                    id="intangible-auto-renewal"
                    :model-value="intangibleForm.isAutoRenewal"
                    :options="AUTO_RENEWAL_OPTIONS"
                    :disabled="isRegisteringAsset"
                    @update:model-value="(v) => intangibleForm.isAutoRenewal = Number(v)"
                  />
                </div>
                <div class="space-y-2">
                  <label class="block px-0.5 text-sm font-semibold text-text-main">결제 주기</label>
                  <Dropdown
                    id="intangible-billing-cycle"
                    :model-value="intangibleForm.billingCycle"
                    :options="BILLING_CYCLE_OPTIONS"
                    :disabled="isRegisteringAsset"
                    @update:model-value="(v) => intangibleForm.billingCycle = String(v)"
                  />
                </div>
              </div>
            </section>

            <section class="space-y-4">
              <h3 class="text-sm font-bold text-text-main flex items-center gap-2">
                <span class="inline-block h-4 w-1 rounded-full bg-text-muted"></span>
                사용 정보
                <span class="text-xs font-normal text-text-muted">(선택)</span>
              </h3>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="intangible-license-code"
                  v-model="intangibleForm.licenseCode"
                  label="라이선스 코드"
                  placeholder="IA-LIC-001"
                  :disabled="isRegisteringAsset"
                />
                <Input
                  id="intangible-member-id"
                  v-model="intangibleForm.memberId"
                  label="사용자 ID"
                  placeholder="멤버 UUID"
                  :disabled="isRegisteringAsset"
                />
                <Input
                  id="intangible-department-id"
                  v-model="intangibleForm.departmentId"
                  label="부서 ID"
                  placeholder="부서 UUID"
                  :disabled="isRegisteringAsset"
                />
                <Input
                  id="intangible-started-at"
                  v-model="intangibleForm.startedAt"
                  type="date"
                  label="사용 시작일"
                  :disabled="isRegisteringAsset"
                />
                <Input
                  id="intangible-expired-at"
                  v-model="intangibleForm.expiredAt"
                  type="date"
                  label="만료 예정일"
                  :disabled="isRegisteringAsset"
                />
              </div>
            </section>
          </template>

          <p v-if="assetRegisterError" class="text-xs font-semibold text-danger">
            {{ assetRegisterError }}
          </p>
        </div>

        <div class="shrink-0 border-t border-border px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" :disabled="isRegisteringAsset" @click="closeAssetRegisterDrawer">취소</Button>
          <Button :loading="isRegisteringAsset" @click="submitAssetRegister">등록</Button>
        </div>
      </div>
    </BaseDrawer>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  Box as BoxIcon,
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
  Trash2,
} from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { ApiError, memberApi, purchaseApi, ticketApi, tangibleAssetApi, intangibleAssetApi } from "@/api";
import BaseDrawer from "@/components/common/BaseDrawer.vue";
import Button from "@/components/common/Button.vue";
import Dropdown from "@/components/common/Dropdown.vue";
import Input from "@/components/common/Input.vue";
import Table, { type Column } from "@/components/common/Table.vue";
import TicketDetailCard from "@/components/ticket/TicketDetailCard.vue";
import { usePermission } from "@/composables/usePermission";
import type {
  AssetType,
  BillingCycle,
  DropdownOption,
  Member,
  PurchasePlanCreateItem,
  PurchasePlanDetail,
  PurchasePlanItem,
  PurchasePlanListItem,
  PurchasePlanStatistics,
  PurchasePlanStatus,
  TangibleAssetCreateRequest,
  IntangibleAssetCreateRequest,
  TicketListItem,
} from "@/types";

interface EligibleTicket {
  ticketId: string;
  ticket: TicketListItem;
  itemName: string;
  categoryName: string;
  assetType: TicketListItem["assetType"];
  quantity: number;
  estimatedUnitPrice: number;
  assetItemId: string | null;
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

const PAGE_SIZE_OPTIONS: DropdownOption[] = [
  { label: "10개씩 보기", value: 10 },
  { label: "20개씩 보기", value: 20 },
  { label: "50개씩 보기", value: 50 },
];

const ASSET_TYPE_OPTIONS: DropdownOption[] = [
  { label: "유형자산", value: "TANGIBLE" },
  { label: "무형자산", value: "INTANGIBLE" },
];

const TANGIBLE_USAGE_TYPE_OPTIONS: DropdownOption[] = [
  { label: "임시 (TEMPORARY)", value: "TEMPORARY" },
  { label: "영구 (PERMANENT)", value: "PERMANENT" },
];

const TANGIBLE_ASSET_USAGE_TYPE_OPTIONS: DropdownOption[] = [
  { label: "개인 (PERSONAL)", value: "PERSONAL" },
  { label: "부서 공용 (DEPARTMENT)", value: "DEPARTMENT" },
];

const AUTO_RENEWAL_OPTIONS: DropdownOption[] = [
  { label: "자동 연장", value: 1 },
  { label: "수동 갱신", value: 0 },
];

const BILLING_CYCLE_OPTIONS: DropdownOption[] = [
  { label: "월별", value: "MONTHLY" },
  { label: "연별", value: "YEARLY" },
  { label: "일회성", value: "ONE_TIME" },
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

const PURCHASE_PLAN_STATUS_TRANSITIONS: Record<PurchasePlanStatus, PurchasePlanStatus[]> = {
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
  { key: "itemSummary", label: "요청 품목", width: "28%", align: "center" },
  { key: "requesterName", label: "신청 팀원", width: "14%", align: "center" },
  { key: "itemCount", label: "품목 수", width: "10%", align: "center" },
  { key: "estimatedAmount", label: "예상 금액", width: "16%", align: "center" },
  { key: "status", label: "상태", width: "12%", align: "center" },
];

const planItemColumns: Column<PurchasePlanItem>[] = [
  { key: "category", label: "분류", width: "14%", align: "center" },
  { key: "itemName", label: "품목", width: "24%", align: "center" },
  { key: "isStandard", label: "표준 여부", width: "12%", align: "center" },
  { key: "quantity", label: "수량", width: "10%", align: "center" },
  { key: "estimatedUnitPrice", label: "단가", width: "14%", align: "center" },
  { key: "totalAmount", label: "합계", width: "14%", align: "center" },
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
    width: "12%",
    align: "center",
  },
  { key: "validation", label: "확인", width: "10%", align: "center" },
];

const EMPTY_STATISTICS: PurchasePlanStatistics = {
  totalCount: 0,
  requestedCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
  orderedCount: 0,
  deliveredCount: 0,
  completedCount: 0,
  cancelledCount: 0,
};

const { hasRole } = usePermission();
const route = useRoute();
const router = useRouter();
const canApprovePlan = computed(() =>
  hasRole("ADMIN", "SUPER_ADMIN", "ASSET_MANAGER"),
);
const canChangeStatus = computed(() =>
  hasRole("ADMIN", "SUPER_ADMIN", "ASSET_MANAGER"),
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

const selectedPlanId = ref<number | string | null>(null);
const selectedPlan = ref<PurchasePlanDetail | null>(null);
const isDetailLoading = ref(false);
const detailError = ref("");
const nextStatus = ref<PurchasePlanStatus | "">("");
const isStatusSaving = ref(false);
const pendingReviewStatus = ref<PurchasePlanStatus | null>(null);
const isConfirmingItem = ref<number | string | null>(null);

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

const statCards = computed(() => [
  {
    label: "전체",
    value: statistics.value.totalCount,
    className: "border-border",
    accentClass: "bg-text-muted",
  },
  {
    label: "승인 대기",
    value: statistics.value.requestedCount,
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
    value: statistics.value.deliveredCount,
    className: "border-success/30 bg-success/5",
    accentClass: "bg-success",
  },
]);

const selectedEligibleTickets = computed(() =>
  eligibleTickets.value.filter((item) =>
    selectedTicketIds.value.includes(item.ticket.ticketId),
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
      canRemove: false,
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

const canReviewCurrentPlan = computed(() => {
  if (!selectedPlan.value) return false;
  return displayPlanStatus(selectedPlan.value) === "REQUESTED";
});

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
  const allowedNextStatuses = PURCHASE_PLAN_STATUS_TRANSITIONS[currentStatus] ?? [];
  return STATUS_ALL_OPTIONS.filter((opt) =>
    allowedNextStatuses.includes(opt.value as PurchasePlanStatus),
  );
});

const purchasePlanTitle = computed(() => {
  if (!selectedPlan.value) return "구매 계획 상세";
  const firstItemName = selectedPlan.value.items[0]?.itemName;
  if (firstItemName) {
    const extraCount = selectedPlan.value.items.length - 1;
    return extraCount > 0
      ? `${firstItemName} 외 ${extraCount}건`
      : firstItemName;
  }
  return "구매 계획 상세";
});

const purchasePlanInfoItems = computed(() => {
  if (!selectedPlan.value) return [];

  return [
    { label: "구매 계획 번호", value: selectedPlan.value.planNo },
    { label: "신청 팀원", value: selectedPlan.value.requesterName || "-" },
    { label: "품목 수", value: `${selectedPlan.value.items.length}종` },
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

  const totalQuantity = selectedPlan.value.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const deliveredCount = selectedPlan.value.items.filter(
    (item) => item.receivedAt,
  ).length;
  const standardCount = selectedPlan.value.items.filter(
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
    { label: "납품 확인", value: `${selectedPlan.value.items.length}건` },
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
});

async function refreshList() {
  await fetchPlans();
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
    statistics.value = createStatisticsFromPlans(
      response.data.content,
      response.data.totalElements,
    );
  } catch (error) {
    listError.value = getErrorMessage(
      error,
      "구매 계획 목록을 불러오지 못했습니다.",
    );
  } finally {
    isListLoading.value = false;
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
  isCreateDrawerOpen.value = true;
  selectedTicketIds.value = [];
  directPlanItems.value = [];
  resetDirectItemForm();
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
    const response = await ticketApi.getList({
      ticketStatus: "ASSET_APPROVED",
      page: 0,
      size: 100,
    });

    const planTargetTickets = response.data.content.filter(
      isPurchasePlanTargetTicket,
    );

    eligibleTickets.value = planTargetTickets.map(toEligibleTicket);
  } catch (error) {
    eligibleError.value = getErrorMessage(
      error,
      "구매 계획 대상 요청을 불러오지 못했습니다.",
    );
  } finally {
    isEligibleLoading.value = false;
  }
}

function toEligibleTicket(ticket: TicketListItem): EligibleTicket {
  const itemName =
    ticket.requestedItemName ||
    ticket.requestedItemDetail ||
    ticket.productName ||
    "";
  const quantity = ticket.quantity ?? 1;
  const estimatedUnitPrice =
    ticket.expectedPrice ?? ticket.purchasePrice ?? ticket.unitPrice ?? 0;
  const assetItemId = parseAssetItemId(ticket.assetItemId);
  const disabledReasons: string[] = [];

  if (!ticket.assetType) disabledReasons.push("자산 유형 없음");
  if (!estimatedUnitPrice) disabledReasons.push("예상 단가 없음");

  return {
    ticketId: ticket.ticketId,
    ticket,
    itemName,
    categoryName: ticket.categoryName || "",
    assetType: ticket.assetType,
    quantity,
    estimatedUnitPrice,
    assetItemId,
    isStandard: ticket.isStandard !== false && ticket.isStandard !== 0,
    canCreate: disabledReasons.length === 0,
    disabledReason: disabledReasons.join(", "),
  };
}

function isPurchasePlanTargetTicket(ticket: TicketListItem) {
  if (ticket.ticketType === "PURCHASE_REQUEST") {
    return ticket.requestMethod !== "DIRECT_PURCHASE";
  }

  if (ticket.ticketType !== "ASSET_REQUEST") return false;

  const availableCount = ticket.availableCount ?? ticket.availableAssetCount;
  if (availableCount === null || availableCount === undefined) return true;

  return availableCount < (ticket.quantity ?? 1);
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
}

function addDirectPlanItem() {
  directItemError.value = "";
  const itemName = directItemForm.value.itemName.trim();
  const categoryName = directItemForm.value.categoryName.trim();
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
      categoryName,
      assetType: directItemForm.value.assetType,
      quantity,
      estimatedUnitPrice,
      externalUrl: directItemForm.value.externalUrl.trim() || null,
    },
  ];
  resetDirectItemForm();
}

function removeDirectPlanItem(localId: string) {
  directPlanItems.value = directPlanItems.value.filter(
    (item) => item.localId !== localId,
  );
}

async function createPlan() {
  const ticketItems: PurchasePlanCreateItem[] = selectedEligibleTickets.value
    .filter((item) => item.canCreate && item.assetType)
    .map((item) => ({
      ticketId: item.ticket.ticketId,
      itemName: item.itemName,
      assetType: item.assetType!,
      assetItemId: item.assetItemId,
      quantity: item.quantity,
      isStandard: item.isStandard ? 1 : 0,
      estimatedUnitPrice: item.estimatedUnitPrice,
      estimatedAmount: item.estimatedUnitPrice * item.quantity,
      externalUrl: null,
    }));

  const directItems: PurchasePlanCreateItem[] = directPlanItems.value.map(
    (item) => ({
      ticketId: null,
      itemName: item.itemName,
      assetType: item.assetType,
      assetItemId: null,
      quantity: item.quantity,
      isStandard: 0,
      estimatedUnitPrice: item.estimatedUnitPrice,
      estimatedAmount: item.estimatedUnitPrice * item.quantity,
      externalUrl: item.externalUrl,
    }),
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
  pendingReviewStatus.value = status;
  await changeStatus(status);
  pendingReviewStatus.value = null;
}

function changeSelectedStatus() {
  if (!nextStatus.value) return;
  changeStatus(nextStatus.value);
}

async function changeStatus(status: PurchasePlanStatus) {
  if (!selectedPlanId.value) return;
  isStatusSaving.value = true;

  try {
    const response = await purchaseApi.changePlanStatus(selectedPlanId.value, {
      status,
    });
    selectedPlan.value = response.data;
    nextStatus.value = "";
    await refreshList();
  } catch (error) {
    detailError.value = getErrorMessage(error, "상태 변경에 실패했습니다.");
  } finally {
    isStatusSaving.value = false;
  }
}

async function confirmDelivery(item: PurchasePlanItem) {
  if (!selectedPlanId.value || item.itemId == null) return;
  isConfirmingItem.value = item.itemId;

  try {
    await purchaseApi.confirmDelivery(selectedPlanId.value, item.itemId);
    await fetchPlanDetail(selectedPlanId.value);
    await refreshList();
  } catch (error) {
    detailError.value = getErrorMessage(error, "납품 확인에 실패했습니다.");
  } finally {
    isConfirmingItem.value = null;
  }
}

function canConfirmDelivery(item: PurchasePlanItem) {
  if (!canChangeStatus.value || item.itemId == null || item.receivedAt)
    return false;
  if (!selectedPlan.value) return false;

  const confirmableStatuses: PurchasePlanStatus[] = ["APPROVED", "ORDERED"];
  return confirmableStatuses.includes(displayPlanStatus(selectedPlan.value));
}

function displayListStatus(plan: PurchasePlanListItem): PurchasePlanStatus {
  return plan.status || plan.purchaseRequestStatus || "REQUESTED";
}

function createStatisticsFromPlans(
  planItems: PurchasePlanListItem[],
  totalCount = planItems.length,
): PurchasePlanStatistics {
  return planItems.reduce<PurchasePlanStatistics>(
    (acc, plan) => {
      const status = displayListStatus(plan);
      acc.totalCount = totalCount;
      if (status === "REQUESTED") acc.requestedCount += 1;
      if (status === "APPROVED") acc.approvedCount += 1;
      if (status === "REJECTED") acc.rejectedCount += 1;
      if (status === "ORDERED") acc.orderedCount += 1;
      if (status === "DELIVERED") acc.deliveredCount += 1;
      if (status === "COMPLETED") acc.completedCount += 1;
      if (status === "CANCELLED") acc.cancelledCount += 1;
      return acc;
    },
    { ...EMPTY_STATISTICS, totalCount },
  );
}

function displayPlanStatus(plan: PurchasePlanDetail): PurchasePlanStatus {
  return plan.status || plan.purchaseRequestStatus || "REQUESTED";
}

function getStatusLabel(status: PurchasePlanStatus) {
  return STATUS_LABEL[status];
}

function getStatusBadgeClass(status: PurchasePlanStatus) {
  if (status === "APPROVED")
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200";
  if (status === "REJECTED") return "bg-danger/10 text-danger";
  if (status === "CANCELLED") return "bg-surface-secondary text-text-muted";
  if (status === "ORDERED") return "bg-primary/10 text-primary";
  if (status === "DELIVERED" || status === "COMPLETED")
    return "bg-success/10 text-success";
  return "bg-surface-secondary text-text-sub";
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
const assetRegisterTab = ref<'TANGIBLE' | 'INTANGIBLE'>('TANGIBLE');
const assetRegisterTargetItem = ref<PurchasePlanItem | null>(null);
const isRegisteringAsset = ref(false);
const assetRegisterError = ref("");

const tangibleForm = ref<{
  serialNumber: string;
  location: string;
  purchaseDate: string;
  purchasePrice: number | '';
  purchaseVendor: string;
  warrantyExpiredAt: string;
  usageType: string;
  assetUsageType: string;
  memberId: string;
  departmentId: string;
  usedStartedAt: string;
  returnDueDate: string;
}>({
  serialNumber: "",
  location: "",
  purchaseDate: "",
  purchasePrice: "",
  purchaseVendor: "",
  warrantyExpiredAt: "",
  usageType: "TEMPORARY",
  assetUsageType: "PERSONAL",
  memberId: "",
  departmentId: "",
  usedStartedAt: "",
  returnDueDate: "",
});

const intangibleForm = ref<{
  seatCount: number | '';
  purchaseDate: string;
  purchasePrice: number | '';
  purchaseVendor: string;
  isAutoRenewal: number;
  billingCycle: string;
  licenseCode: string;
  memberId: string;
  departmentId: string;
  startedAt: string;
  expiredAt: string;
}>({
  seatCount: 1,
  purchaseDate: "",
  purchasePrice: "",
  purchaseVendor: "",
  isAutoRenewal: 0,
  billingCycle: "YEARLY",
  licenseCode: "",
  memberId: "",
  departmentId: "",
  startedAt: "",
  expiredAt: "",
});

function openAssetRegisterDrawer(item: PurchasePlanItem) {
  assetRegisterTargetItem.value = item;
  assetRegisterTab.value = (item.assetType ?? 'TANGIBLE') === 'INTANGIBLE' ? 'INTANGIBLE' : 'TANGIBLE';
  assetRegisterError.value = "";
  // 폼 초기화
  tangibleForm.value = {
    serialNumber: "",
    location: "",
    purchaseDate: "",
    purchasePrice: "",
    purchaseVendor: "",
    warrantyExpiredAt: "",
    usageType: "TEMPORARY",
    assetUsageType: "PERSONAL",
    memberId: "",
    departmentId: "",
    usedStartedAt: "",
    returnDueDate: "",
  };
  intangibleForm.value = {
    seatCount: 1,
    purchaseDate: "",
    purchasePrice: "",
    purchaseVendor: "",
    isAutoRenewal: 0,
    billingCycle: "YEARLY",
    licenseCode: "",
    memberId: "",
    departmentId: "",
    startedAt: "",
    expiredAt: "",
  };
  isAssetRegisterDrawerOpen.value = true;
}

function closeAssetRegisterDrawer() {
  isAssetRegisterDrawerOpen.value = false;
  assetRegisterTargetItem.value = null;
  assetRegisterError.value = "";
}

async function submitAssetRegister() {
  const item = assetRegisterTargetItem.value;
  assetRegisterError.value = "";

  if (assetRegisterTab.value === 'TANGIBLE') {
    const f = tangibleForm.value;
    if (!f.serialNumber.trim()) {
      assetRegisterError.value = "시리얼 번호를 입력해주세요.";
      return;
    }
    if (!f.location.trim()) {
      assetRegisterError.value = "위치를 입력해주세요.";
      return;
    }
    if (!f.purchaseDate) {
      assetRegisterError.value = "구매일을 입력해주세요.";
      return;
    }
    if (f.purchasePrice === '' || Number(f.purchasePrice) <= 0) {
      assetRegisterError.value = "구매 금액을 입력해주세요.";
      return;
    }
    if (!f.purchaseVendor.trim()) {
      assetRegisterError.value = "구매처를 입력해주세요.";
      return;
    }
    if (!f.warrantyExpiredAt) {
      assetRegisterError.value = "보증 만료일을 입력해주세요.";
      return;
    }

    const body: TangibleAssetCreateRequest = {
      tangibleItemId: item?.assetItemId?.toString() ?? undefined,
      serialNumber: f.serialNumber,
      location: f.location,
      purchaseDate: f.purchaseDate,
      purchasePrice: Number(f.purchasePrice),
      purchaseVendor: f.purchaseVendor,
      warrantyExpiredAt: f.warrantyExpiredAt,
      usageType: f.usageType as 'TEMPORARY' | 'PERMANENT',
      assetUsageType: f.assetUsageType,
      memberId: f.memberId || null,
      departmentId: f.departmentId || null,
      usedStartedAt: f.usedStartedAt || null,
      returnDueDate: f.returnDueDate || null,
    };

    isRegisteringAsset.value = true;
    try {
      await tangibleAssetApi.create(body);
      closeAssetRegisterDrawer();
    } catch (error) {
      assetRegisterError.value = getErrorMessage(error, "유형자산 등록에 실패했습니다.");
    } finally {
      isRegisteringAsset.value = false;
    }
  } else {
    const f = intangibleForm.value;
    if (f.seatCount === '' || Number(f.seatCount) <= 0) {
      assetRegisterError.value = "최대 사용 인원을 입력해주세요.";
      return;
    }
    if (!f.purchaseDate) {
      assetRegisterError.value = "구매일을 입력해주세요.";
      return;
    }
    if (f.purchasePrice === '' || Number(f.purchasePrice) <= 0) {
      assetRegisterError.value = "구매 금액을 입력해주세요.";
      return;
    }
    if (!f.purchaseVendor.trim()) {
      assetRegisterError.value = "구매처를 입력해주세요.";
      return;
    }

    const body: IntangibleAssetCreateRequest = {
      intangibleItemId: item?.assetItemId?.toString() ?? undefined,
      seatCount: Number(f.seatCount),
      isAutoRenewal: f.isAutoRenewal === 1,
      purchaseDate: f.purchaseDate,
      purchasePrice: Number(f.purchasePrice),
      purchaseVendor: f.purchaseVendor,
      billingCycle: f.billingCycle as BillingCycle,
      licenseCode: f.licenseCode || undefined,
      memberId: f.memberId || null,
      departmentId: f.departmentId || null,
      startedAt: f.startedAt || null,
      expiredAt: f.expiredAt || null,
    };

    isRegisteringAsset.value = true;
    try {
      await intangibleAssetApi.create(body);
      closeAssetRegisterDrawer();
    } catch (error) {
      assetRegisterError.value = getErrorMessage(error, "무형자산 등록에 실패했습니다.");
    } finally {
      isRegisteringAsset.value = false;
    }
  }
}
</script>
