<template>
  <div class="app-shell">
    <RouterView />
    <ToastStack />
  </div>
</template>

<script setup lang="ts">
import ToastStack from '@/components/common/ToastStack.vue'
</script>

<style scoped lang="scss">
.app-shell {
  min-height: 100vh;
}
</style>
