<template>
  <button
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :class="[
      'inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900',
      variantClasses[props.variant],
      sizeClasses[props.size],
      (props.disabled || props.loading) && 'cursor-not-allowed opacity-50',
    ]"
  >
    <svg
      v-if="props.loading"
      class="h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>

    <slot />
  </button>
</template>

<script setup lang="ts">
// 버튼 컴포넌트 - 유형자산 품목 관리 피그마 시안 기준 variant 확장
type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
// primary: 메인 컬러(주황색) 배경 + 흰 글씨
// secondary: 연한 주황색 배경 + 주황색 글씨
// outline: 흰색 배경 + 검은색 글씨
// danger: 빨간색 배경 + 흰색 글씨
// ghost: 회색 배경 + 더 진한 회색 글씨
type Size = 'sm' | 'md' | 'm' | 'lg'

interface Props {
  variant?: Variant
  size?: Size
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button',
})

// 피그마 시안 기준 변수 매핑
const variantClasses: Record<Variant, string> = {
  // 1. [+ 자산 품목 등록] 스타일 - 쨍한 주황색 채우기
  primary:
    'bg-primary text-white hover:bg-primary-hover focus:ring-primary/50 disabled:bg-primary/40',
  
  // 2. [자산 카테고리 수정] 스타일 - 사이드바 활성화와 유사한 연한 주황 배경 + 주황 글씨
  secondary:
    'bg-primary/10 text-primary! font-semibold hover:bg-primary/20 focus:ring-primary/30 disabled:bg-primary/5 disabled:text-text-muted',
  
  // 3. [CSV 파일 등록] 및 [테이블 일반 삭제] 스타일 - 테두리 + surface 배경
  outline:
    'border border-border bg-surface text-text-main hover:bg-surface-secondary focus:ring-border disabled:bg-surface-secondary disabled:text-text-muted',
  
  // 4. [테이블 호버/경고 삭제] 스타일 - 쨍한 빨간색 채우기
  danger:
    'bg-danger text-white hover:bg-danger/90 focus:ring-danger/50 disabled:bg-danger/40',
    
  // 5. 투명 버튼
  ghost:
'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 focus:ring-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 disabled:bg-neutral-50 disabled:text-neutral-300',}

const sizeClasses: Record<Size, string> = {
  // 테이블 내 '삭제' 버튼처럼 아담한 사이즈
  sm: 'px-2 py-1 text-xs rounded-lg h-6', 
  // 상단 필터 및 일반적인 버튼 규격
  md: 'px-3 py-1.5 text-xs rounded-lg h-9',    
  
  m: 'px-3 py-1.5 text-xs rounded-lg h-11',    

  // 큰 액션 버튼용
  lg: 'px-5 py-2.5 text-base rounded-xl h-15', 
}
</script>
