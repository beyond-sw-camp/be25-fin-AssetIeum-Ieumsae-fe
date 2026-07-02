<template>
  <BaseDrawer
    :is-open="isOpen"
    :title="drawerTitle"
    panel-class="w-full md:w-[50vw] md:max-w-none"
    @close="handleClose"
  >
    <RequestTypeSelector
      v-if="!selectedKind"
      @select="handleKindSelect"
    />

    <div v-else-if="isAssetSelectionStep" class="space-y-5">
      <button
        type="button"
        class="inline-flex items-center gap-1 text-sm font-semibold text-text-sub hover:text-primary"
        :disabled="isSubmitting"
        @click="closeAssetSelection"
      >
        <ChevronLeft :size="16" />
        요청 작성으로 돌아가기
      </button>

      <section v-if="selectedKind === 'STANDARD_ASSET_REQUEST'" class="space-y-2">
        <p class="text-sm font-semibold text-text-main">
          유형/무형자산 <span class="text-primary">*</span>
        </p>
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <label
            v-for="option in assetTypeOptions"
            :key="option.value"
            class="group flex cursor-pointer select-none items-center gap-2.5 text-sm text-text-main"
          >
            <span class="relative flex h-5 w-5 shrink-0 items-center justify-center">
              <input
                v-model="selectionAssetType"
                type="radio"
                name="ticket-asset-type"
                :value="option.value"
                class="peer sr-only"
                @change="handleSelectionAssetTypeChange(option.value)"
              />
              <span
                class="h-5 w-5 rounded-full border border-gray-300 bg-white transition-all duration-200 group-hover:border-gray-400 peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"
              >
              </span>
              <span
                class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-primary transition-transform duration-200 ease-out peer-checked:scale-100"
              >
              </span>
            </span>
            <span>{{ option.label }}</span>
          </label>
        </div>
      </section>

      <section v-if="requiresAssetSearchUsageType" class="space-y-2">
        <p class="text-sm font-semibold text-text-main">
          공용자산 여부 <span class="text-primary">*</span>
        </p>
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <label
            v-for="option in assetSearchScopeOptions"
            :key="option.value"
            class="group flex cursor-pointer select-none items-center gap-2.5 text-sm text-text-main"
          >
            <span class="relative flex h-5 w-5 shrink-0 items-center justify-center">
              <input
                v-model="assetSearchForm.assetUsageType"
                type="radio"
                name="ticket-asset-usage-type"
                :value="option.value"
                class="peer sr-only"
                @change="invalidateAssetSearch"
              />
              <span
                class="h-5 w-5 rounded-full border border-gray-300 bg-white transition-all duration-200 group-hover:border-gray-400 peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"
              >
              </span>
              <span
                class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-primary transition-transform duration-200 ease-out peer-checked:scale-100"
              >
              </span>
            </span>
            <span>{{ option.label }}</span>
          </label>
        </div>
      </section>

      <section class="space-y-3">
        <div v-if="showsAssetSearch" class="space-y-2">
          <label class="text-sm font-semibold text-text-main" for="ticket-asset-category">
            자산 카테고리 선택 <span class="text-primary">*</span>
          </label>
          <Dropdown
            id="ticket-asset-category"
            :model-value="assetSearchForm.category"
            :options="assetCategoryOptions"
            root-option="자산 카테고리 선택"
            category-select-mode="leaf-only"
            @update:model-value="handleAssetCategoryChange"
          />
        </div>

        <div v-if="showsAssetSearch" class="flex items-center gap-2">
          <div class="relative min-w-0 flex-1">
            <Search
              :size="16"
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              id="ticket-asset-search"
              v-model="assetSearchForm.keyword"
              type="search"
              class="h-9 w-full rounded-xl border border-border bg-surface pl-9 pr-4 text-sm text-text-main outline-none placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              :placeholder="assetSearchPlaceholder"
              @input="invalidateAssetSearch"
              @keydown.enter.prevent="handleAssetSearch"
            />
          </div>
          <Button
            class="shrink-0"
            :loading="isAssetsLoading"
            :disabled="!canSearchAssets"
            @click="handleAssetSearch"
          >
            확인
          </Button>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-text-main">조회 결과</p>
          <span v-if="hasSearchedAssets" class="text-xs text-text-muted">
            {{ selectionItemOptions.length }}개
          </span>
        </div>

        <AssetRadioList
          v-model="pendingSelectedAssetId"
          :items="selectionItemOptions"
          :item-groups="selectionItemGroups"
          :loading="isAssetsLoading"
          :error-message="assetErrorMessage"
          :empty-text="hasSearchedAssets ? '조회 조건에 맞는 품목이 없습니다.' : '조회 조건을 선택하고 확인을 눌러주세요.'"
          name="asset-request-item"
        />
      </section>
    </div>

    <form v-else class="space-y-5" @submit.prevent="handleSubmit">
      <button
        type="button"
        class="inline-flex items-center gap-1 text-sm font-semibold text-text-sub hover:text-primary"
        :disabled="isSubmitting"
        @click="resetSelection"
      >
        <ChevronLeft :size="16" />
        요청 유형 다시 선택
      </button>

      <section v-if="selectedKind === 'RENTAL' || selectedKind === 'RENTAL_EXTENSION'" class="space-y-2">
        <p class="text-sm font-semibold text-text-main">
          대여 요청 유형 <span class="text-primary">*</span>
        </p>
        <div class="grid grid-cols-2 rounded-xl bg-surface-secondary p-1">
          <button
            type="button"
            :class="[
              'rounded-lg px-3 py-2 text-xs font-semibold transition',
              selectedKind === 'RENTAL'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-text-muted hover:text-text-main',
            ]"
            @click="selectedKind = 'RENTAL'; form.selectedAssetId = ''; pendingSelectedAssetId = ''"
          >
            대여 신청
          </button>
          <button
            type="button"
            :class="[
              'rounded-lg px-3 py-2 text-xs font-semibold transition',
              selectedKind === 'RENTAL_EXTENSION'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-text-muted hover:text-text-main',
            ]"
            @click="selectedKind = 'RENTAL_EXTENSION'; form.selectedAssetId = ''; pendingSelectedAssetId = ''"
          >
            대여 연장
          </button>
        </div>
      </section>



      <section v-if="selectedKind === 'MAINTENANCE'" class="space-y-2">
        <p class="text-sm font-semibold text-text-main">
          서비스 유형 <span class="text-primary">*</span>
        </p>
        <div class="grid grid-cols-2 rounded-xl bg-surface-secondary p-1">
          <button
            v-for="option in assetServiceTypeOptions"
            :key="option.value"
            type="button"
            :class="[
              'rounded-lg px-3 py-2 text-xs font-semibold transition',
              form.assetServiceType === option.value
                ? 'bg-surface text-primary shadow-sm'
                : 'text-text-muted hover:text-text-main',
            ]"
            @click="handleAssetServiceTypeChange(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </section>

      <section v-if="showsPurchaseRequestAssetType" class="space-y-2">
        <p class="text-sm font-semibold text-text-main">
          자산 유형 <span class="text-primary">*</span>
        </p>
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <label
            v-for="option in assetTypeOptions"
            :key="option.value"
            class="group flex cursor-pointer select-none items-center gap-2.5 text-sm text-text-main"
          >
            <span class="relative flex h-5 w-5 shrink-0 items-center justify-center">
              <input
                v-model="form.assetType"
                type="radio"
                name="ticket-request-asset-type"
                :value="option.value"
                class="peer sr-only"
                @change="handleAssetTypeChange(option.value)"
              />
              <span
                class="h-5 w-5 rounded-full border border-gray-300 bg-white transition-all duration-200 group-hover:border-gray-400 peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"
              >
              </span>
              <span
                class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-primary transition-transform duration-200 ease-out peer-checked:scale-100"
              >
              </span>
            </span>
            <span>{{ option.label }}</span>
          </label>
        </div>
      </section>

      <section v-if="selectedKind === 'DIRECT_PURCHASE'" class="space-y-2">
        <p class="text-sm font-semibold text-text-main">
          품목 구분 <span class="text-primary">*</span>
        </p>
        <div class="grid grid-cols-2 rounded-xl bg-surface-secondary p-1">
          <button
            v-for="option in directPurchaseItemTypeOptions"
            :key="option.value"
            type="button"
            :class="[
              'rounded-lg px-3 py-2 text-xs font-semibold transition',
              form.directPurchaseItemType === option.value
                ? 'bg-surface text-primary shadow-sm'
                : 'text-text-muted hover:text-text-main',
            ]"
            :disabled="isSubmitting"
            @click="handleDirectPurchaseItemTypeChange(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </section>

      <template v-if="showsPurchaseRequestAssetType">
        <section v-if="requiresPurchaseUsageType" class="space-y-2">
          <p class="text-sm font-semibold text-text-main">
            공용자산 여부 <span class="text-primary">*</span>
          </p>
          <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
            <label
              v-for="option in assetScopeOptions"
              :key="option.value"
              class="group flex cursor-pointer select-none items-center gap-2.5 text-sm text-text-main"
            >
              <span class="relative flex h-5 w-5 shrink-0 items-center justify-center">
                <input
                  v-model="form.assetUsageType"
                  type="radio"
                  name="ticket-request-asset-usage-type"
                  :value="option.value"
                  class="peer sr-only"
                />
                <span
                  class="h-5 w-5 rounded-full border border-gray-300 bg-white transition-all duration-200 group-hover:border-gray-400 peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"
                >
                </span>
                <span
                  class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-primary transition-transform duration-200 ease-out peer-checked:scale-100"
                >
                </span>
              </span>
              <span>{{ option.label }}</span>
            </label>
          </div>
        </section>

        <section v-if="showsPurchaseCategorySelect" class="space-y-2">
          <label class="text-sm font-semibold text-text-main" for="ticket-request-asset-category">
            자산 분류 선택 <span class="text-primary">*</span>
          </label>
          <Dropdown
            id="ticket-request-asset-category"
            :model-value="form.category"
            :options="purchaseRequestCategoryOptions"
            root-option="자산 카테고리 선택"
            category-select-mode="leaf-only"
            @update:model-value="handlePurchaseRequestCategoryChange"
          />
        </section>
      </template>

      <section v-else-if="showsAssetType" class="space-y-2">
        <p class="text-sm font-semibold text-text-main">
          {{ selectedKind === 'RETURN' ? '반납/해지 유형' : '자산 유형' }} <span class="text-primary">*</span>
        </p>
        <div class="grid grid-cols-2 rounded-xl bg-surface-secondary p-1">
          <button
            v-for="option in (selectedKind === 'RETURN' ? returnTypeOptions : assetTypeOptions)"
            :key="option.value"
            type="button"
            :class="[
              'rounded-lg px-3 py-2 text-xs font-semibold transition',
              form.assetType === option.value
                ? 'bg-surface text-primary shadow-sm'
                : 'text-text-muted hover:text-text-main',
            ]"
            @click="handleAssetTypeChange(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </section>

      <section v-if="selectedKind === 'STANDARD_ASSET_REQUEST'" class="space-y-2">
        <p class="text-sm font-semibold text-text-main">
          공용자산 여부 <span class="text-primary">*</span>
        </p>
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <label
            v-for="option in assetScopeOptions"
            :key="option.value"
            class="group flex cursor-pointer select-none items-center gap-2.5 text-sm text-text-main"
          >
            <span class="relative flex h-5 w-5 shrink-0 items-center justify-center">
              <input
                v-model="form.assetUsageType"
                type="radio"
                name="ticket-standard-request-asset-usage-type"
                :value="option.value"
                class="peer sr-only"
                @change="handleAssetUsageTypeChange"
              />
              <span
                class="h-5 w-5 rounded-full border border-gray-300 bg-white transition-all duration-200 group-hover:border-gray-400 peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"
              >
              </span>
              <span
                class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-primary transition-transform duration-200 ease-out peer-checked:scale-100"
              >
              </span>
            </span>
            <span>{{ option.label }}</span>
          </label>
        </div>
      </section>

      <section v-if="usesNestedAssetSelection" class="space-y-3">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-text-main">
            {{ nestedAssetLabel }} <span class="text-primary">*</span>
          </p>
        </div>

        <button
          v-if="selectedAssetOption"
          type="button"
          class="flex w-full items-start gap-3 rounded-xl border border-primary bg-primary/5 p-4 text-left transition hover:bg-primary/10"
          @click="openAssetSelection"
        >
          <PackageCheck :size="20" class="mt-0.5 shrink-0 text-primary" />
          <span class="min-w-0">
            <span class="block truncate text-sm font-semibold text-text-main">
              {{ selectedAssetOption.name }}
            </span>
            <span v-if="selectedAssetOption.description" class="mt-1 block text-xs text-text-muted">
              {{ selectedAssetOption.description }}
            </span>
            <span class="mt-2 block text-xs font-semibold text-primary">
              선택한 항목을 눌러 변경할 수 있습니다.
            </span>
          </span>
        </button>

        <button
          v-else
          type="button"
          class="flex min-h-28 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-secondary/60 px-4 text-center transition hover:border-primary hover:bg-primary/5"
          @click="openAssetSelection"
        >
          <PackagePlus :size="24" class="mb-2 text-text-muted" />
          <span class="text-sm font-medium text-text-sub">신청할 품목을 목록에서 추가해주세요.</span>
          <span class="mt-1 text-xs text-text-muted">하나의 품목만 등록 가능합니다.</span>
        </button>
      </section>

      <section v-if="usesInlineSelectableAsset" class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="text-sm font-semibold text-text-main" for="ticket-asset-search">
            {{ assetSelectionLabel }} <span class="text-primary">*</span>
          </label>
          <span class="text-xs text-text-muted">{{ filteredAssetOptions.length }}개</span>
        </div>

        <div v-if="showsAssetSearch" class="relative">
          <Search
            :size="16"
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            id="ticket-asset-search"
            v-model="assetSearchKeyword"
            type="search"
            class="h-9 w-full rounded-xl border border-border bg-surface pl-9 pr-4 text-sm text-text-main outline-none placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            :placeholder="assetSearchPlaceholder"
          />
        </div>

        <AssetRadioList
          v-model="form.selectedAssetId"
          :items="filteredAssetOptions"
          :loading="isAssetsLoading"
          :error-message="assetErrorMessage"
          :empty-text="assetSelectionEmptyText"
          :name="`ticket-${selectedKind}-asset`"
        />
      </section>

      <template v-if="showsPurchaseDetailInputs">
        <Input
          id="ticket-requested-item-name"
          v-model="form.requestedItemName"
          label="요청 품목 상세"
          required
          :placeholder="requestedItemDetailPlaceholder"
          :disabled="isSubmitting"
        />
        <section class="rounded-xl border border-border bg-surface-secondary/50 p-3">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="text-sm font-bold text-text-main">기존 품목 조회</p>
              <p class="mt-1 text-xs font-semibold leading-5 text-text-muted">
                같은 품목이 이미 있으면 구매 요청 대신 자산 요청으로 작성할 수 있습니다.
              </p>
            </div>
            <Button
              variant="outline"
              size="md"
              class="shrink-0"
              :loading="isPurchaseItemLookupLoading"
              :disabled="!canLookupPurchaseItem || isSubmitting"
              @click="handlePurchaseItemLookup"
            >
              <Search :size="14" />
              품목 조회
            </Button>
          </div>

          <p v-if="purchaseItemLookupError" class="mt-3 text-xs font-semibold text-danger">
            {{ purchaseItemLookupError }}
          </p>

          <div v-if="hasSearchedPurchaseItems && !purchaseItemLookupError" class="mt-3 space-y-2">
            <p
              v-if="purchaseItemLookupResults.length === 0"
              class="rounded-lg border border-dashed border-border bg-surface px-3 py-2 text-xs font-semibold text-text-muted"
            >
              동일하거나 유사한 품목을 찾지 못했습니다. 새 구매 요청으로 계속 작성해 주세요.
            </p>

            <div
              v-for="item in purchaseItemLookupResults"
              :key="`${item.assetType}-${item.id}`"
              class="flex flex-col gap-3 rounded-lg border border-border bg-surface px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="truncate text-sm font-bold text-text-main">{{ item.name }}</p>
                  <span
                    v-if="isSamePurchaseLookupName(item)"
                    class="rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-bold text-warning"
                  >
                    동일 품목명
                  </span>
                </div>
                <p class="mt-1 text-xs font-semibold text-text-muted">
                  {{ item.assetType === 'INTANGIBLE' ? '무형자산' : '유형자산' }}
                  <span v-if="item.description"> · {{ item.description }}</span>
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                class="shrink-0"
                @click="goToAssetRequestFromLookup(item)"
              >
                자산 요청으로 작성
              </Button>
            </div>
          </div>
        </section>
        <Input
          id="ticket-manufacturer"
          v-model="form.vendor"
          :label="vendorFieldLabel"
          required
          :placeholder="vendorPlaceholder"
          :disabled="isSubmitting"
        />
        <div v-if="form.assetType === 'INTANGIBLE'" class="space-y-2">
          <label
            for="ticket-license-type"
            class="text-sm font-semibold text-text-main"
          >
            라이선스 유형 <span class="text-primary">*</span>
          </label>
          <Dropdown
            id="ticket-license-type"
            v-model="form.licenseType"
            :options="licenseTypeOptions"
            root-option="라이선스 유형 선택"
            :disabled="isSubmitting"
          />
        </div>
        <Input
          v-if="selectedKind === 'NON_STANDARD_ASSET_REQUEST'"
          id="ticket-external-url"
          v-model="form.externalUrl"
          label="구매 링크(URL)"
          required
          placeholder="https://"
          :disabled="isSubmitting"
        />
      </template>

      <div
        v-if="showsPurchaseQuantityAndPrice"
        :class="[
          'grid grid-cols-1 gap-3',
          showsPurchaseSeatCount ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
        ]"
      >
        <Input
          id="ticket-quantity"
          v-model="form.quantity"
          type="number"
          :min="1"
          label="수량"
          required
          placeholder="1"
          :disabled="isSubmitting"
        />
        <Input
          v-if="showsPurchaseSeatCount"
          id="ticket-seat-count"
          v-model="form.seatCount"
          type="number"
          :min="1"
          label="사용 가능 인원 수"
          required
          placeholder="1"
          :disabled="isSubmitting"
        />
        <CurrencyInput
          id="ticket-expected-price"
          v-model="form.expectedPrice"
          label="예상 금액"
          required
          placeholder="0"
          :disabled="isSubmitting"
        />
      </div>

      <div v-else-if="selectedKind === 'STANDARD_ASSET_REQUEST'" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          id="ticket-quantity"
          v-model="form.quantity"
          type="number"
          :min="1"
          label="수량"
          required
          placeholder="1"
          :disabled="isSubmitting"
        />
        <CurrencyInput
          v-if="requiresStandardEstimatedUnitPrice"
          id="ticket-standard-estimated-unit-price"
          v-model="form.expectedPrice"
          label="예상 단가"
          required
          placeholder="0"
          :disabled="isSubmitting"
        />
      </div>

      <section v-if="requiresAssetAssignee" class="space-y-3">
        <div class="flex items-center justify-between gap-2">
          <label class="text-sm font-semibold text-text-main">
            자산 할당자 <span class="text-primary">*</span>
          </label>
          <span class="text-xs text-text-muted">{{ requestedAssetQuantity }}명 선택</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="(_, index) in form.assetAssigneeIds"
            :key="`ticket-asset-assignee-${index}`"
            class="grid grid-cols-[4rem_1fr] items-center gap-2"
          >
            <span class="text-xs font-semibold text-text-muted">{{ index + 1 }}번째</span>
            <Dropdown
              :id="`ticket-asset-assignee-${index}`"
              :model-value="form.assetAssigneeIds[index] ?? ''"
              :options="assetAssigneeOptionsFor(index)"
              :root-option="isAssigneeLoading ? '같은 부서 구성원 조회 중' : assetAssigneeRootOption"
              :disabled="isSubmitting || isAssigneeLoading || (!allowsUnassignedAssignee && assetAssigneeOptions.length === 0)"
              @update:model-value="(value) => handleAssetAssigneeChange(index, value)"
            />
          </div>
        </div>
        <p v-if="assigneeErrorMessage" class="text-xs text-danger">
          {{ assigneeErrorMessage }}
        </p>
        <p v-else class="text-xs text-text-muted">
          요청자와 같은 부서 구성원만 선택할 수 있습니다.
        </p>
      </section>

      <div v-if="selectedKind === 'RENTAL'" class="grid grid-cols-2 gap-3">
        <Input
          id="ticket-rental-start-date"
          v-model="form.rentalStartDate"
          type="date"
          label="대여 시작일"
          :min="minimumDate"
          required
          :disabled="isSubmitting"
        />
        <Input
          id="ticket-rental-due-date"
          v-model="form.rentalDueDate"
          type="date"
          label="반납 예정일"
          :min="minimumDate"
          required
          :disabled="isSubmitting"
        />
      </div>

      <Input
        v-if="selectedKind === 'RENTAL_EXTENSION'"
        id="ticket-requested-due-date"
        v-model="form.requestedDueDate"
        type="date"
        label="연장 요청 반납일"
        :min="minimumDate"
        required
        :disabled="isSubmitting"
      />

      <div class="space-y-2">
        <label class="text-sm font-semibold text-text-main" for="ticket-reason">
          {{ reasonLabel }} <span class="text-primary">*</span>
        </label>
        <textarea
          id="ticket-reason"
          v-model="form.reason"
          rows="6"
          required
          :disabled="isSubmitting"
          :placeholder="reasonPlaceholder"
          class="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:opacity-60"
        />
      </div>

      <p
        v-if="dateErrorMessage"
        class="rounded-xl bg-danger/5 px-4 py-3 text-sm text-danger"
        role="alert"
      >
        {{ dateErrorMessage }}
      </p>

      <p
        v-if="errorMessage"
        ref="errorMessageRef"
        class="rounded-xl bg-danger/5 px-4 py-3 text-sm text-danger"
        role="alert"
        tabindex="-1"
      >
        {{ errorMessage }}
      </p>
    </form>

    <template #footer>
      <div class="grid grid-cols-2 gap-3">
        <Button
          variant="ghost"
          size="m"
          :disabled="isSubmitting"
          @click="isAssetSelectionStep ? closeAssetSelection() : handleClose()"
        >
          취소
        </Button>
        <Button
          v-if="isAssetSelectionStep"
          size="m"
          :disabled="!pendingSelectedAssetId"
          @click="confirmAssetSelection"
        >
          확인
        </Button>
        <Button
          v-else
          size="m"
          :loading="isSubmitting"
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          신청 제출
        </Button>
      </div>
    </template>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { ChevronLeft, PackageCheck, PackagePlus, Search } from 'lucide-vue-next'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  intangibleAssetApi,
  intangibleItemApi,
  memberApi,
  tangibleAssetApi,
  tangibleItemApi,
  ticketCreateApi,
} from '@/api'
import { ApiError } from '@/api/client'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import CurrencyInput from '@/components/common/CurrencyInput.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import AssetRadioList from '@/components/ticket/AssetRadioList.vue'
import type { AssetRadioGroup, AssetRadioItem } from '@/components/ticket/AssetRadioList.vue'
import RequestTypeSelector from '@/components/ticket/RequestTypeSelector.vue'
import { useAuthStore } from '@/stores'
import { toDateInputValue as getCurrentDateInputValue } from '@/utils/date'
import type {
  AssetType,
  ActiveRentalAsset,
  DropdownOption,
  IntangibleAsset,
  IntangibleCategoryGroup,
  IntangibleItem,
  MaintenanceAvailableAsset,
  Member,
  RentalAvailableItem,
  RequestedUsageType,
  TangibleAsset,
  TangibleCategoryGroup,
  TangibleAssetItem,
  TangibleAssetUsageType,
  TicketCreateResponse,
  TicketRequestKind,
} from '@/types'
import { formatDate } from '@/utils/labels'

