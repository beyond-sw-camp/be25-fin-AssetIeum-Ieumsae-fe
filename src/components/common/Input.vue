<template>
  <div class="w-full flex flex-col gap-2 text-left">
    <div v-if="props.label || props.maxlength" class="flex items-center justify-between px-0.5">
      <label
        class="text-sm font-semibold text-text-main flex items-center gap-0.5"
        :for="props.id"
      >
        {{ props.label }}
        <span v-if="props.required" class="text-primary font-bold">*</span>
      </label>

      <span v-if="props.maxlength" class="text-xs text-text-muted">
        {{ currentLength }}/{{ props.maxlength }}
      </span>
    </div>

    <div v-if="props.type === 'date'" ref="datePickerRef" class="relative">
      <button
        :id="props.id"
        type="button"
        :disabled="props.disabled"
        :aria-invalid="props.error"
        :aria-describedby="props.error && props.errorMessage ? errorId : undefined"
        :class="inputClasses"
        @click="toggleCalendar"
      >
        <span :class="dateDisplayValue ? 'text-text-main' : 'text-text-muted'">
          {{ dateDisplayValue || props.placeholder || 'YYYY-MM-DD' }}
        </span>
        <CalendarDays :size="16" class="ml-auto shrink-0 text-text-muted" />
      </button>

      <div
        v-if="isCalendarOpen"
        class="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-surface p-3 shadow-xl"
      >
        <div class="mb-3 flex items-center justify-between">
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub hover:bg-surface-secondary"
            @click="moveMonth(-1)"
          >
            <ChevronLeft :size="16" />
          </button>
          
          <div class="flex justify-between items-center gap-3">
            <p class="text-sm font-semibold text-text-main">
              {{ calendarYear }}년 {{ calendarMonth + 1 }}월
            </p>
            
            <button
              type="button"
              class="w-hug rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-background transition-colors hover:text-primary"
              @click="selectToday"
            >
              오늘
            </button>
          </div>
          
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub hover:bg-surface-secondary"
            @click="moveMonth(1)"
          >
            <ChevronRight :size="16" />
          </button>
        </div>

        <div class="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-text-muted">
          <span v-for="day in weekDays" :key="day" class="py-1">{{ day }}</span>
        </div>

        <div class="mt-1 grid grid-cols-7 gap-1">
          <button
            v-for="day in calendarDays"
            :key="day.key"
            type="button"
            :class="[
              'h-8 rounded-2xl text-xs font-medium transition-colors',
              day.isCurrentMonth ? 'text-text-main hover:bg-surface-secondary' : 'text-text-muted/50',
              day.value === props.modelValue && 'bg-primary text-main hover:bg-primary!',
              day.isToday && day.value !== props.modelValue && 'text-primary'
            ]"
            @click="selectDate(day.value)"
          >
            {{ day.date }}
          </button>
        </div>
      </div>
    </div>

    <input
      v-else
      :id="props.id"
      :type="props.type"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :autocomplete="props.autocomplete"
      :disabled="props.disabled"
      :maxlength="props.maxlength"
      :aria-invalid="props.error"
      :aria-describedby="props.error && props.errorMessage ? errorId : undefined"
      :class="inputClasses"
      @input="handleInput"
    />

    <p
      v-if="props.error && props.errorMessage"
      :id="errorId"
      class="text-xs text-danger font-medium px-0.5 mt-0.5 animate-fadeIn"
      role="alert"
    >
      {{ props.errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  id?: string
  modelValue: string | number
  type?: 'text' | 'password' | 'number' | 'tel' | 'date'
  label?: string
  required?: boolean
  placeholder?: string
  autocomplete?: string
  disabled?: boolean
  error?: boolean
  errorMessage?: string
  maxlength?: number
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  type: 'text',
  label: '',
  required: false,
  placeholder: '',
  autocomplete: 'off',
  disabled: false,
  error: false,
  errorMessage: '',
  maxlength: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isCalendarOpen = ref(false)
const datePickerRef = ref<HTMLElement | null>(null)
const visibleDate = ref(resolveDate(String(props.modelValue || '')))
const weekDays = ['일', '월', '화', '수', '목', '금', '토']

const inputClasses = computed(() => {
  return [
    'w-full rounded-xl border px-4 py-2.5 text-sm bg-surface text-text-main placeholder-text-muted transition-all duration-200 outline-none h-9 flex items-center text-left',
    props.error
      ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
      : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20',
    props.disabled && 'cursor-not-allowed bg-surface-secondary text-text-muted border-border opacity-60',
  ]
})

const currentLength = computed(() => String(props.modelValue ?? '').length)
const errorId = computed(() => props.id ? `${props.id}-error` : undefined)
const dateDisplayValue = computed(() => String(props.modelValue || ''))
const calendarYear = computed(() => visibleDate.value.getFullYear())
const calendarMonth = computed(() => visibleDate.value.getMonth())

const calendarDays = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value
  const firstDay = new Date(year, month, 1)
  const startDate = new Date(year, month, 1 - firstDay.getDay())
  const todayValue = formatDateValue(new Date())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)
    const value = formatDateValue(date)

    return {
      key: `${value}-${index}`,
      date: date.getDate(),
      value,
      isCurrentMonth: date.getMonth() === month,
      isToday: value === todayValue,
    }
  })
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const toggleCalendar = () => {
  if (props.disabled) return
  visibleDate.value = resolveDate(String(props.modelValue || ''))
  isCalendarOpen.value = !isCalendarOpen.value
}

const moveMonth = (amount: number) => {
  visibleDate.value = new Date(calendarYear.value, calendarMonth.value + amount, 1)
}

const selectDate = (value: string) => {
  emit('update:modelValue', value)
}

const selectToday = () => {
  const today = new Date()
  visibleDate.value = today
  selectDate(formatDateValue(today))
}

const handleOutsidePointerDown = (event: PointerEvent) => {
  if (!isCalendarOpen.value) return
  const target = event.target
  if (!(target instanceof Node)) return
  if (datePickerRef.value?.contains(target)) return

  isCalendarOpen.value = false
}

function resolveDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, date] = value.split('-').map(Number)
    return new Date(year, month - 1, date)
  }

  return new Date()
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

watch(() => props.disabled, (disabled) => {
  if (disabled) isCalendarOpen.value = false
})

onMounted(() => {
  document.addEventListener('pointerdown', handleOutsidePointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleOutsidePointerDown)
})
</script>
