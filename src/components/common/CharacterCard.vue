<template>
  <article class="character-card glass-panel" @click="$emit('select', character)">
    <div class="character-card__avatar">
      <img v-if="character.avatarUrl" :src="character.avatarUrl" :alt="character.name" />
      <span v-else>{{ character.name.slice(0, 1) }}</span>
    </div>
    <div class="character-card__body">
      <div class="character-card__meta">
        <h3 class="character-card__title">{{ character.name }}</h3>
        <span v-if="badge" class="character-card__badge">{{ badge }}</span>
      </div>
      <p class="character-card__description">
        {{ character.description || character.greetingMessage || '点击进入聊天。' }}
      </p>
      <div v-if="$slots.actions" class="character-card__actions" @click.stop>
        <slot name="actions" />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Character } from '@/types'

defineProps<{
  character: Character
  badge?: string
}>()

defineEmits<{
  (event: 'select', character: Character): void
}>()
</script>

<style scoped lang="scss">
.character-card {
  display: flex;
  gap: 16px;
  padding: 18px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.character-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}

.character-card__avatar {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  overflow: hidden;
  background: linear-gradient(135deg, #efc8b6 0%, #d7e6fa 100%);
  flex-shrink: 0;
  display: grid;
  place-items: center;
  color: var(--brand-deep);
  font-size: 24px;
  font-weight: 700;
}

.character-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.character-card__body {
  min-width: 0;
  flex: 1;
}

.character-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.character-card__title {
  margin: 0;
  font-size: 18px;
}

.character-card__badge {
  border-radius: 999px;
  padding: 4px 10px;
  background: rgba(201, 109, 75, 0.12);
  color: var(--brand-deep);
  font-size: 12px;
}

.character-card__description {
  margin: 10px 0 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.character-card__actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
