<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <main class="min-h-screen bg-background lg:grid lg:grid-cols-[1fr_minmax(480px,46%)]">
    <section
      class="hidden items-center justify-center px-12 lg:flex"
      aria-label="자산이음 브랜드"
    >
      <div class="flex flex-col items-center gap-3 text-primary">
        <div class="barcode-logo" aria-hidden="true"></div>
        <p class="text-xl font-light tracking-[0.72em]">ASSETIEUM</p>
      </div>
    </section>

    <section class="flex min-h-screen items-center justify-center p-5 sm:p-10 lg:p-14">
      <div
        class="w-full max-w-[560px] rounded-[2rem] bg-surface px-6 py-12 shadow-[0_24px_70px_rgba(15,23,42,0.13)] sm:px-14 sm:py-10"
      >
        <div class="mt-5 mb-10 text-center">
          <p class="mb-10 font-semibold tracking-[0.28em] text-primary lg:hidden">ASSETIEUM</p>
          <h1 class="text-3xl font-bold text-text-main">{{ title }}</h1>
        </div>

        <slot />
      </div>
    </section>
  </main>
</template>

<style scoped>
.barcode-logo {
  width: 420px;
  height: 72px;
  background:
    repeating-linear-gradient(
      90deg,
      currentColor 0 4px,
      transparent 4px 9px,
      currentColor 9px 12px,
      transparent 12px 19px,
      currentColor 19px 27px,
      transparent 27px 32px
    );
}
</style>