interface SelectableAsset extends AssetRadioItem {
  assetType: AssetType
  isStandard?: boolean | null
  categoryId?: string
  categoryName?: string
  manufacturer?: string
  licenseType?: string | null
  usageType?: TangibleAssetUsageType | null
  assignmentId?: string | null
  returnDueDate?: string | null
}

type AvailableCountSource = {
  availableSeatCount?: number | string | null
  remainingSeatCount?: number | string | null
  remainingSeats?: number | string | null
  availableSeats?: number | string | null
  assignableSeatCount?: number | string | null
  remainingAssignableCount?: number | string | null
  remainingAssignableSeatCount?: number | string | null
  availableUserCount?: number | string | null
  remainingUserCount?: number | string | null
  availableMemberCount?: number | string | null
  remainingMemberCount?: number | string | null
  availableAssignmentCount?: number | string | null
  remainingAssignmentCount?: number | string | null
  availableCount?: number | string | null
  availableAssetCount?: number | string | null
  stockCount?: number | string | null
  assetCount?: number | string | null
  intangibleAssetCount?: number | string | null
  totalAssetCount?: number | string | null
  assetTotalCount?: number | string | null
  count?: number | string | null
}

type MemberRecord = Member & {
  id?: string
  employeeId?: string
  employee_id?: string
  member_id?: string
  department_id?: string
  deptId?: string
  dept_id?: string
  deptName?: string | null
  teamName?: string | null
  department?: {
    departmentId?: string
    department_id?: string
    id?: string
    name?: string | null
    departmentName?: string | null
    departmentNamePath?: string | null
  } | null
}

