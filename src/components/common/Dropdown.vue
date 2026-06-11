<template>
  <div class="relative w-full text-left" :class="$attrs.class">
    <button
      :id="props.id"
      type="button"
      :disabled="props.disabled"
      :aria-label="props.ariaLabel"
      :class="[
        'inline-flex h-9 w-full items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-text-main transition-all hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted disabled:opacity-60',
        props.triggerClass,
      ]"
      @click="isOpen = !isOpen"
    >
      <div class="flex items-center gap-2 overflow-hidden">
        <slot name="icon" />
        <span :class="['truncate', selectedTextClass]">{{ selectedLabel }}</span>
      </div>

      <ChevronDown :size="16" class="text-text-muted shrink-0 ml-2" />
    </button>

    <div
      v-if="isOpen"
      :class="[
        'absolute mt-1 w-full z-50 rounded-xl border border-border bg-surface shadow-xl',
        menuAlign === 'right' ? 'right-0' : 'left-0'
      ]"
    >
      <ul class="py-1" :class="{ 'max-h-60 overflow-y-auto': isSimpleOptions }">
        <li
          v-if="rootOption"
          :class="[
            'px-4 py-2 text-sm hover:bg-surface-secondary cursor-pointer',
            modelValue === rootOption ? 'text-primary font-semibold' : 'text-text-main'
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
          v-for="group in groupedOptions"
          :key="group.mainCategory"
          class="relative"
          @mouseenter="activeGroup = group.mainCategory"
        >
          <button
            type="button"
            :class="[
              'w-full flex items-center justify-start gap-2 px-4 py-2 text-sm hover:bg-surface-secondary transition-colors',
              isGroupSelected(group) ? 'text-primary font-semibold' : 'text-text-main'
            ]"
            @click.stop="toggleGroup(group.mainCategory)"
          >
            <ChevronLeft :size="14" class="text-text-muted shrink-0" />
            <span class="truncate">{{ group.mainCategory }}</span>
          </button>

          <ul
            v-if="activeGroup === group.mainCategory"
            :class="[
              'absolute top-0 min-w-40 rounded-xl border border-border bg-surface py-1 shadow-xl max-h-60 overflow-y-auto',
              submenuDirection === 'left' ? 'right-full mr-1' : 'left-full ml-1'
            ]"
          >
            <li
              v-for="subCategory in group.subCategories"
              :key="subCategory"
              :class="[
                'px-4 py-2 text-sm hover:bg-surface-secondary cursor-pointer whitespace-nowrap',
                modelValue === subCategory ? 'text-primary font-semibold' : 'text-text-main'
              ]"
              @click="selectOption(subCategory)"
            >
              {{ subCategory }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, ChevronLeft } from 'lucide-vue-next'

interface CategoryGroup {
  mainCategory: string
  subCategories: string[]
}

export interface DropdownOption {
  label: string
  value: string | number
}

const props = defineProps<{
  modelValue: string | number
  options: string[] | DropdownOption[] | CategoryGroup[]
  rootOption?: string
  menuAlign?: 'left' | 'right'
  submenuDirection?: 'left' | 'right'
  id?: string
  ariaLabel?: string
  disabled?: boolean
  triggerClass?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()
const isOpen = ref(false)
const activeGroup = ref<string | null>(null)

const menuAlign = computed(() => props.menuAlign ?? 'left')
const submenuDirection = computed(() => props.submenuDirection ?? 'right')

const isSimpleOptions = computed(() => {
  return props.options.length === 0
    || typeof props.options[0] === 'string'
    || 'value' in props.options[0]
})

const simpleOptions = computed(() => {
  if (!isSimpleOptions.value) return []

  return props.options.map((option) =>
    typeof option === 'string'
      ? { label: option, value: option }
      : option as DropdownOption
  )
})

const groupedOptions = computed(() => {
  return isSimpleOptions.value ? [] : props.options as CategoryGroup[]
})

const selectedTextClass = computed(() => {
  return (props.rootOption && props.modelValue === props.rootOption)
    || props.modelValue === ''
    ? 'text-text-muted'
    : 'text-text-main'
})

const selectedLabel = computed(() => {
  const selected = simpleOptions.value.find(
    (option) => option.value === props.modelValue,
  )
  return selected?.label ?? String(props.modelValue)
})

const isGroupSelected = (group: CategoryGroup) => {
  return typeof props.modelValue === 'string'
    && group.subCategories.includes(props.modelValue)
}

const toggleGroup = (mainCategory: string) => {
  activeGroup.value = activeGroup.value === mainCategory ? null : mainCategory
}

const selectOption = (option: string | number) => {
  emit('update:modelValue', option)
  isOpen.value = false
  activeGroup.value = null
}
</script>
