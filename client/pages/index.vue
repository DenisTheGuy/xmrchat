<script lang="ts" setup>
useHead({});
</script>

<template>
  <div>
    <div class="inner">
      <HomeHero />
      <HomeLiveStreams class="mobile-only" />
      <HomeFAQ />
    </div>
    <LiveStreamsSidebar class="desktop-sidebar" />
  </div>
</template>

<style scoped>
.inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.desktop-sidebar {
  display: none;
}

@media (min-width: 1025px) {
  .mobile-only {
    display: none;
  }

  .desktop-sidebar {
    display: block;
    position: absolute;
    right: 20px;
    top: 80px;
    width: 280px;
  }

  .inner {
    margin-right: 320px;
    position: relative;
  }
}
</style>