const props = defineProps<{
  isOpen: boolean
}>()

const minimumDate = getCurrentDateInputValue()

const emit = defineEmits<{
  close: []
  created: [ticket: TicketCreateResponse]
}>()

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const assetTypeOptions = [
  { label: '유형 자산', value: 'TANGIBLE' as const },
  { label: '무형 자산', value: 'INTANGIBLE' as const },
]
const returnTypeOptions = [
  { label: '유형 자산 반납', value: 'TANGIBLE' as const },
  { label: '무형 자산 해지', value: 'INTANGIBLE' as const },
]
const assetScopeOptions = [
  { label: '공용 자산', value: 'DEPARTMENT' as const },
  { label: '개인 자산', value: 'PERSONAL' as const },
]
const assetSearchScopeOptions = [
  { label: '공용 자산', value: 'DEPARTMENT' as const },
  { label: '개인 자산', value: 'PERSONAL' as const },
]
const assetServiceTypeOptions = [
  { label: '수리', value: 'REPAIR' as const },
  { label: '반품', value: 'RETURN' as const },
]
const directPurchaseItemTypeOptions = [
  { label: '표준 품목', value: 'STANDARD' as const },
  { label: '비표준 품목', value: 'NON_STANDARD' as const },
]
const licenseTypeOptions: DropdownOption[] = [
  { label: '구독형 (SaaS)', value: 'SUBSCRIPTION' },
  { label: '영구 라이선스', value: 'PERPETUAL' },
  { label: '기간제 라이선스', value: 'TERM' },
]

function licenseTypeLabel(value: string | null | undefined) {
  if (!value) return ''
  return licenseTypeOptions.find((option) => option.value === value)?.label ?? value
}

const selectedKind = ref<TicketRequestKind | ''>('')
const isAssetSelectionStep = ref(false)
const pendingSelectedAssetId = ref('')
const selectionAssetType = ref<AssetType>('TANGIBLE')
const confirmedSelectedAsset = ref<SelectableAsset | null>(null)
const isSubmitting = ref(false)
const isAssetsLoading = ref(false)
const isAssigneeLoading = ref(false)
const errorMessage = ref('')
const errorMessageRef = ref<HTMLElement | null>(null)
const requiresStandardEstimatedUnitPrice = ref(false)
const STANDARD_ESTIMATED_UNIT_PRICE_REQUIRED_MESSAGE =
  '선택한 품목의 재고가 부족합니다. 구매계획에 사용할 예상 단가를 입력한 뒤 다시 요청해주세요.'
const assetErrorMessage = ref('')
const assigneeErrorMessage = ref('')
const assetSearchKeyword = ref('')
const hasSearchedAssets = ref(false)
const isPurchaseItemLookupLoading = ref(false)
const hasSearchedPurchaseItems = ref(false)
const purchaseItemLookupError = ref('')
const purchaseItemLookupResults = ref<SelectableAsset[]>([])
const tangibleCategoryGroups = ref<TangibleCategoryGroup[]>([])
const intangibleCategoryGroups = ref<IntangibleCategoryGroup[]>([])
const itemOptions = ref<SelectableAsset[]>([])
const ownedAssetOptions = ref<SelectableAsset[]>([])
const activeRentalAssetOptions = ref<SelectableAsset[]>([])
const maintenanceAssetOptions = ref<SelectableAsset[]>([])
const returnAssetOptions = ref<SelectableAsset[]>([])
const purchaseReturnAssetOptions = ref<SelectableAsset[]>([])
const departmentMembers = ref<Member[]>([])

const form = reactive({
  assetType: 'TANGIBLE' as AssetType,
  assetServiceType: 'REPAIR' as 'REPAIR' | 'RETURN',
  directPurchaseItemType: 'STANDARD' as 'STANDARD' | 'NON_STANDARD',
  assetUsageType: 'DEPARTMENT' as RequestedUsageType,
  category: '',
  selectedAssetId: '',
  assetAssigneeId: '',
  assetAssigneeIds: [] as string[],
  requestedItemName: '',
  vendor: '',
  licenseType: '',
  externalUrl: '',
  quantity: '1',
  seatCount: '1',
  expectedPrice: '',
  rentalStartDate: '',
  rentalDueDate: '',
  requestedDueDate: '',
  reason: '',
})
const assetSearchForm = reactive({
  assetUsageType: 'DEPARTMENT' as 'DEPARTMENT' | 'PERSONAL',
  category: '',
  keyword: '',
})

const requestTitleMap: Record<TicketRequestKind, string> = {
  STANDARD_ASSET_REQUEST: '자산 요청',
  NON_STANDARD_ASSET_REQUEST: '구매 요청',
  DIRECT_PURCHASE: '직접 구매 요청',
  RENTAL: '대여 자산 요청',
  RENTAL_EXTENSION: '대여 연장 요청',
  MAINTENANCE: '자산 서비스 요청',
  RETURN: '자산 반납 및 해지 요청',
  PURCHASE_RETURN: '구매 자산 반품 요청',
}

const drawerTitle = computed(() => (
  isAssetSelectionStep.value
    ? '자산 선택'
    : selectedKind.value
      ? requestTitleMap[selectedKind.value]
      : '새 티켓 요청'
))

const showsAssetType = computed(() => (
  selectedKind.value === 'NON_STANDARD_ASSET_REQUEST'
  || selectedKind.value === 'DIRECT_PURCHASE'
  || selectedKind.value === 'RETURN'
  || selectedKind.value === 'PURCHASE_RETURN'
))

const showsPurchaseRequestAssetType = computed(() => (
  selectedKind.value === 'NON_STANDARD_ASSET_REQUEST'
  || selectedKind.value === 'DIRECT_PURCHASE'
))

const isStandardDirectPurchase = computed(() => (
  selectedKind.value === 'DIRECT_PURCHASE'
  && form.directPurchaseItemType === 'STANDARD'
))

const isNonStandardDirectPurchase = computed(() => (
  selectedKind.value === 'DIRECT_PURCHASE'
  && form.directPurchaseItemType === 'NON_STANDARD'
))

const showsPurchaseCategorySelect = computed(() => (
  selectedKind.value === 'NON_STANDARD_ASSET_REQUEST'
  || isNonStandardDirectPurchase.value
))

const requiresAssetAssignee = computed(() => (
  selectedKind.value === 'STANDARD_ASSET_REQUEST'
  || selectedKind.value === 'NON_STANDARD_ASSET_REQUEST'
  || selectedKind.value === 'DIRECT_PURCHASE'
))

const showsPurchaseDetailInputs = computed(() => (
  selectedKind.value === 'NON_STANDARD_ASSET_REQUEST'
  || isNonStandardDirectPurchase.value
))

const canLookupPurchaseItem = computed(() => Boolean(
  showsPurchaseDetailInputs.value
  && form.assetType
  && form.requestedItemName.trim(),
))

const usesSelectableAsset = computed(() => (
  selectedKind.value === 'STANDARD_ASSET_REQUEST'
  || isStandardDirectPurchase.value
  || selectedKind.value === 'RENTAL'
  || selectedKind.value === 'RENTAL_EXTENSION'
  || selectedKind.value === 'MAINTENANCE'
  || selectedKind.value === 'RETURN'
  || selectedKind.value === 'PURCHASE_RETURN'
))

const usesNestedAssetSelection = computed(() => (
  selectedKind.value === 'STANDARD_ASSET_REQUEST'
  || isStandardDirectPurchase.value
  || selectedKind.value === 'RENTAL'
))

const usesInlineSelectableAsset = computed(() => (
  usesSelectableAsset.value && !usesNestedAssetSelection.value
))

const showsAssetSearch = computed(() => (
  selectedKind.value === 'STANDARD_ASSET_REQUEST'
  || isStandardDirectPurchase.value
  || selectedKind.value === 'RENTAL'
))

