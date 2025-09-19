<script lang="ts" setup>
import type { LiveStream } from "~/types";

const { getLiveStreams } = useServices();
const { getStreamDuration } = useDate();
const { formatViewerCount, getInitials, getAvatarColor, truncateText } = useUtils();
const { t } = useI18n();

const state = reactive({
  streams: [] as LiveStream[],
  loading: true,
});

const hasLiveStreams = computed(() =>
  state.streams.some(stream => stream.isLive)
);

const displayedStreams = computed(() => {
  const live = state.streams.filter(s => s.isLive);
  if (live.length > 0) {
    return live.slice(0, 5);
  }
  const featured = state.streams.filter(s => !s.isLive);
  return featured.slice(0, 5);
});

const fetchStreams = async () => {
  try {
    state.streams = await getLiveStreams() || [];
  } catch (error) {
    console.error('Failed to fetch live streams:', error);
    state.streams = [];
  } finally {
    state.loading = false;
  }
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
};

// Fetch immediately when component is created
fetchStreams();

// Set up refresh interval
const refreshInterval = setInterval(fetchStreams, 120000);

onUnmounted(() => {
  clearInterval(refreshInterval);
});
</script>

<template>
  <div class="live-streams-sidebar">
    <div class="sidebar-header">
      <h3 class="sidebar-title">
        <span v-if="hasLiveStreams" class="live-indicator">
          <span class="pulse-dot"></span>
          {{ t('liveNow') }}
        </span>
        <span v-else>
          {{ t('featuredCreators') }}
        </span>
      </h3>
      <NuxtLink
        v-if="state.streams.length > 5"
        to="/creator"
        class="show-more-btn"
      >
        {{ t('viewAll') }}
        <Icon name="heroicons:arrow-right" />
      </NuxtLink>
    </div>

    <div v-if="state.loading" class="loading-container">
      <template v-for="n in 4" :key="n">
        <div class="skeleton-card">
          <USkeleton
            class="skeleton-avatar"
            :ui="{ rounded: 'rounded-full' }"
          />
          <div class="skeleton-content">
            <USkeleton class="skeleton-name" />
            <USkeleton class="skeleton-status" />
          </div>
        </div>
      </template>
    </div>

    <div v-else-if="state.streams.length === 0" class="empty-state">
      <Icon name="heroicons:video-camera-slash" />
      <p>{{ t('noCreatorsAvailable') }}</p>
      <NuxtLink to="/creator" class="browse-link">
        {{ t('browseCreators') }}
      </NuxtLink>
    </div>

    <div v-else class="streams-list">
      <NuxtLink
        v-for="stream in displayedStreams"
        :key="stream.id"
        :to="`/${stream.path}`"
        class="stream-card"
        :class="{ 'is-live': stream.isLive }"
      >
        <div class="stream-avatar">
          <img
            v-if="stream.logo"
            :src="stream.logo"
            :alt="stream.name"
            class="avatar-img"
            @error="handleImageError"
          />
          <div v-else class="avatar-fallback" :style="getAvatarColor(stream.name)">
            <span class="avatar-initials">{{ getInitials(stream.name) }}</span>
          </div>
        </div>

        <div class="stream-info">
          <div class="stream-header">
            <h4 class="stream-name">{{ truncateText(stream.name, 20) }}</h4>
            <span v-if="stream.isLive" class="live-badge">
              <span class="live-dot"></span>
              LIVE
            </span>
            <div class="platform-badge" v-if="stream.platform">
              <Icon
                v-if="stream.platform === 'twitch'"
                name="simple-icons:twitch"
                class="platform-icon twitch"
              />
              <Icon
                v-else-if="stream.platform === 'x'"
                name="simple-icons:x"
                class="platform-icon x"
              />
              <Icon
                v-else-if="stream.platform === 'youtube'"
                name="simple-icons:youtube"
                class="platform-icon youtube"
              />
            </div>
          </div>

          <div v-if="stream.isLive" class="stream-status">
            <div class="stream-metrics">
              <div v-if="stream.viewerCount" class="stream-viewers">
                <Icon name="heroicons:users-solid" />
                <span>{{ formatViewerCount(stream.viewerCount) }}</span>
              </div>
              <div v-if="stream.startedAt" class="stream-duration">
                <Icon name="heroicons:clock" />
                <span>{{ getStreamDuration(stream.startedAt) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="stream-offline">
            <span>{{ t('offline') }}</span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped lang="scss">
.live-streams-sidebar {
  @apply rounded-2xl p-5 h-fit w-full;

  .sidebar-header {
    @apply flex justify-between items-center mb-5;

    .sidebar-title {
      @apply text-base font-semibold text-gray-900 dark:text-gray-100;

      .live-indicator {
        @apply flex items-center gap-2;

        .pulse-dot {
          @apply w-2 h-2 bg-orange-500 rounded-full;
          animation: pulse 2s infinite;
        }
      }
    }

    .show-more-btn {
      @apply text-xs font-medium text-orange-500 no-underline flex items-center;
      @apply transition-all hover:text-orange-600;

      &:hover {
        transform: translateX(2px);
      }
    }
  }

  .loading-container {
    .skeleton-card {
      @apply flex gap-3 mb-4;

      .skeleton-avatar {
        @apply h-12 w-12;
      }

      .skeleton-content {
        @apply flex-1;

        .skeleton-name {
          @apply h-5 w-full mb-1;
        }

        .skeleton-status {
          @apply h-4 w-16;
        }
      }
    }
  }

  .empty-state {
    @apply text-center py-8 px-4;

    svg {
      @apply text-2xl text-gray-400 mb-2;
    }

    p {
      @apply text-xs text-gray-500;
    }

    .browse-link {
      @apply inline-block mt-3 text-sm font-medium text-orange-500;
      @apply no-underline transition-all hover:text-orange-600 hover:underline;
    }
  }

  .streams-list {
    @apply flex flex-col gap-4;
  }

  .stream-card {
    @apply flex gap-3 p-2 rounded-xl transition-all cursor-pointer no-underline;

    &:hover {
      @apply bg-gray-100 dark:bg-gray-700;
      transform: translateX(2px);

      .stream-avatar {
        transform: scale(1.05);
      }
    }

    &.is-live {
      @apply bg-gradient-to-r from-orange-500/5 to-transparent;
      @apply dark:from-orange-500/10;
    }

    .stream-avatar {
      @apply relative w-9 h-9 flex-shrink-0 transition-transform;

      .avatar-img,
      .avatar-fallback {
        @apply w-full h-full rounded-full object-cover;
      }

      .avatar-img {
        @apply border-2 border-gray-200 dark:border-gray-600;
      }

      .avatar-fallback {
        @apply flex items-center justify-center text-white font-semibold text-sm;
        @apply uppercase tracking-wider;
      }
    }

    .stream-info {
      @apply flex-1 min-w-0;

      .stream-header {
        @apply flex items-center gap-1 mb-1;

        .stream-name {
          @apply text-sm font-medium text-gray-900 dark:text-gray-100;
          @apply truncate flex-1;
        }

        .live-badge {
          @apply flex items-center gap-1 px-1 py-0.5;
          @apply bg-orange-500/10 border border-orange-500/30 rounded;
          @apply text-orange-500 font-bold text-[9px] tracking-wider;

          .live-dot {
            @apply w-1 h-1 bg-orange-500 rounded-full;
            animation: livePulse 1.5s ease-in-out infinite;
          }
        }

        .platform-badge {
          @apply flex items-center p-0.5 bg-gray-100 dark:bg-gray-700 rounded;

          .platform-icon {
            @apply w-3 h-3 flex-shrink-0;

            &.twitch {
              @apply text-purple-600;
            }

            &.x {
              @apply text-gray-700 dark:text-gray-300;
            }

            &.youtube {
              @apply text-red-500;
            }
          }
        }
      }

      .stream-status {
        .stream-metrics {
          @apply flex items-center gap-2;
        }

        .stream-viewers {
          @apply flex items-center gap-1 text-orange-500 font-medium text-[10px];

          svg {
            @apply w-2 h-2;
          }
        }

        .stream-duration {
          @apply flex items-center gap-1 text-gray-600 dark:text-gray-400;
          @apply font-medium text-[10px];

          svg {
            @apply w-2 h-2;
          }
        }
      }

      .stream-offline {
        @apply text-xs text-gray-500;
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.9);
  }
}

@keyframes livePulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.8);
  }
}

@media (max-width: 1024px) {
  .live-streams-sidebar {
    @apply hidden;
  }
}
</style>