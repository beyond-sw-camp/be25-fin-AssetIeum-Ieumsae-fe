<template>
  <div ref="rootRef" class="relative w-full text-left" :class="$attrs.class">
    <button
      :id="props.id"
      type="button"
      :disabled="props.disabled"
      :class="[
        'w-full h-9 inline-flex items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-text-main transition-all hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary/20',
        props.disabled && 'cursor-not-allowed bg-surface-secondary text-text-muted opacity-60 hover:bg-surface-secondary focus:ring-0'
      ]"
      @click="toggleOpen"
    >
      <div class="flex items-center gap-2 overflow-hidden">
        <slot name="icon" />
        <span :class="['truncate', selectedTextClass]">{{ selectedLabel }}</span>
      </div>
      <ChevronDown
        :size="16"
        class="text-text-muted shrink-0 ml-2 transition-transform"
        :class="isOpen && 'rotate-180'"
      />
    </button>

    <div
      v-if="isOpen"
      :style="menuStyle"
      :class="[
        menuStrategy === 'fixed' ? 'fixed z-[10020] overflow-y-auto' : 'absolute w-full z-50',
        'rounded-xl border border-border bg-surface shadow-xl',
        menuStrategy === 'absolute' && (effectiveMenuDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'),
        menuStrategy === 'absolute' && (menuAlign === 'right' ? 'right-0' : 'left-0'),
        isPanelDropdown && !isSimpleOptions ? 'max-h-72 overflow-y-auto' : '',
      ]"
    >
      <ul class="py-1" :class="{ 'max-h-60 overflow-y-auto': isSimpleOptions }">
        <li
          v-if="rootOption && !isPlaceholderRootOption"
          :class="[
            'px-4 py-2 text-sm hover:bg-surface-secondary cursor-pointer',
            modelValue === rootOption ? 'font-semibold' : 'text-text-main'
          ]"
          @click="selectOption(rootOption)"
        >
          {{ rootOption }}
        </li>

        <li
          v-for="option in simpleOptions"
          :key="String(option.value)"
          :class="[
            'px-4 py-2 text-sm hover:bg-surface-secondary cursor-pointer',
            modelValue === option.value ? 'text-primary font-semibold' : 'text-text-main'
          ]"
          @click="selectOption(option.value)"
        >
          {{ option.label }}
        </li>

        <li
          v-for="group in panelGroupedOptions"
          :key="`panel-${group.mainCategory}`"
        >
          <div
            :class="[
              'flex items-center text-sm hover:bg-surface-secondary transition-colors',
              isGroupSelected(group) ? 'text-primary font-semibold' : 'text-text-main'
            ]"
          >
            <button
              type="button"
              class="min-w-0 flex-1 px-4 py-2 text-left"
              @click.stop="selectOption(getCategoryValue(group))"
            >
              <span class="block truncate">{{ group.mainCategory }}</span>
            </button>
            <button
              v-if="getMiddleCategories(group).length"
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center text-text-muted"
              @click.stop="togglePanelGroup(group.mainCategory)"
            >
              <ChevronDown
                :size="15"
                class="transition-transform"
                :class="activeGroup === group.mainCategory && 'rotate-180'"
              />
            </button>
          </div>

          <ul
            v-if="activeGroup === group.mainCategory"
            class="border-l border-border/70 ml-4 pl-2"
          >
            <li
              v-for="subCategory in getMiddleCategories(group)"
              :key="`${group.mainCategory}-${subCategory}`"
            >
              <div
                :class="[
                  'flex items-center text-sm hover:bg-surface-secondary transition-colors',
                  modelValue === subCategory || isSubCategorySelected(group, subCategory) ? 'text-primary font-semibold' : 'text-text-main'
                ]"
              >
                <button
                  type="button"
                  class="min-w-0 flex-1 px-3 py-2 text-left"
                  @click.stop="selectOption(getSubCategoryValue(group, subCategory))"
                >
                  <span class="block truncate">{{ subCategory }}</span>
                </button>
                <button
                  v-if="getSmallCategories(group, subCategory).length"
                  type="button"
                  class="flex h-9 w-9 shrink-0 items-center justify-center text-text-muted"
                  @click.stop="togglePanelSubCategory(subCategory)"
                >
                  <ChevronDown
                    :size="15"
                    class="transition-transform"
                    :class="activeSubCategory === subCategory && 'rotate-180'"
                  />
                </button>
              </div>

              <ul
                v-if="activeSubCategory === subCategory && getSmallCategories(group, subCategory).length"
                class="border-l border-border/60 ml-4 pl-2"
              >
                <li
                  v-for="smallCategory in getSmallCategories(group, subCategory)"
                  :key="`${group.mainCategory}-${subCategory}-${smallCategory}`"
                >
                  <button
                    type="button"
                    :class="[
                      'w-full flex items-center px-3 py-2 text-sm hover:bg-surface-secondary transition-colors',
                      String(modelValue) === smallCategory || String(modelValue) === group.childCategoryIds?.[smallCategory] ? 'text-primary font-semibold' : 'text-text-main'
                    ]"
                    @click.stop="selectOption(getSmallCategoryValue(group, smallCategory))"
                  >
                    <span class="truncate">{{ smallCategory }}</span>
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </li>

        <li
          v-for="group in groupedOptions"
          :key="group.mainCategory"
          class="relative"
          @mouseenter="activateGroup(group.mainCategory, $event)"
        >
          <button
            type="button"
            :class="[
              'w-full flex items-center justify-start gap-2 px-4 py-2 text-sm hover:bg-surface-secondary transition-colors',
              isGroupSelected(group) ? 'text-primary font-semibold' : 'text-text-main'
            ]"
            @click.stop="selectOption(getCategoryValue(group))"
          >
            <span class="truncate">{{ group.mainCategory }}</span>
          </button>

          <ul
            v-if="activeGroup === group.mainCategory"
            :class="[
              'absolute top-0 w-44 rounded-xl border border-border bg-surface py-1 shadow-xl max-h-60',
              hasSmallCategories(group) ? 'overflow-visible' : 'overflow-y-auto',
              effectiveSubmenuDirection === 'left' ? 'right-full mr-1' : 'left-full ml-1'
            ]"
          >
            <li
              v-for="subCategory in getMiddleCategories(group)"
              :key="subCategory"
              class="relative"
              @mouseenter="activateSubCategory(subCategory, $event)"
            >
              <button
                type="button"
                :class="[
                  'w-full flex items-center justify-between gap-2 px-4 py-2 text-sm hover:bg-surface-secondary transition-colors whitespace-nowrap',
                  modelValue === subCategory || isSubCategorySelected(group, subCategory) ? 'text-primary font-semibold' : 'text-text-main'
                ]"
                @click.stop="selectOption(getSubCategoryValue(group, subCategory))"
              >
                <span class="truncate">{{ subCategory }}</span>
              </button>

              <ul
                v-if="activeSubCategory === subCategory && getSmallCategories(group, subCategory).length"
                :class="[
                  'absolute top-0 w-44 rounded-xl border border-border bg-surface py-1 shadow-xl max-h-60 overflow-y-auto',
                  effectiveNestedSubmenuDirection === 'left' ? 'right-full mr-1' : 'left-full ml-1'
                ]"
              >
                <li
                  v-for="smallCategory in getSmallCategories(group, subCategory)"
                  :key="smallCategory"
                  :class="[
                    'px-4 py-2 text-sm hover:bg-surface-secondary cursor-pointer truncate',
                    String(modelValue) === smallCategory || String(modelValue) === group.childCategoryIds?.[smallCategory] ? 'text-primary font-semibold' : 'text-text-main'
                  ]"
                  @click="selectOption(getSmallCategoryValue(group, smallCategory))"
                >
                  {{ smallCategory }}
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