const requiresAssetSearchUsageType = computed(() => (
  selectedKind.value === 'RENTAL'
))

const requiresPurchaseUsageType = computed(() => (
  showsPurchaseRequestAssetType.value
))

const showsPurchaseQuantityAndPrice = computed(() => (
  selectedKind.value === 'NON_STANDARD_ASSET_REQUEST'
  || selectedKind.value === 'DIRECT_PURCHASE'
))

const showsPurchaseSeatCount = computed(() => (
  showsPurchaseQuantityAndPrice.value
  && form.assetType === 'INTANGIBLE'
))

const currentSearchAssetType = computed<AssetType>(() => (
  isAssetSelectionStep.value ? selectionAssetType.value : form.assetType
))

const assetSearchPlaceholder = computed(() => (
  currentSearchAssetType.value === 'INTANGIBLE'
    ? '품목명, 제공사 검색'
    : '품목명, 모델명, 제조사 검색'
))

const requestedItemDetailPlaceholder = computed(() => (
  form.assetType === 'INTANGIBLE'
    ? '예: Slack Enterprise Grid / Business+ / 연간 구독'
    : '예: MacBook Pro 14 M4 Pro / 24GB / 1TB'
))

const vendorFieldLabel = computed(() => (
  form.assetType === 'INTANGIBLE' ? '제공사' : '제조사'
))

const vendorPlaceholder = computed(() => (
  form.assetType === 'INTANGIBLE' ? '예: Slack Technologies' : '예: Apple'
))

const assetSelectionLabel = computed(() => {
  if (selectedKind.value === 'STANDARD_ASSET_REQUEST') return '품목 선택'
  if (isStandardDirectPurchase.value) return '직접 구매할 표준 품목 선택'
  if (selectedKind.value === 'RENTAL') return '대여할 품목 선택'
  if (selectedKind.value === 'RENTAL_EXTENSION') return '연장할 대여 자산 선택'
  if (selectedKind.value === 'MAINTENANCE') {
    return form.assetServiceType === 'RETURN' ? '반품할 자산 선택' : '수리할 자산 선택'
  }
  if (selectedKind.value === 'PURCHASE_RETURN') return '반품할 자산 선택'
  return '대상 자산 선택'
})

const assetSelectionEmptyText = computed(() => (
  selectedKind.value === 'RENTAL_EXTENSION'
    ? '연장 가능한 대여 자산이 없습니다.'
    : '선택할 수 있는 자산이 없습니다.'
))

const nestedAssetLabel = computed(() => (
  selectedKind.value === 'RENTAL' ? '대여 자산' : '요청 품목'
))

const visibleAssetOptions = computed(() => {
  if (selectedKind.value === 'STANDARD_ASSET_REQUEST') {
    return itemOptions.value.filter((item) => item.assetType === selectionAssetType.value)
  }
  if (isStandardDirectPurchase.value) {
    return itemOptions.value.filter((item) => (
      item.assetType === form.assetType
      && isStandardItem(item.isStandard)
    ))
  }
  if (selectedKind.value === 'RENTAL') {
    return itemOptions.value.filter((item) => item.assetType === 'TANGIBLE')
  }
  if (selectedKind.value === 'RETURN') {
    return returnAssetOptions.value.filter((item) => item.assetType === form.assetType)
  }
  if (selectedKind.value === 'PURCHASE_RETURN') {
    return purchaseReturnAssetOptions.value.filter((item) => item.assetType === form.assetType)
  }
  if (selectedKind.value === 'MAINTENANCE') {
    return form.assetServiceType === 'RETURN'
      ? purchaseReturnAssetOptions.value
      : maintenanceAssetOptions.value
  }

  if (selectedKind.value !== 'RENTAL_EXTENSION') {
    return ownedAssetOptions.value.filter((item) => item.assetType === 'TANGIBLE')
  }

  return activeRentalAssetOptions.value
    .map((item) => ({
      ...item,
      description: [
        item.description,
        item.returnDueDate
          ? `반납 예정일: ${formatDate(item.returnDueDate)}`
          : '반납 예정일 없음',
      ].filter(Boolean).join(' · '),
    }))
})

const assetCategoryOptions = computed(() => (
  selectedKind.value === 'RENTAL'
    ? tangibleCategoryGroups.value
    : selectionAssetType.value === 'INTANGIBLE'
      ? intangibleCategoryGroups.value
      : tangibleCategoryGroups.value
))

const purchaseRequestCategoryOptions = computed(() => (
  form.assetType === 'INTANGIBLE'
    ? intangibleCategoryGroups.value
    : tangibleCategoryGroups.value
))

const assetAssigneeOptions = computed<DropdownOption[]>(() => (
  departmentMembers.value
    .map((member) => ({
      label: `${member.name}${member.memberNo ? ` (${member.memberNo})` : ''}`,
      value: memberId(member),
    }))
    .filter((option) => option.value)
))

const allowsUnassignedAssignee = computed(() => showsPurchaseSeatCount.value)

const assetAssigneeRootOption = computed(() => (
  '자산 할당자 선택'
))

const requestedAssetCount = computed(() => (
  positiveNumber(form.quantity) ? Math.max(1, Number(form.quantity)) : 1
))

const requestedSeatCount = computed(() => (
  showsPurchaseSeatCount.value && positiveNumber(form.seatCount)
    ? Math.max(1, Number(form.seatCount))
    : 1
))

const requestedAssetQuantity = computed(() => requestedAssetCount.value * requestedSeatCount.value)

const canSearchAssets = computed(() => Boolean(
  (!requiresAssetSearchUsageType.value || assetSearchForm.assetUsageType)
))

const selectedAssetOption = computed(() => (
  confirmedSelectedAsset.value?.id === form.selectedAssetId
    ? confirmedSelectedAsset.value
    : null
))

const filteredAssetOptions = computed(() => {
  const keyword = assetSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return visibleAssetOptions.value

  return visibleAssetOptions.value.filter((item) => (
    `${item.name} ${item.description ?? ''}`.toLowerCase().includes(keyword)
  ))
})

const itemOptionGroups = computed<AssetRadioGroup[]>(() => {
  if (selectedKind.value !== 'STANDARD_ASSET_REQUEST') return []

  const standardItems = selectionItemOptions.value.filter((item) => isStandardItem(item.isStandard))
  const nonStandardItems = selectionItemOptions.value.filter((item) => !isStandardItem(item.isStandard))

  return [
    { label: '표준 품목', items: standardItems },
    { label: '비표준 품목', items: nonStandardItems },
  ]
})

const selectionItemOptions = computed(() => {
  if (isStandardDirectPurchase.value) {
    return itemOptions.value.filter((item) => (
      item.assetType === form.assetType
      && isStandardItem(item.isStandard)
    ))
  }
  if (selectedKind.value === 'STANDARD_ASSET_REQUEST') {
    return itemOptions.value.filter((item) => item.assetType === selectionAssetType.value)
  }
  if (selectedKind.value === 'RENTAL') {
    return itemOptions.value.filter((item) => item.assetType === 'TANGIBLE')
  }
  if (selectedKind.value === 'RETURN') {
    return returnAssetOptions.value.filter((item) => item.assetType === selectionAssetType.value)
  }
  if (selectedKind.value === 'PURCHASE_RETURN') {
    return purchaseReturnAssetOptions.value
  }
  return itemOptions.value
})

const selectionItemGroups = computed(() => (
  selectedKind.value === 'STANDARD_ASSET_REQUEST' ? itemOptionGroups.value : []
))

const reasonLabel = computed(() => {
  if (selectedKind.value === 'MAINTENANCE') {
    return form.assetServiceType === 'RETURN' ? '반품 사유' : '요청 상세 내용 및 증상'
  }
  if (selectedKind.value === 'RENTAL') return '대여 목적'
  if (selectedKind.value === 'RENTAL_EXTENSION') return '연장 요청 이유'
  if (selectedKind.value === 'RETURN') return '반납 및 해지 이유'
  if (selectedKind.value === 'PURCHASE_RETURN') return '반품 이유'
  return '신청 사유'
})

const reasonPlaceholder = computed(() => {
  if (selectedKind.value === 'MAINTENANCE') {
    return form.assetServiceType === 'RETURN'
      ? '반품 사유를 상세히 입력해주세요.'
      : '고장 증상이나 수리 요청 사항을 상세히 입력해주세요.'
  }
  if (selectedKind.value === 'RENTAL') return '대여 목적을 상세히 기술해주세요.'
  if (selectedKind.value === 'RENTAL_EXTENSION') return '연장이 필요한 이유를 상세히 기술해주세요.'
  if (selectedKind.value === 'RETURN') return '반납 및 해지할 이유를 상세히 입력해주세요.'
  if (selectedKind.value === 'PURCHASE_RETURN') return '반품 이유를 상세히 입력해주세요.'
  return '신청 사유를 상세히 입력해주세요.'
})

const dateErrorMessage = computed(() => {
  if (
    selectedKind.value === 'RENTAL'
    && form.rentalStartDate
    && form.rentalDueDate
    && form.rentalStartDate > form.rentalDueDate
  ) {
    return '반납 예정일은 대여 시작일보다 빠를 수 없습니다.'
  }
  return ''
})

const positiveNumber = (value: string) => Number.isFinite(Number(value)) && Number(value) > 0

function toRentalDateTime(value: string, time: '09:00:00' | '18:00:00') {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T${time}`
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`
  return value
}

function toRequestedUsageType(
  value: '' | 'DEPARTMENT' | RequestedUsageType,
): RequestedUsageType {
  if (!value) return 'DEPARTMENT'
  return value
}

function requestedUsagePayload(
  value: '' | 'DEPARTMENT' | RequestedUsageType,
) {
  return { requestedUsageType: toRequestedUsageType(value) }
}

const isFormValid = computed(() => {
  if (!selectedKind.value || !form.reason.trim() || dateErrorMessage.value) return false
  if (usesSelectableAsset.value && !form.selectedAssetId) return false
  if (
    requiresAssetAssignee.value
    && (
      form.assetAssigneeIds.length !== requestedAssetQuantity.value
      || (!allowsUnassignedAssignee.value && form.assetAssigneeIds.some((assigneeId) => !assigneeId))
    )
  ) return false
  if (requiresPurchaseUsageType.value && !form.assetUsageType) return false
  if (showsPurchaseCategorySelect.value && !form.category) return false

  if (selectedKind.value === 'STANDARD_ASSET_REQUEST') {
    return Boolean(
      positiveNumber(form.quantity)
      && (!requiresStandardEstimatedUnitPrice.value || positiveNumber(form.expectedPrice)),
    )
  }
  if (selectedKind.value === 'NON_STANDARD_ASSET_REQUEST') {
    return Boolean(
      form.requestedItemName.trim()
      && form.vendor.trim()
      && (form.assetType === 'TANGIBLE' || form.licenseType.trim())
      && form.externalUrl.trim()
      && positiveNumber(form.quantity)
      && (!showsPurchaseSeatCount.value || positiveNumber(form.seatCount))
      && positiveNumber(form.expectedPrice),
    )
  }
  if (selectedKind.value === 'DIRECT_PURCHASE') {
    if (isStandardDirectPurchase.value) {
      return Boolean(
        form.selectedAssetId
        && positiveNumber(form.quantity)
        && (!showsPurchaseSeatCount.value || positiveNumber(form.seatCount))
        && positiveNumber(form.expectedPrice),
      )
    }

    return Boolean(
      form.requestedItemName.trim()
      && form.vendor.trim()
      && (form.assetType === 'TANGIBLE' || form.licenseType.trim())
      && positiveNumber(form.quantity)
      && (!showsPurchaseSeatCount.value || positiveNumber(form.seatCount))
      && positiveNumber(form.expectedPrice),
    )
  }
  if (selectedKind.value === 'RENTAL') {
    return Boolean(form.rentalStartDate && form.rentalDueDate)
  }
  if (selectedKind.value === 'RENTAL_EXTENSION') {
    return Boolean(form.requestedDueDate)
  }
  return true
})

