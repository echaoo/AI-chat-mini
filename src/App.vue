<script setup lang="ts">
import AddToHomeScreen from './components/AddToHomeScreen.vue'
</script>

<template>
  <router-view />
  <AddToHomeScreen />
</template>

<style>
#app {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
}
</style>
