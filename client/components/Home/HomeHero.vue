<script lang="ts" setup>
const { toStreamerDisplay, toCreators } = useRouteLocation();
const { t } = useI18n();
</script>

<template>
  <div class="home-hero">
    <div class="image-side">
      <img
        class="w-full rounded-md overflow-hidden border-border border-2"
        src="/images/home-hero-3.png"
        alt=""
      />
    </div>
    <div class="content-side">
      <h1 class="font-bold text-6xl">{{ t("xmrchat") }}</h1>
      <p class="description">{{ t("heroDescription") }}</p>
      <div class="flex gap-2 flex-wrap">
        <UButton size="xl" :to="toStreamerDisplay()">
          {{ t("creatorsStartHere") }}
        </UButton>
        <UButton size="xl" :to="toCreators()" variant="outline">
          {{ t("findCreators") }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.home-hero {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 2rem;

  .image-side {
    flex: 1.5;
    display: flex;
    justify-content: flex-end;
    padding-right: 2rem;

    img {
      max-width: 750px;
      width: 100%;
      height: auto;
      object-fit: contain;
    }
  }

  .content-side {
    flex: 0.8;
    display: flex;
    flex-direction: column;
    padding-left: 2rem;
    min-width: 380px;

    .description {
      font-size: 1.125rem;
      line-height: 1.75rem;
      padding-top: 1rem;
      padding-bottom: 1.5rem;
    }
  }

  @media only screen and (max-width: 840px) {
    flex-direction: column;
    align-items: stretch;
    margin: 1rem 0;
    padding: 0;

    .image-side {
      flex: 1;
      display: flex;
      padding: 0 10px;
      justify-content: center;

      img {
        max-width: 100%;
        width: 100%;
      }
    }

    .content-side {
      flex: 1;
      padding: 1rem 10px;
      min-width: unset;
      text-align: left;

      h1 {
        text-align: left;
        padding-left: 0;
        margin-left: 0;
      }

      .description {
        text-align: left;
        padding-left: 0;
      }

      .flex {
        display: flex !important;
        flex-direction: row !important;
        gap: 0.5rem;
        flex-wrap: nowrap;
        padding-left: 0;
        margin-left: 0;

        :deep(button) {
          flex: 1;
          min-width: 0;
          text-align: center !important;
          justify-content: center !important;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 0.75rem 0.5rem !important;
          font-size: 0.875rem !important;
        }
      }
    }
  }
}
</style>