function toTangibleItemOption(item: TangibleAssetItem): SelectableAsset {
  const responseItem = item as TangibleAssetItem & {
    is_standard?: number | boolean | string | null
    standard?: number | boolean | string | null
  }
  const availableCount = itemAvailableCount(item)

  return {
    id: String(item.assetItemId ?? item.itemId ?? ''),
    name: item.productName ?? item.name,
    description: [item.categoryName ?? item.category, item.manufacturer, item.modelName]
      .filter(Boolean)
      .join(' · '),
    availableCount,
    assetType: 'TANGIBLE',
    isStandard: standardItemValue(item.isStandard ?? responseItem.is_standard ?? responseItem.standard),
    categoryId: item.categoryId,
    categoryName: item.categoryName ?? item.category,
    manufacturer: item.manufacturer,
  }
}

function toRentalAvailableItemOption(item: RentalAvailableItem): SelectableAsset {
  const responseItem = item as RentalAvailableItem & {
    is_standard?: number | boolean | string | null
    standard?: number | boolean | string | null
  }
  const availableCount = itemAvailableCount(item)

  return {
    id: String(item.tangibleAssetItemId ?? item.assetItemId ?? item.itemId ?? ''),
    name: item.productName ?? item.name ?? '',
    description: [
      item.categoryName,
      item.manufacturer,
      item.modelName,
    ].filter(Boolean).join(' · '),
    availableCount,
    assetType: 'TANGIBLE',
    isStandard: standardItemValue(item.isStandard ?? responseItem.is_standard ?? responseItem.standard),
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    manufacturer: item.manufacturer,
  }
}

function toIntangibleItemOption(item: IntangibleItem): SelectableAsset {
  const responseItem = item as IntangibleItem & {
    intangibleAssetItemId?: string
    name?: string
    provider?: string
    softwareType?: string
    is_standard?: number | boolean | string | null
    standard?: number | boolean | string | null
  }

  const availableCount = intangibleItemAvailableCount(item)

  return {
    id: String(item.assetItemId ?? item.itemId ?? responseItem.intangibleAssetItemId ?? item.id ?? ''),
    name: item.productName ?? responseItem.name ?? '',
    description: [
      item.category ?? responseItem.softwareType,
      item.vendor ?? responseItem.provider,
      licenseTypeLabel(item.licenseType),
    ].filter(Boolean).join(' · '),
    availableCount,
    availableCountLabel: availableCountLabel(availableCount, 'person'),
    assetType: 'INTANGIBLE',
    isStandard: standardItemValue(item.isStandard ?? responseItem.is_standard ?? responseItem.standard),
    categoryId: item.categoryId,
    categoryName: item.category ?? responseItem.softwareType,
    manufacturer: item.vendor ?? responseItem.provider,
    licenseType: item.licenseType,
  }
}

function itemAvailableCount(item: AvailableCountSource) {
  return numberValue(
    item.availableCount
      ?? item.availableAssetCount
      ?? item.intangibleAssetCount
      ?? item.totalAssetCount
      ?? item.assetTotalCount
      ?? item.stockCount
      ?? item.assetCount
      ?? item.count,
  )
}

function intangibleItemAvailableCount(item: AvailableCountSource) {
  const source = item as AvailableCountSource & Record<string, number | string | null | undefined>
  return numberValue(
    item.availableSeatCount
      ?? item.remainingSeatCount
      ?? item.remainingSeats
      ?? item.availableSeats
      ?? item.assignableSeatCount
      ?? item.remainingAssignableCount
      ?? item.remainingAssignableSeatCount
      ?? item.availableUserCount
      ?? item.remainingUserCount
      ?? item.availableMemberCount
      ?? item.remainingMemberCount
      ?? item.availableAssignmentCount
      ?? item.remainingAssignmentCount
      ?? source.available_seat_count
      ?? source.remaining_seat_count
      ?? source.available_user_count
      ?? source.remaining_user_count
      ?? source.available_member_count
      ?? source.remaining_member_count
      ?? source.available_assignment_count
      ?? source.remaining_assignment_count
      ?? item.availableCount
      ?? item.availableAssetCount
      ?? item.intangibleAssetCount
      ?? item.totalAssetCount
      ?? item.assetTotalCount
      ?? item.stockCount
      ?? item.assetCount
      ?? item.count,
  )
}

function availableCountLabel(count: number | undefined, unit: 'asset' | 'person' = 'asset') {
  if (typeof count !== 'number' || !Number.isFinite(count)) return undefined
  return unit === 'person'
    ? `할당 가능 ${count}명`
    : `남은 수량 ${count}개`
}

function numberValue(value: number | string | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function standardItemValue(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase()
    if (normalizedValue === 'false' || normalizedValue === '0' || normalizedValue === 'n') return false
    if (normalizedValue === 'true' || normalizedValue === '1' || normalizedValue === 'y') return true
  }
  return true
}

function isStandardItem(value: boolean | null | undefined) {
  return standardItemValue(value)
}

function normalizeLookupName(value: string | null | undefined) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function isSamePurchaseLookupName(item: SelectableAsset) {
  return Boolean(
    normalizeLookupName(item.name)
    && normalizeLookupName(item.name) === normalizeLookupName(form.requestedItemName),
  )
}

function resetPurchaseItemLookup() {
  hasSearchedPurchaseItems.value = false
  purchaseItemLookupError.value = ''
  purchaseItemLookupResults.value = []
}

function sortPurchaseItemLookupResults(items: SelectableAsset[]) {
  return [...items].sort((a, b) => Number(isSamePurchaseLookupName(b)) - Number(isSamePurchaseLookupName(a)))
}

async function handlePurchaseItemLookup() {
  if (!canLookupPurchaseItem.value) return

  isPurchaseItemLookupLoading.value = true
  purchaseItemLookupError.value = ''
  purchaseItemLookupResults.value = []

  try {
    if (form.assetType === 'INTANGIBLE') {
      const response = await intangibleItemApi.getList({
        page: 0,
        size: 5,
        keyword: form.requestedItemName.trim(),
      })
      purchaseItemLookupResults.value = sortPurchaseItemLookupResults(
        response.data.content.map(toIntangibleItemOption).filter((item) => item.id),
      )
    } else {
      const response = await tangibleItemApi.getList({
        page: 0,
        size: 5,
        keyword: form.requestedItemName.trim(),
      })
      purchaseItemLookupResults.value = sortPurchaseItemLookupResults(
        response.data.content.map(toTangibleItemOption).filter((item) => item.id),
      )
    }
  } catch (error) {
    purchaseItemLookupError.value = error instanceof Error
      ? error.message
      : '품목 조회에 실패했습니다.'
  } finally {
    hasSearchedPurchaseItems.value = true
    isPurchaseItemLookupLoading.value = false
  }
}

async function goToAssetRequestFromLookup(item: SelectableAsset) {
  await router.replace({
    name: 'TicketList',
    query: {
      ...route.query,
      create: '1',
      requestKind: 'STANDARD_ASSET_REQUEST',
      assetType: item.assetType,
      assetItemId: item.id,
      itemKeyword: item.name,
    },
  })

  selectedKind.value = 'STANDARD_ASSET_REQUEST'
  isAssetSelectionStep.value = false
  form.assetType = item.assetType
  selectionAssetType.value = item.assetType
  form.assetUsageType = 'DEPARTMENT'
  assetSearchForm.assetUsageType = 'DEPARTMENT'
  form.selectedAssetId = item.id
  form.category = ''
  form.requestedItemName = ''
  form.vendor = ''
  form.licenseType = ''
  form.externalUrl = ''
  form.quantity = '1'
  confirmedSelectedAsset.value = item
  itemOptions.value = [item, ...itemOptions.value.filter((option) => option.id !== item.id)]
  pendingSelectedAssetId.value = item.id
  requiresStandardEstimatedUnitPrice.value = false
  errorMessage.value = ''
  resetPurchaseItemLookup()
  syncAssetAssigneeIds()
}

function categoryIdByLabel(label: string) {
  const options = uniqueCategoryOptions(collectPurchaseCategoryOptions(
    form.assetType === 'INTANGIBLE'
      ? intangibleCategoryGroups.value
      : tangibleCategoryGroups.value,
  ))
  return String(options.find((option) => option.label === label)?.value ?? '')
}

function selectedDirectPurchaseItem() {
  if (!isStandardDirectPurchase.value) return null
  return confirmedSelectedAsset.value?.id === form.selectedAssetId
    ? confirmedSelectedAsset.value
    : itemOptions.value.find((item) => item.id === form.selectedAssetId) ?? null
}

function standardDirectPurchasePayload() {
  const selectedItem = selectedDirectPurchaseItem()
  if (!selectedItem) {
    throw new Error('직접 구매할 표준 품목을 선택해주세요.')
  }

  const categoryId = selectedItem.categoryId
    ?? categoryIdByLabel(selectedItem.categoryName ?? assetSearchForm.category)

  if (!categoryId) {
    throw new Error('선택한 품목의 자산 분류를 확인할 수 없습니다.')
  }

  if (!selectedItem.manufacturer?.trim()) {
    throw new Error('선택한 품목의 제조사/제공사 정보를 확인할 수 없습니다.')
  }

  return {
    categoryId,
    requestedItemDetail: selectedItem.name,
    manufacturer: selectedItem.manufacturer.trim(),
    licenseType: selectedItem.assetType === 'INTANGIBLE'
      ? selectedItem.licenseType ?? null
      : null,
  }
}

function getTangibleAssetId(asset: TangibleAsset) {
  return asset.assetId
    ?? asset.id
    ?? asset.tangibleAssetId
    ?? asset.tangibleAssetAssetId
    ?? ''
}

function toTangibleAssetOption(asset: TangibleAsset): SelectableAsset {
  return {
    id: String(getTangibleAssetId(asset)),
    name: asset.productName ?? asset.assetItemName ?? asset.assetCode,
    description: [asset.assetCode, asset.serialNumber ?? asset.serialNo]
      .filter(Boolean)
      .join(' · '),
    assetType: 'TANGIBLE',
    usageType: asset.usageType,
    returnDueDate: asset.returnDueDate,
  }
}

