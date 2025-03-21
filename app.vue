<template>
  <div :class="{ 'dark': isDarkMode }">
    <NuxtPage />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const isDarkMode = ref(false);

// Check color theme
onMounted(() => {
  if (typeof window !== 'undefined') {
    const savedMode = localStorage.getItem('colorMode');
    if (savedMode) {
      isDarkMode.value = savedMode === 'dark';
    } else {
      isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }
});
</script>

<style>
@import './assets/css/tailwind.css';

html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
</style> 