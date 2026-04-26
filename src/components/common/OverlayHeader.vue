<template>
  <header class="overlay-header">
    <button
      v-if="props.showBack"
      class="overlay-header__back-button"
      type="button"
      :aria-label="props.backAriaLabel"
      @click="emit('back')"
    >
      <img :src="backIcon" alt="" />
    </button>
    <div v-else class="overlay-header__spacer" aria-hidden="true" />

    <div class="overlay-header__summary">
      <h1 class="overlay-header__title">{{ title }}</h1>
    </div>

    <div class="overlay-header__right">
      <slot name="right">
        <div class="overlay-header__spacer" aria-hidden="true" />
      </slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import backIcon from '@/assets/chat/back.png'

const props = withDefaults(
  defineProps<{
    title: string
    backAriaLabel?: string
    showBack?: boolean
  }>(),
  {
    backAriaLabel: '返回',
    showBack: true
  }
)

const emit = defineEmits<{
  back: []
}>()
</script>

<style scoped lang="scss">
.overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 64px;
  padding: calc(env(safe-area-inset-top) + 10px) 0 10px;
  border-radius: 0;
  background: linear-gradient(180deg, rgba(26, 18, 26, 0.78), rgba(26, 18, 26, 0.46));
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(24px) saturate(130%);
  flex-shrink: 0;
}

.overlay-header__back-button,
.overlay-header__right,
.overlay-header__spacer {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
}

.overlay-header__back-button,
.overlay-header__right {
  padding: 0;
  display: grid;
  place-items: center;
  background: transparent;
  box-shadow: none;
}

.overlay-header__back-button img {
  width: 26px;
  height: 26px;
  object-fit: contain;
  opacity: 0.92;
  filter: brightness(0) invert(1);
}

.overlay-header__summary {
  flex: 1;
  min-width: 0;
}

.overlay-header__title {
  margin: 0;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.96);
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.24);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 720px) {
  .overlay-header {
    min-height: 60px;
    padding: calc(env(safe-area-inset-top) + 8px) 0 8px;
  }

  .overlay-header__title {
    font-size: 16px;
  }
}
</style>