function toActiveRentalAssetOption(asset: ActiveRentalAsset): SelectableAsset {
  return {
    id: String(asset.assignmentId ?? ''),
    name: asset.productName ?? asset.assetCode ?? '',
    description: [
      asset.assetCode,
      asset.serialNumber,
      asset.manufacturer,
      asset.modelName,
    ].filter(Boolean).join(' · '),
    assetType: 'TANGIBLE',
    usageType: 'TEMPORARY',
    assignmentId: asset.assignmentId,
    returnDueDate: asset.currentReturnDueDate,
  }
}

function toMaintenanceAvailableAssetOption(asset: MaintenanceAvailableAsset): SelectableAsset {
  return {
    id: String(asset.assignmentId ?? ''),
    name: asset.productName ?? asset.assetCode ?? '',
    description: [
      asset.assetCode,
      asset.serialNumber,
      asset.manufacturer,
      asset.modelName,
      asset.assignedAt ? `배정일: ${formatDate(asset.assignedAt)}` : null,
    ].filter(Boolean).join(' · '),
    assetType: 'TANGIBLE',
    assignmentId: asset.assignmentId,
  }
}

function toAvailableAssignedAssetOption(asset: MaintenanceAvailableAsset): SelectableAsset {
  const assetType = asset.assetType ?? (asset.licenseCode ? 'INTANGIBLE' : 'TANGIBLE')

  return {
    id: String(asset.assignmentId ?? ''),
    name: asset.productName ?? asset.assetCode ?? '',
    description: [
      asset.assetCode,
      asset.serialNumber ?? asset.licenseCode,
      asset.manufacturer ?? asset.provider,
      asset.modelName,
      asset.returnDueDate ? `반납 예정일: ${formatDate(asset.returnDueDate)}` : null,
      asset.expiredAt ? `만료일: ${formatDate(asset.expiredAt)}` : null,
    ].filter(Boolean).join(' · '),
    assetType,
    assignmentId: asset.assignmentId,
    returnDueDate: asset.returnDueDate ?? asset.expiredAt ?? null,
  }
}

function toIntangibleAssetOption(asset: IntangibleAsset): SelectableAsset {
  return {
    id: String(asset.assetId),
    name: asset.assetItemName,
    description: [asset.assetCode, asset.vendor, asset.expiredAt].filter(Boolean).join(' · '),
    assetType: 'INTANGIBLE',
  }
}

function collectPurchaseCategoryOptions(value: unknown): DropdownOption[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectPurchaseCategoryOptions)
  }

  if (!value || typeof value !== 'object') {
    return []
  }

  const category = value as Record<string, unknown>
  const options: DropdownOption[] = []
  const categoryId = typeof category.categoryId === 'string' ? category.categoryId : ''
  const categoryName = typeof category.name === 'string'
    ? category.name
    : typeof category.mainCategory === 'string'
      ? category.mainCategory
      : ''

  if (categoryId && categoryName) {
    options.push({ label: categoryName, value: categoryId })
  }

  const subCategoryIds = category.subCategoryIds
  if (subCategoryIds && typeof subCategoryIds === 'object') {
    Object.entries(subCategoryIds).forEach(([name, id]) => {
      if (typeof id === 'string') options.push({ label: name, value: id })
    })
  }

  const childCategoryIds = category.childCategoryIds
  if (childCategoryIds && typeof childCategoryIds === 'object') {
    Object.entries(childCategoryIds).forEach(([name, id]) => {
      if (typeof id === 'string') options.push({ label: name, value: id })
    })
  }

  options.push(...collectPurchaseCategoryOptions(category.children))
  return options
}

function uniqueCategoryOptions(options: DropdownOption[]): DropdownOption[] {
  return [...new Map(options.map((option) => [String(option.value), option])).values()]
}

type TicketCategoryGroup = TangibleCategoryGroup | IntangibleCategoryGroup

type TicketCategoryTreeNode = {
  categoryId?: string | null
  tangibleAssetCategoryId?: string | null
  intangibleAssetCategoryId?: string | null
  tangibleCategoryId?: string | null
  intangibleCategoryId?: string | null
  assetCategoryId?: string | null
  id?: string | null
  uuid?: string | null
  mainCategory?: string | null
  name?: string | null
  categoryName?: string | null
  children?: TicketCategoryTreeNode[] | null
  subCategories?: string[] | TicketCategoryTreeNode[] | null
  childCategories?: Record<string, string[]> | null
  subCategoryIds?: Record<string, string> | null
  childCategoryIds?: Record<string, string> | null
}

function normalizeCategoryGroups(categories: TicketCategoryGroup[] | TicketCategoryTreeNode[] | string[]): TicketCategoryGroup[] {
  if (!categories.length) return []

  if (typeof categories[0] === 'string') {
    return (categories as string[]).map((category) => ({
      mainCategory: category,
      subCategories: [],
    }))
  }

  return (categories as TicketCategoryTreeNode[])
    .map((category) => {
      if (
        category.mainCategory
        && Array.isArray(category.subCategories)
        && category.subCategories.every((subCategory) => typeof subCategory === 'string')
      ) {
        return {
          categoryId: normalizeCategoryId(category),
          mainCategory: category.mainCategory,
          subCategories: category.subCategories,
          childCategories: category.childCategories ?? {},
          subCategoryIds: category.subCategoryIds ?? {},
          childCategoryIds: category.childCategoryIds ?? {},
        }
      }

      const mainCategory = normalizeCategoryName(category)
      const subCategories: string[] = []
      const childCategories: Record<string, string[]> = {}
      const subCategoryIds: Record<string, string> = {}
      const childCategoryIds: Record<string, string> = {}

      normalizeCategoryChildren(category).forEach((middleCategory) => {
        const middleName = normalizeCategoryName(middleCategory)
        if (!middleName) return

        subCategories.push(middleName)
        subCategoryIds[middleName] = normalizeCategoryId(middleCategory)

        const smallCategories = normalizeCategoryChildren(middleCategory)
          .map((smallCategory) => {
            const smallName = normalizeCategoryName(smallCategory)
            if (smallName) childCategoryIds[smallName] = normalizeCategoryId(smallCategory)
            return smallName
          })
          .filter(Boolean)

        if (smallCategories.length > 0) {
          childCategories[middleName] = smallCategories
          subCategories.push(...smallCategories)
        }
      })

      return {
        categoryId: normalizeCategoryId(category),
        mainCategory,
        subCategories,
        childCategories,
        subCategoryIds,
        childCategoryIds,
      }
    })
    .filter((category) => category.mainCategory)
}

function normalizeCategoryId(category: TicketCategoryTreeNode) {
  const id = category.categoryId
    ?? category.tangibleAssetCategoryId
    ?? category.intangibleAssetCategoryId
    ?? category.tangibleCategoryId
    ?? category.intangibleCategoryId
    ?? category.assetCategoryId
    ?? category.id
    ?? category.uuid
    ?? ''

  return String(id)
}

function normalizeCategoryName(category: TicketCategoryTreeNode) {
  return String(category.mainCategory ?? category.name ?? category.categoryName ?? '').trim()
}

function normalizeCategoryChildren(category: TicketCategoryTreeNode): TicketCategoryTreeNode[] {
  const children = category.children ?? category.subCategories ?? []
  return Array.isArray(children)
    ? children.filter((child): child is TicketCategoryTreeNode => typeof child === 'object' && child !== null)
    : []
}

async function loadAssetCategories() {
  const results = await Promise.allSettled([
    tangibleItemApi.getCategories(),
    intangibleItemApi.getCategories(),
  ])
  const [tangibleResult, intangibleResult] = results

  tangibleCategoryGroups.value = tangibleResult.status === 'fulfilled'
    ? normalizeCategoryGroups(tangibleResult.value.data)
    : []

  const intangibleCategories = intangibleResult.status === 'fulfilled'
    ? intangibleResult.value.data
    : []
  intangibleCategoryGroups.value = normalizeCategoryGroups(intangibleCategories)
}

async function loadOwnedAssets() {
  const memberId = authStore.user?.memberId
  const results = await Promise.allSettled([
    tangibleAssetApi.getList({ page: 0, size: 100, currentUserId: memberId }),
    intangibleAssetApi.getList({ page: 0, size: 100, currentUserId: memberId }),
    ticketCreateApi.getActiveRentalAssets(),
    ticketCreateApi.getMaintenanceAvailableAssets(),
  ])

  const [
    tangibleAssetsResult,
    intangibleAssetsResult,
    activeRentalAssetsResult,
    maintenanceAssetsResult,
  ] = results

  ownedAssetOptions.value = [
    ...(tangibleAssetsResult.status === 'fulfilled'
      ? tangibleAssetsResult.value.data.content.map(toTangibleAssetOption)
      : []),
    ...(intangibleAssetsResult.status === 'fulfilled'
      ? intangibleAssetsResult.value.data.content.map(toIntangibleAssetOption)
      : []),
  ].filter((item) => item.id)
  activeRentalAssetOptions.value = activeRentalAssetsResult.status === 'fulfilled'
    ? activeRentalAssetsResult.value.data.map(toActiveRentalAssetOption).filter((item) => item.id)
    : []
  maintenanceAssetOptions.value = maintenanceAssetsResult.status === 'fulfilled'
    ? maintenanceAssetsResult.value.data.map(toMaintenanceAvailableAssetOption).filter((item) => item.id)
    : []

}

async function loadDepartmentMembers() {
  const departmentId = authStore.user?.departmentId
  const requesterId = authStore.user?.memberId

  departmentMembers.value = []
  form.assetAssigneeId = ''
  form.assetAssigneeIds = []
  assigneeErrorMessage.value = ''

  isAssigneeLoading.value = true

  try {
    const response = await memberApi.getList({
      page: 0,
      size: 999,
      departmentId: departmentId || undefined,
      status: 'ACTIVE',
    })
    let members = response.data.content
    const hasDepartmentScopedResponse = Boolean(departmentId && members.length > 0)

    if (members.length === 0 && departmentId) {
      const fallbackResponse = await memberApi.getList({ page: 0, size: 999, status: 'ACTIVE' })
      members = fallbackResponse.data.content
    }
    let targetDepartmentId = departmentId
    let targetDepartmentName = authStore.user?.departmentName ?? ''

    if ((!targetDepartmentId || !targetDepartmentName) && requesterId) {
      const requester = members.find((member) => String(memberId(member)) === String(requesterId))
      targetDepartmentId ||= memberDepartmentId(requester)
      targetDepartmentName ||= memberDepartmentName(requester)
    }

    if (!targetDepartmentId && !targetDepartmentName) {
      const fallbackResponse = await memberApi.getList({ page: 0, size: 999, status: 'ACTIVE' })
      members = fallbackResponse.data.content
      const requester = members.find((member) => String(memberId(member)) === String(requesterId))
      targetDepartmentId = memberDepartmentId(requester)
      targetDepartmentName = memberDepartmentName(requester)
    }

    departmentMembers.value = hasDepartmentScopedResponse
      ? members.filter(isAssignableMember)
      : members.filter((member) => (
        isAssignableMember(member)
        && isSameDepartmentMember(member, targetDepartmentId, targetDepartmentName)
      ))
    syncAssetAssigneeIds()

    if (departmentMembers.value.length === 0) {
      assigneeErrorMessage.value = '같은 부서에서 선택 가능한 구성원이 없습니다.'
    }
  } catch (error) {
    departmentMembers.value = []
    assigneeErrorMessage.value = error instanceof Error
      ? error.message
      : '같은 부서 구성원 목록을 불러오지 못했습니다.'
  } finally {
    isAssigneeLoading.value = false
  }
}

