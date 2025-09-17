<script lang="ts" setup>
useHead({});
</script>

<template>
  <div class="homepage-container">
    <div class="content-with-sidebar">
      <div class="main-content">
        <div class="inner">
          <HomeHero />
          <!-- Mobile/Tablet Live Streams Section -->
          <HomeLiveStreams />
        </div>
      </div>
      <!-- Desktop Sidebar -->
      <aside class="sidebar-container">
        <LiveStreamsSidebar />
      </aside>
    </div>
    <!-- FAQ Section - Full Width Centered -->
    <div class="faq-section">
      <HomeFAQ />
    </div>
  </div>
</template>

<style scoped lang="scss">
.homepage-container {
  width: 100%;

  .content-with-sidebar {
    display: flex;
    gap: 30px;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px;

    @media (max-width: 1024px) {
      flex-direction: column;
      gap: 0;
      padding: 0;
    }

    .main-content {
      flex: 1;
      min-width: 0;

      @media (max-width: 1024px) {
        width: 100%;
      }
    }

    .sidebar-container {
      width: 280px;
      flex-shrink: 0;
      position: sticky;
      top: 100px;
      height: fit-content;

      @media (max-width: 1024px) {
        display: none;
      }
    }
  }

  .faq-section {
    width: 100%;
    max-width: 900px;
    margin: 60px auto 0;
    padding: 0 20px;

    @media (max-width: 768px) {
      margin-top: 40px;
      padding: 0;
    }
  }
}
</style>
