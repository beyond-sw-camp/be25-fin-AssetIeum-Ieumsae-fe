<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string | number
  type?: 'text' | 'password' | 'number' | 'tel'
  label?: string         // 인풋창 위에 들어갈 항목 이름 (예: "모델명")
  required?: boolean     // 필수 입력 여부 (* 마크 표시용)
  placeholder?: string
  disabled?: boolean
  error?: boolean        // 유효성 검사 실패 시 빨간 테두리 토글
  errorMessage?: string  // 에러 발생 시 하단에 띄울 안내 문구
  maxlength?: number     // 최대 글자수 제한
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  label: '',
  required: false,
  placeholder: '',
  disabled: false,
  error: false,
  errorMessage: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 다크모드 대응 및 상태별 스타일 클래스 맵업
const inputClasses = computed(() => {
  return [
    'w-full rounded-xl border px-4 py-2.5 text-sm bg-surface text-text-main placeholder-text-muted transition-all duration-200 outline-none h-11',
    props.error
      ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
      : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20',
    props.disabled && 'cursor-not-allowed bg-surface-secondary text-text-muted border-border opacity-60',
  ]
})

// 입력값 계산 및 글자수 카운트용
const currentLength = computed(() => String(props.modelValue ?? '').length)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="w-full flex flex-col gap-1.5 text-left">
    <div v-if="props.label || props.maxlength" class="flex items-center justify-between px-0.5">
      <label class="text-sm font-semibold text-text-main flex items-center gap-0.5">
        {{ props.label }}
        <span v-if="props.required" class="text-primary font-bold">*</span>
      </label>
      
      <span v-if="props.maxlength" class="text-xs text-text-muted">
        {{ currentLength }}/{{ props.maxlength }}
      </span>
    </div>

    <input
      :type="props.type"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :maxlength="props.maxlength"
      :class="inputClasses"
      @input="handleInput"
    />

    <p v-if="props.error && props.errorMessage" class="text-xs text-danger font-medium px-0.5 mt-0.5 animate-fadeIn">
      {{ props.errorMessage }}
    </p>
  </div>
</template>