function memberId(member: Member | null | undefined) {
  if (!member) return ''
  const record = member as MemberRecord
  return String(member.memberId ?? record.member_id ?? record.employeeId ?? record.employee_id ?? record.id ?? '')
}

function memberDepartmentId(member: Member | null | undefined) {
  if (!member) return ''
  const record = member as MemberRecord
  return String(
    member.departmentId
      ?? record.department_id
      ?? record.deptId
      ?? record.dept_id
      ?? record.department?.departmentId
      ?? record.department?.department_id
      ?? record.department?.id
      ?? '',
  )
}

function memberDepartmentName(member: Member | null | undefined) {
  if (!member) return ''
  const record = member as MemberRecord
  return String(
    member.departmentName
      ?? record.departmentNamePath
      ?? record.deptName
      ?? record.teamName
      ?? record.department?.departmentName
      ?? record.department?.departmentNamePath
      ?? record.department?.name
      ?? '',
  )
}

function isAssignableMember(member: Member) {
  return member.status === 'ACTIVE'
}

function isSameDepartmentMember(member: Member, departmentId: string | undefined, departmentName: string) {
  const currentDepartmentId = memberDepartmentId(member)
  if (departmentId && currentDepartmentId) {
    return String(currentDepartmentId) === String(departmentId)
  }

  const currentDepartmentName = normalizeDepartmentName(memberDepartmentName(member))
  const targetDepartmentName = normalizeDepartmentName(departmentName)
  return Boolean(targetDepartmentName && currentDepartmentName && currentDepartmentName === targetDepartmentName)
}

function normalizeDepartmentName(value: string | null | undefined) {
  return String(value ?? '')
    .split('>')
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1)
    ?.toLowerCase()
    ?? ''
}

function syncAssetAssigneeIds() {
  const quantity = requestedAssetQuantity.value
  const currentIds = allowsUnassignedAssignee.value
    ? uniqueAssignableAssigneeIds(form.assetAssigneeIds)
    : form.assetAssigneeIds.filter(Boolean)
  const requesterId = authStore.user?.memberId ?? ''
  const defaultId = departmentMembers.value.some((member) => memberId(member) === requesterId)
    ? requesterId
    : memberId(departmentMembers.value[0])

  if (!allowsUnassignedAssignee.value) {
    form.assetAssigneeIds = Array.from({ length: quantity }, (_, index) => currentIds[index] ?? defaultId)
    form.assetAssigneeId = form.assetAssigneeIds[0] ?? ''
    return
  }

  const defaultIds = [
    ...(departmentMembers.value.some((member) => memberId(member) === requesterId) ? [requesterId] : []),
    ...departmentMembers.value.map(memberId),
  ].filter(Boolean)
  const assignableIds = [...new Set([...currentIds, ...defaultIds])]
  const usedIds = new Set<string>()

  form.assetAssigneeIds = Array.from({ length: quantity }, (_, index) => {
    const currentId = currentIds[index]
    if (currentId && !usedIds.has(currentId)) {
      usedIds.add(currentId)
      return currentId
    }

    const nextId = assignableIds.find((id) => !usedIds.has(id)) ?? ''
    if (nextId) usedIds.add(nextId)
    return nextId
  })
  form.assetAssigneeId = form.assetAssigneeIds[0] ?? ''
}

