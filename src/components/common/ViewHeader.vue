<template>
  <header class="view-header">
    <div class="view-header__copy">
      <p v-if="eyebrow" class="view-header__eyebrow">{{ eyebrow }}</p>
      <h1 class="view-header__title">{{ title }}</h1>
      <p v-if="description" class="view-header__description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="view-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  eyebrow?: string
}>()
</script>

<style scoped lang="scss">
.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.view-header__copy {
  min-width: 0;
}

.view-header__eyebrow {
  margin: 0 0 10px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.view-header__title {
  margin: 0;
  font-size: clamp(28px, 5vw, 40px);
  line-height: 1.1;
}

.view-header__description {
  margin: 10px 0 0;
  max-width: 720px;
  color: var(--text-secondary);
  line-height: 1.7;
}

.view-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (max-width: 720px) {
  .view-header {
    flex-direction: column;
  }

  .view-header__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