import type { DropdownOption } from '@/types'

interface CategoryGroup {
  categoryId?: string
  mainCategory: string
  subCategories: string[]
  childCategories?: Record<string, string[]>
  subCategoryIds?: Record<string, string>
  childCategoryIds?: Record<string, string>
}

type DropdownOptionSource = string | DropdownOption | CategoryGroup

interface Props {
  id?: string
  modelValue: string | number
  options: DropdownOptionSource[]
  rootOption?: string
  menuAlign?: 'left' | 'right'
  menuDirection?: 'up' | 'down'
  menuStrategy?: 'absolute' | 'fixed'
  submenuDirection?: 'left' | 'right'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  rootOption: '',
  menuAlign: 'left',
  menuDirection: 'down',
  menuStrategy: 'absolute',
  submenuDirection: 'right',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()
const rootRef = ref<HTMLElement | null>(null)
const dropdownId = crypto.randomUUID()
const isOpen = ref(false)
const activeGroup = ref<string | null>(null)
const activeSubCategory = ref<string | null>(null)
const effectiveSubmenuDirection = ref<'left' | 'right'>('right')
const effectiveNestedSubmenuDirection = ref<'left' | 'right'>('right')
const isPanelDropdown = ref(false)

const menuAlign = computed(() => props.menuAlign ?? 'left')
const menuDirection = computed(() => props.menuDirection ?? 'down')
const menuStrategy = computed(() => props.menuStrategy ?? 'absolute')
const submenuDirection = computed(() => props.submenuDirection ?? 'right')
const submenuWidth = 176
const viewportPadding = 12
const fixedMenuGap = 4
const minFixedMenuHeight = 120
const maxFixedMenuHeight = 240
const menuStyle = ref<Record<string, string>>({})
const effectiveMenuDirection = ref<'up' | 'down'>(menuDirection.value)

// 기존 문자열/카테고리 옵션과 label-value 옵션을 함께 지원해 공통 사용처의 호환성을 유지한다.
const isCategoryGroup = (option: DropdownOptionSource): option is CategoryGroup => (
  typeof option === 'object'
  && option !== null
  && 'mainCategory' in option
  && Array.isArray(option.subCategories)
)

const isDropdownOption = (option: DropdownOptionSource): option is DropdownOption => (
  typeof option === 'object'
  && option !== null
  && 'label' in option
  && 'value' in option
)

const categoryOptions = computed<CategoryGroup[]>(() => (
  props.options.filter(isCategoryGroup)
))

const isSimpleOptions = computed(() => {
  return categoryOptions.value.length === 0
})

const simpleOptions = computed<DropdownOption[]>(() => {
  if (!isSimpleOptions.value) return []

  return props.options.flatMap((option) => {
    if (typeof option === 'string') return [{ label: option, value: option }]
    if (isDropdownOption(option)) return [option]
    return []
  })
})

const selectedLabel = computed(() => {
  const selectedOption = simpleOptions.value.find((option) => option.value === props.modelValue)
  if (selectedOption) return selectedOption.label
  const selectedGroupLabel = getSelectedCategoryLabel()
  if (selectedGroupLabel) return selectedGroupLabel
  if (props.modelValue === '' || props.modelValue === undefined || props.modelValue === null) {
    return simpleOptions.value.find((option) => option.value === '')?.label
      ?? props.rootOption
      ?? ''
  }
  return String(props.modelValue)
})

const groupedOptions = computed<CategoryGroup[]>(() => {
  return isSimpleOptions.value || isPanelDropdown.value ? [] : categoryOptions.value
})

const panelGroupedOptions = computed<CategoryGroup[]>(() => {
  return !isSimpleOptions.value && isPanelDropdown.value ? categoryOptions.value : []
})

const selectedTextClass = computed(() => {
  return (props.rootOption && props.modelValue === props.rootOption)
    || props.modelValue === ''
    ? 'text-text-muted'
    : 'text-text-main'
})

const isPlaceholderRootOption = computed(() => {
  const rootOption = props.rootOption.trim()
  if (!rootOption) return false
  if (rootOption.startsWith('전체')) return false
  return rootOption.includes('선택')
})

const isGroupSelected = (group: CategoryGroup) => {
  const selectedValue = String(props.modelValue)
  return selectedValue === group.mainCategory
    || selectedValue === group.categoryId
    || group.subCategories.includes(selectedValue)
    || Object.values(group.subCategoryIds ?? {}).includes(selectedValue)
    || Object.values(group.childCategoryIds ?? {}).includes(selectedValue)
}

const getSmallCategorySet = (group: CategoryGroup) => (
  new Set(Object.values(group.childCategories ?? {}).flat())
)

const getMiddleCategories = (group: CategoryGroup) => {
  const smallCategorySet = getSmallCategorySet(group)
  return group.subCategories.filter((subCategory) => !smallCategorySet.has(subCategory))
}

const getSmallCategories = (group: CategoryGroup, subCategory: string) => (
  group.childCategories?.[subCategory] ?? []
)

const hasSmallCategories = (group: CategoryGroup) => (
  Object.values(group.childCategories ?? {}).some((categories) => categories.length > 0)
)

const isSubCategorySelected = (group: CategoryGroup, subCategory: string) => {
  const selectedValue = String(props.modelValue)
  return selectedValue === subCategory
    || selectedValue === group.subCategoryIds?.[subCategory]
    || getSmallCategories(group, subCategory).includes(selectedValue)
    || getSmallCategories(group, subCategory).some((smallCategory) => (
      selectedValue === group.childCategoryIds?.[smallCategory]
    ))
}

const getCategoryValue = (group: CategoryGroup) => (
  group.categoryId ?? group.mainCategory
)

const getSubCategoryValue = (group: CategoryGroup, subCategory: string) => (
  group.subCategoryIds?.[subCategory] ?? subCategory
)

const getSmallCategoryValue = (group: CategoryGroup, smallCategory: string) => (
  group.childCategoryIds?.[smallCategory] ?? smallCategory
)

const getSelectedCategoryLabel = () => {
  const selectedValue = String(props.modelValue)
  if (isSimpleOptions.value) return ''

  for (const group of categoryOptions.value) {
    if (selectedValue === group.mainCategory || selectedValue === group.categoryId) {
      return group.mainCategory
    }

    for (const subCategory of getMiddleCategories(group)) {
      if (selectedValue === subCategory || selectedValue === group.subCategoryIds?.[subCategory]) {
        return `${group.mainCategory} > ${subCategory}`
      }

      for (const smallCategory of getSmallCategories(group, subCategory)) {
        if (selectedValue === smallCategory || selectedValue === group.childCategoryIds?.[smallCategory]) {
          return `${group.mainCategory} > ${subCategory} > ${smallCategory}`
        }
      }
    }
  }

  return ''
}

const updatePanelContext = () => {
  isPanelDropdown.value = Boolean(rootRef.value?.closest('[data-dropdown-panel]'))
}

const clipsOverflow = (element: HTMLElement) => {
  const style = window.getComputedStyle(element)
  return [style.overflow, style.overflowX, style.overflowY].some((value) => (
    value === 'hidden' || value === 'auto' || value === 'scroll' || value === 'clip'
  ))
}

const getVisibleBounds = (anchor: HTMLElement) => {
  const bounds = {
    left: viewportPadding,
    right: window.innerWidth - viewportPadding,
  }

  let parent = anchor.parentElement
  while (parent) {
    if (clipsOverflow(parent)) {
      const rect = parent.getBoundingClientRect()
      bounds.left = Math.max(bounds.left, rect.left + viewportPadding)
      bounds.right = Math.min(bounds.right, rect.right - viewportPadding)
    }

    parent = parent.parentElement
  }

  return bounds
}

const getAdaptiveDirection = (anchor: HTMLElement, preferredDirection: 'left' | 'right') => {
  const rect = anchor.getBoundingClientRect()
  const bounds = getVisibleBounds(anchor)
  const leftSpace = rect.left - bounds.left
  const rightSpace = bounds.right - rect.right

  if (preferredDirection === 'left') {
    if (leftSpace >= submenuWidth) return 'left'
    if (rightSpace >= submenuWidth) return 'right'
    return leftSpace >= rightSpace ? 'left' : 'right'
  }

  if (rightSpace >= submenuWidth) return 'right'
  if (leftSpace >= submenuWidth) return 'left'
  return rightSpace >= leftSpace ? 'right' : 'left'
}

const activateGroup = (groupName: string, event: MouseEvent) => {
  activeGroup.value = groupName
  activeSubCategory.value = null
  effectiveSubmenuDirection.value = getAdaptiveDirection(event.currentTarget as HTMLElement, submenuDirection.value)
  effectiveNestedSubmenuDirection.value = effectiveSubmenuDirection.value
}

const activateSubCategory = (subCategory: string, event: MouseEvent) => {
  activeSubCategory.value = subCategory
  effectiveNestedSubmenuDirection.value = getAdaptiveDirection(
    event.currentTarget as HTMLElement,
    effectiveSubmenuDirection.value,
  )
}

const togglePanelGroup = (groupName: string) => {
  activeGroup.value = activeGroup.value === groupName ? null : groupName
  activeSubCategory.value = null
}

const togglePanelSubCategory = (subCategory: string) => {
  activeSubCategory.value = activeSubCategory.value === subCategory ? null : subCategory
}

const closeDropdown = () => {
  isOpen.value = false
  activeGroup.value = null
  activeSubCategory.value = null
  menuStyle.value = {}
  effectiveMenuDirection.value = menuDirection.value
  effectiveSubmenuDirection.value = submenuDirection.value
  effectiveNestedSubmenuDirection.value = submenuDirection.value
}

const updateFixedMenuStyle = () => {
  if (menuStrategy.value !== 'fixed' || !rootRef.value) {
    menuStyle.value = {}
    effectiveMenuDirection.value = menuDirection.value
    return
  }

  const rect = rootRef.value.getBoundingClientRect()
  const belowSpace = window.innerHeight - rect.bottom - viewportPadding
  const aboveSpace = rect.top - viewportPadding
  const shouldOpenUp = menuDirection.value === 'up'
    || (belowSpace < minFixedMenuHeight && aboveSpace > belowSpace)
  const availableHeight = Math.max(
    minFixedMenuHeight,
    Math.min(maxFixedMenuHeight, shouldOpenUp ? aboveSpace - fixedMenuGap : belowSpace - fixedMenuGap),
  )

  effectiveMenuDirection.value = shouldOpenUp ? 'up' : 'down'
  menuStyle.value = {
    width: `${rect.width}px`,
    maxHeight: `${availableHeight}px`,
    left: menuAlign.value === 'right'
      ? `${rect.right - rect.width}px`
      : `${rect.left}px`,
    top: shouldOpenUp ? 'auto' : `${rect.bottom + fixedMenuGap}px`,
    bottom: shouldOpenUp ? `${window.innerHeight - rect.top + fixedMenuGap}px` : 'auto',
  }
}

const toggleOpen = () => {
  if (props.disabled) return
  const willOpen = !isOpen.value

  if (willOpen) {
    window.dispatchEvent(new CustomEvent('asset-ieum-dropdown-open', { detail: dropdownId }))
  }

  isOpen.value = willOpen
  activeSubCategory.value = null
  effectiveSubmenuDirection.value = submenuDirection.value
  effectiveNestedSubmenuDirection.value = submenuDirection.value
  nextTick(() => {
    updatePanelContext()
    updateFixedMenuStyle()
  })
}

const selectOption = (option: string | number) => {
  if (props.disabled) return
  emit('update:modelValue', option)
  closeDropdown()
}

watch(() => props.disabled, (disabled) => {
  if (!disabled) return
  closeDropdown()
})

watch(isOpen, (open) => {
  if (!open || menuStrategy.value !== 'fixed') {
    window.removeEventListener('resize', updateFixedMenuStyle)
    window.removeEventListener('scroll', updateFixedMenuStyle, true)
    return
  }

  window.addEventListener('resize', updateFixedMenuStyle)
  window.addEventListener('scroll', updateFixedMenuStyle, true)
}, { flush: 'post' })

const handlePointerDown = (event: PointerEvent) => {
  if (!isOpen.value) return
  const target = event.target

  if (target instanceof Node && rootRef.value?.contains(target)) return
  closeDropdown()
}

const handleDropdownOpen = (event: Event) => {
  const detail = (event as CustomEvent<string>).detail
  if (detail === dropdownId) return
  closeDropdown()
}

onMounted(() => {
  updatePanelContext()
  document.addEventListener('pointerdown', handlePointerDown, true)
  window.addEventListener('asset-ieum-dropdown-open', handleDropdownOpen)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDown, true)
  window.removeEventListener('asset-ieum-dropdown-open', handleDropdownOpen)
  window.removeEventListener('resize', updateFixedMenuStyle)
  window.removeEventListener('scroll', updateFixedMenuStyle, true)
})
</script>
