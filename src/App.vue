<template>
  <div class="app-shell">
    <RouterView />
    <ConfirmDialog />
    <ToastStack />
  </div>
</template>

<script setup lang="ts">
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ToastStack from '@/components/common/ToastStack.vue'
</script>

<style scoped lang="scss">
.app-shell {
  min-height: 100vh;
}
</style>
