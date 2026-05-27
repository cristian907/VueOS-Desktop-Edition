<template>
  <div class="shell-container">
    <!-- Lanzador Kickoff de aplicaciones (popup estilo KDE Plasma) -->
    <AppLauncher />
  </div>
</template>

<script setup lang="ts">
import AppLauncher from '@/components/core/AppLauncher.vue';
</script>

<style scoped>
.shell-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Permite clicks a través de las regiones vacías del shell */
  z-index: 999980;
}
</style>