function uniqueAssignableAssigneeIds(ids: string[]) {
  const seen = new Set<string>()
  return ids.filter((id) => {
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

async function loadRequestAvailableAssets() {
  if (
    selectedKind.value !== 'RETURN'
    && selectedKind.value !== 'PURCHASE_RETURN'
    && !(selectedKind.value === 'MAINTENANCE' && form.assetServiceType === 'RETURN')
  ) {
    return
  }

  isAssetsLoading.value = true
  assetErrorMessage.value = ''

  try {
    if (selectedKind.value === 'RETURN') {
      const response = await ticketCreateApi.getReturnAvailableAssets({ assetType: form.assetType })
      returnAssetOptions.value = response.data.map(toAvailableAssignedAssetOption).filter((item) => item.id)
      return
    }

    const response = await ticketCreateApi.getPurchaseReturnAvailableAssets({ assetType: form.assetType })
    purchaseReturnAssetOptions.value = response.data.map(toAvailableAssignedAssetOption).filter((item) => item.id)
  } catch (error) {
    if (selectedKind.value === 'RETURN') {
      returnAssetOptions.value = []
    } else {
      purchaseReturnAssetOptions.value = []
    }
    assetErrorMessage.value = error instanceof Error
      ? error.message
      : '자산 목록을 불러오지 못했습니다.'
  } finally {
    hasSearchedAssets.value = true
    isAssetsLoading.value = false
  }
}

async function loadSelectableAssets() {
  await Promise.all([loadAssetCategories(), loadOwnedAssets()])
}

async function handleAssetSearch() {
  if (!canSearchAssets.value) return

  isAssetsLoading.value = true
  assetErrorMessage.value = ''
  pendingSelectedAssetId.value = ''

  try {
    if (selectedKind.value === 'RENTAL') {
      const response = await ticketCreateApi.getRentalAvailableItems({
        page: 0,
        size: 100,
        categoryId: assetSearchForm.category || undefined,
        keyword: assetSearchForm.keyword.trim() || undefined,
      })
      itemOptions.value = response.data.content.map(toRentalAvailableItemOption).filter((item) => item.id)
    } else if (selectionAssetType.value === 'INTANGIBLE') {
      const response = await intangibleItemApi.getList({
        page: 0,
        size: 100,
        categoryId: assetSearchForm.category || undefined,
        keyword: assetSearchForm.keyword.trim() || undefined,
      })
      itemOptions.value = response.data.content.map(toIntangibleItemOption).filter((item) => item.id)
    } else {
      const response = await tangibleItemApi.getList({
        page: 0,
        size: 100,
        categoryId: assetSearchForm.category || undefined,
        keyword: assetSearchForm.keyword.trim() || undefined,
      })
      itemOptions.value = response.data.content.map(toTangibleItemOption).filter((item) => item.id)
    }
  } catch (error) {
    itemOptions.value = []
    assetErrorMessage.value = error instanceof Error
      ? error.message
      : '자산 목록을 불러오지 못했습니다.'
  } finally {
    hasSearchedAssets.value = true
    isAssetsLoading.value = false
  }
}

function resetForm() {
  selectedKind.value = ''
  isAssetSelectionStep.value = false
  pendingSelectedAssetId.value = ''
  selectionAssetType.value = 'TANGIBLE'
  confirmedSelectedAsset.value = null
  errorMessage.value = ''
  requiresStandardEstimatedUnitPrice.value = false
  assetErrorMessage.value = ''
  assetSearchKeyword.value = ''
  hasSearchedAssets.value = false
  itemOptions.value = []
  resetPurchaseItemLookup()
  Object.assign(assetSearchForm, {
    assetUsageType: 'DEPARTMENT',
    category: '',
    keyword: '',
  })
  Object.assign(form, {
    assetType: 'TANGIBLE',
    assetServiceType: 'REPAIR',
    directPurchaseItemType: 'STANDARD',
    assetUsageType: 'DEPARTMENT',
    category: '',
    selectedAssetId: '',
    assetAssigneeId: authStore.user?.memberId ?? '',
    assetAssigneeIds: Array.from({ length: requestedAssetQuantity.value }, () => authStore.user?.memberId ?? ''),
    requestedItemName: '',
    vendor: '',
    licenseType: '',
    externalUrl: '',
    quantity: '1',
    seatCount: '1',
    expectedPrice: '',
    rentalStartDate: '',
    rentalDueDate: '',
    requestedDueDate: '',
    reason: '',
  })
}

function resetSelection() {
  resetForm()
}

function queryString(value: unknown) {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : ''
  return typeof value === 'string' ? value : ''
}

function queryRequestKind(): TicketRequestKind | '' {
  const value = queryString(route.query.requestKind)
  return Object.hasOwn(requestTitleMap, value) ? value as TicketRequestKind : ''
}

function handleKindSelect(kind: TicketRequestKind) {
  selectedKind.value = kind
  requiresStandardEstimatedUnitPrice.value = false
  form.assetType = 'TANGIBLE'
  form.assetServiceType = 'REPAIR'
  form.directPurchaseItemType = 'STANDARD'
  form.assetUsageType = 'DEPARTMENT'
  assetSearchForm.assetUsageType = 'DEPARTMENT'
  form.category = ''
  form.selectedAssetId = ''
  form.seatCount = '1'
  form.assetAssigneeId = authStore.user?.memberId ?? ''
  syncAssetAssigneeIds()
  assetSearchKeyword.value = ''
  errorMessage.value = ''
  returnAssetOptions.value = []
  purchaseReturnAssetOptions.value = []

  if (kind === 'RETURN' || kind === 'PURCHASE_RETURN') {
    void loadRequestAvailableAssets()
  }

  if (requiresAssetAssignee.value && departmentMembers.value.length === 0) {
    void loadDepartmentMembers()
  }
}

async function applyInitialRequestKindFromRoute() {
  const initialKind = queryRequestKind()
  if (!initialKind) return

  handleKindSelect(initialKind)

  const initialAssetType = queryString(route.query.assetType)
  if (initialAssetType === 'TANGIBLE' || initialAssetType === 'INTANGIBLE') {
    form.assetType = initialAssetType
    selectionAssetType.value = initialAssetType
  }

  const itemKeyword = queryString(route.query.itemKeyword)
  const assetItemId = queryString(route.query.assetItemId)
  if (initialKind !== 'STANDARD_ASSET_REQUEST' || (!itemKeyword && !assetItemId)) return

  assetSearchForm.keyword = itemKeyword
  await handleAssetSearch()

  const selectedItem = itemOptions.value.find((item) => (
    (assetItemId && item.id === assetItemId)
    || (itemKeyword && normalizeLookupName(item.name) === normalizeLookupName(itemKeyword))
  ))

  if (!selectedItem) return
  form.selectedAssetId = selectedItem.id
  confirmedSelectedAsset.value = selectedItem
  pendingSelectedAssetId.value = selectedItem.id
}

function openAssetSelection() {
  pendingSelectedAssetId.value = form.selectedAssetId
  selectionAssetType.value = selectedKind.value === 'RENTAL' || selectedKind.value === 'PURCHASE_RETURN'
    ? 'TANGIBLE'
    : form.assetType
  if (isStandardDirectPurchase.value) {
    assetSearchForm.assetUsageType = form.assetUsageType === 'PERSONAL' ? 'PERSONAL' : 'DEPARTMENT'
  }
  if (selectedKind.value === 'STANDARD_ASSET_REQUEST') {
    assetSearchForm.assetUsageType = form.assetUsageType === 'PERSONAL' ? 'PERSONAL' : 'DEPARTMENT'
  }
  isAssetSelectionStep.value = true
  if (selectedKind.value === 'RETURN' || selectedKind.value === 'PURCHASE_RETURN') {
    void loadRequestAvailableAssets()
    return
  }

  if (showsAssetSearch.value && !hasSearchedAssets.value) {
    void handleAssetSearch()
  }
}

function closeAssetSelection() {
  pendingSelectedAssetId.value = ''
  assetSearchKeyword.value = ''
  isAssetSelectionStep.value = false
}

function confirmAssetSelection() {
  if (!pendingSelectedAssetId.value) return
  const selectedAsset = selectionItemOptions.value.find((item) => item.id === pendingSelectedAssetId.value)
  if (!selectedAsset) return

  if (selectedKind.value === 'STANDARD_ASSET_REQUEST' && form.selectedAssetId !== pendingSelectedAssetId.value) {
    requiresStandardEstimatedUnitPrice.value = false
    form.expectedPrice = ''
  }

  form.assetType = selectionAssetType.value
  form.selectedAssetId = pendingSelectedAssetId.value
  confirmedSelectedAsset.value = selectedAsset
  assetSearchKeyword.value = ''
  isAssetSelectionStep.value = false
}

function handleSelectionAssetTypeChange(assetType: AssetType) {
  selectionAssetType.value = assetType
  pendingSelectedAssetId.value = ''
  requiresStandardEstimatedUnitPrice.value = false
  form.expectedPrice = ''
  assetSearchForm.category = ''
  invalidateAssetSearch()
  if (isAssetSelectionStep.value && showsAssetSearch.value) {
    void handleAssetSearch()
  }
}

function handleAssetCategoryChange(value: string | number) {
  if (typeof value !== 'string') return
  assetSearchForm.category = value
  invalidateAssetSearch()
}

function handlePurchaseRequestCategoryChange(value: string | number) {
  if (typeof value !== 'string') return
  form.category = value
}

function handleAssetAssigneeChange(index: number, value: string | number) {
  form.assetAssigneeIds[index] = String(value)
  form.assetAssigneeId = form.assetAssigneeIds[0] ?? ''
}

function assetAssigneeOptionsFor(index: number) {
  const currentId = form.assetAssigneeIds[index] ?? ''
  const selectedIds = new Set(
    allowsUnassignedAssignee.value
      ? form.assetAssigneeIds.filter((assigneeId, assigneeIndex) => assigneeIndex !== index && assigneeId)
      : [],
  )
  const unassignedOption = allowsUnassignedAssignee.value
    ? [{ label: '할당자 없음', value: '' }]
    : []

  return [
    ...unassignedOption,
    ...assetAssigneeOptions.value.filter((option) => (
      String(option.value) === currentId || !selectedIds.has(String(option.value))
    )),
  ]
}

function handleDirectPurchaseItemTypeChange(value: 'STANDARD' | 'NON_STANDARD') {
  form.directPurchaseItemType = value
  form.category = ''
  form.selectedAssetId = ''
  form.requestedItemName = ''
  form.vendor = ''
  form.licenseType = ''
  form.seatCount = '1'
  confirmedSelectedAsset.value = null
  pendingSelectedAssetId.value = ''
  resetPurchaseItemLookup()
  invalidateAssetSearch()
}

function invalidateAssetSearch() {
  pendingSelectedAssetId.value = ''
  itemOptions.value = []
  hasSearchedAssets.value = false
  assetErrorMessage.value = ''
}

function handleAssetTypeChange(assetType: AssetType) {
  form.assetType = assetType
  form.category = ''
  form.selectedAssetId = ''
  form.requestedItemName = ''
  form.vendor = ''
  form.licenseType = ''
  form.seatCount = '1'
  confirmedSelectedAsset.value = null
  pendingSelectedAssetId.value = ''
  resetPurchaseItemLookup()
  invalidateAssetSearch()

  if (selectedKind.value === 'RETURN' || selectedKind.value === 'PURCHASE_RETURN') {
    void loadRequestAvailableAssets()
  }
}

function handleAssetUsageTypeChange() {
  assetSearchForm.assetUsageType = form.assetUsageType
  form.selectedAssetId = ''
  requiresStandardEstimatedUnitPrice.value = false
  form.expectedPrice = ''
  confirmedSelectedAsset.value = null
  pendingSelectedAssetId.value = ''
}

function handleAssetServiceTypeChange(assetServiceType: 'REPAIR' | 'RETURN') {
  form.assetServiceType = assetServiceType
  form.selectedAssetId = ''
  form.reason = ''
  confirmedSelectedAsset.value = null
  assetSearchKeyword.value = ''

  if (assetServiceType === 'RETURN') {
    void loadRequestAvailableAssets()
  }
}

function handleClose() {
  if (isSubmitting.value) return
  emit('close')
}

function selectedAssetId() {
  const id = form.selectedAssetId.trim()
  if (!id) {
    throw new Error('선택한 자산 ID 형식이 티켓 API 계약과 일치하지 않습니다.')
  }
  return id
}

function assignmentTargetMemberIds() {
  return form.assetAssigneeIds.map((assigneeId) => assigneeId || null)
}

function purchaseSeatCountPayload() {
  return showsPurchaseSeatCount.value ? Number(form.seatCount) : null
}

function shouldRequestStandardEstimatedUnitPrice(error: unknown) {
  if (!(error instanceof ApiError)) return false

  return error.status === 400
    && (
      error.errorCode === 'COMMON_001'
      || error.message.includes('비표준 유형자산 요청은 재고가 충분한 품목만 요청할 수 있습니다.')
    )
}

async function handleSubmit() {
  if (isSubmitting.value || !isFormValid.value || !selectedKind.value) return
  if (authStore.currentRole === 'ADMIN' || authStore.currentRole === 'SUPER_ADMIN') {
    errorMessage.value = '최고 관리자는 티켓을 생성할 수 없습니다.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    let response
    const requestReason = form.reason.trim()

    switch (selectedKind.value) {
      case 'STANDARD_ASSET_REQUEST':
        response = await ticketCreateApi.createStandardRequest({
          ...requestedUsagePayload(form.assetUsageType),
          assetType: form.assetType,
          assetItemId: form.selectedAssetId,
          assignmentTargetMemberIds: form.assetAssigneeIds,
          quantity: Number(form.quantity),
          ...(requiresStandardEstimatedUnitPrice.value
            ? { estimatedUnitPrice: Number(form.expectedPrice) }
            : {}),
          requestReason,
        })
        break
      case 'NON_STANDARD_ASSET_REQUEST':
        response = await ticketCreateApi.createNonStandardRequest({
          ...requestedUsagePayload(form.assetUsageType),
          assetType: form.assetType,
          categoryId: form.category,
          assignmentTargetMemberIds: assignmentTargetMemberIds(),
          requestedItemDetail: form.requestedItemName.trim(),
          manufacturer: form.vendor.trim(),
          licenseType: form.assetType === 'INTANGIBLE' ? form.licenseType.trim() : null,
          purchaseUrl: form.externalUrl.trim(),
          quantity: Number(form.quantity),
          seatCount: purchaseSeatCountPayload(),
          expectedPrice: Number(form.expectedPrice),
          requestReason,
        })
        break
      case 'DIRECT_PURCHASE':
        if (isStandardDirectPurchase.value) {
          const standardPayload = standardDirectPurchasePayload()
          response = await ticketCreateApi.createDirectPurchaseRequest({
            ...requestedUsagePayload(form.assetUsageType),
            assetType: form.assetType,
            isStandard: true,
            assetItemId: form.selectedAssetId,
            assignmentTargetMemberIds: assignmentTargetMemberIds(),
            categoryId: standardPayload.categoryId,
            requestedItemDetail: standardPayload.requestedItemDetail,
            manufacturer: standardPayload.manufacturer,
            licenseType: standardPayload.licenseType,
            quantity: Number(form.quantity),
            seatCount: purchaseSeatCountPayload(),
            expectedPrice: Number(form.expectedPrice),
            requestReason,
          })
        } else {
          response = await ticketCreateApi.createDirectPurchaseRequest({
            ...requestedUsagePayload(form.assetUsageType),
            assetType: form.assetType,
            isStandard: false,
            assetItemId: null,
            assignmentTargetMemberIds: assignmentTargetMemberIds(),
            categoryId: form.category,
            requestedItemDetail: form.requestedItemName.trim(),
            manufacturer: form.vendor.trim(),
            licenseType: form.assetType === 'INTANGIBLE' ? form.licenseType.trim() : null,
            quantity: Number(form.quantity),
            seatCount: purchaseSeatCountPayload(),
            expectedPrice: Number(form.expectedPrice),
            requestReason,
          })
        }
        break
      case 'RENTAL':
        response = await ticketCreateApi.createRentalRequest({
          requestedUsageType: toRequestedUsageType(assetSearchForm.assetUsageType),
          tangibleAssetItemId: form.selectedAssetId,
          rentalStartDate: toRentalDateTime(form.rentalStartDate, '09:00:00'),
          requestedDueDate: toRentalDateTime(form.rentalDueDate, '18:00:00'),
          requestReason,
        })
        break
      case 'RENTAL_EXTENSION':
        response = await ticketCreateApi.createRentalExtension({
          assignmentId: selectedAssetId(),
          requestedDueDate: toRentalDateTime(form.requestedDueDate, '18:00:00'),
          requestReason,
        })
        break
      case 'MAINTENANCE':
        response = form.assetServiceType === 'RETURN'
          ? await ticketCreateApi.createPurchaseReturnRequest({
            assetType: 'TANGIBLE',
            assignmentId: selectedAssetId(),
            requestReason,
          })
          : await ticketCreateApi.createMaintenanceRequest({
            assignmentId: selectedAssetId(),
            requestDetail: requestReason,
          })
        break
      case 'RETURN':
        response = await ticketCreateApi.createReturnRequest({
          assetType: form.assetType,
          assignmentId: selectedAssetId(),
          requestReason,
        })
        break
      case 'PURCHASE_RETURN':
        response = await ticketCreateApi.createPurchaseReturnRequest({
          assetType: form.assetType,
          assignmentId: selectedAssetId(),
          requestReason,
        })
        break
    }

    if (response) emit('created', response.data)
  } catch (error) {
    if (selectedKind.value === 'STANDARD_ASSET_REQUEST' && shouldRequestStandardEstimatedUnitPrice(error)) {
      requiresStandardEstimatedUnitPrice.value = true
      errorMessage.value = STANDARD_ESTIMATED_UNIT_PRICE_REQUIRED_MESSAGE
      return
    }
    errorMessage.value = error instanceof Error
      ? error.message
      : '요청을 등록하지 못했습니다. 입력 내용을 확인해주세요.'
  } finally {
    isSubmitting.value = false
  }
}

watch(() => props.isOpen, async (isOpen) => {
  if (!isOpen) return
  resetForm()
  await loadSelectableAssets()
  await applyInitialRequestKindFromRoute()
})

watch(() => [form.requestedItemName, form.assetType], () => {
  resetPurchaseItemLookup()
})

watch(errorMessage, async (message) => {
  if (!message) return

  await nextTick()
  errorMessageRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  errorMessageRef.value?.focus({ preventScroll: true })
})

watch(requestedAssetQuantity, () => {
  if (!requiresAssetAssignee.value) return
  syncAssetAssigneeIds()
})
</script>
