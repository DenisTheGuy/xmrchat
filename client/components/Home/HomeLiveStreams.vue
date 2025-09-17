<template>
  <section class="home-live-streams">
    <div class="section-header">
      <h2 class="section-title">
        <span v-if="hasLiveStreams" class="live-indicator">
          <span class="pulse-dot"></span>
          {{ $t('creatorsLive') || 'Creators Live' }}
        </span>
        <span v-else>
          {{ $t('featuredCreators') || 'Featured Creators' }}
        </span>
      </h2>
      <UButton
        v-if="streams.length > 4"
        variant="ghost"
        size="sm"
        :to="'/creators'"
      >
        {{ $t('viewAll') || 'View all' }}
      </UButton>
    </div>

    <div v-if="loading" class="loading-grid">
      <div v-for="i in 4" :key="i" class="skeleton-card">
        <USkeleton class="skeleton-image" />
        <USkeleton class="h-4 w-3/4 mt-3" />
        <USkeleton class="h-3 w-1/2 mt-2" />
      </div>
    </div>

    <div v-else-if="streams.length === 0" class="empty-state">
      <Icon name="heroicons:users" class="text-4xl text-gray-400 mb-3" />
      <p class="text-gray-500">{{ $t('noCreatorsAvailable') || 'No creators available' }}</p>
    </div>

    <div v-else class="streams-grid">
      <NuxtLink
        v-for="stream in displayedStreams"
        :key="stream.id"
        :to="`/${stream.path}`"
        class="stream-card-mobile"
      >
        <div class="card-image-container">
          <img
            v-if="stream.logo"
            :src="stream.logo"
            :alt="stream.name"
            class="card-image"
            @error="handleImageError($event, stream)"
          />
          <div v-else class="image-fallback">
            <Icon name="heroicons:user-circle" class="text-4xl" />
          </div>
          <span v-if="stream.isLive" class="live-badge-mobile">
            <span class="live-dot"></span>
            LIVE
          </span>
        </div>

        <div class="card-content">
          <div class="card-header">
            <h3 class="card-title">{{ stream.name }}</h3>
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
          </div>

          <p v-if="stream.streamTitle" class="card-subtitle">
            {{ truncateText(stream.streamTitle, 60) }}
          </p>
          <p v-else-if="stream.description" class="card-subtitle">
            {{ truncateText(stream.description, 60) }}
          </p>

          <div v-if="stream.isLive && stream.viewerCount" class="card-viewers">
            <Icon name="heroicons:eye" class="text-sm" />
            <span>{{ formatViewerCount(stream.viewerCount) }} {{ $t('viewers') || 'viewers' }}</span>
          </div>

          <div v-if="stream.tags && stream.tags.length > 0" class="card-tags">
            <span
              v-for="(tag, index) in stream.tags.slice(0, 3)"
              :key="index"
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface LiveStream {
  id: number
  path: string
  name: string
  description?: string
  logo?: string
  platform: 'twitch' | 'x' | null
  isLive: boolean
  streamTitle?: string
  viewerCount?: number
  streamUrl?: string
  startedAt?: Date
  tags?: string[]
}

const config = useRuntimeConfig()
const loading = ref(true)
const streams = ref<LiveStream[]>([])
let refreshInterval: NodeJS.Timeout | null = null

const hasLiveStreams = computed(() =>
  streams.value.some(stream => stream.isLive)
)

const displayedStreams = computed(() =>
  streams.value.slice(0, 8) // Show more on mobile grid
)

const fetchStreams = async () => {
  try {
    const data = await $fetch<LiveStream[]>(`${config.public.apiBaseUrl}/live-streams`)
    streams.value = data || []
  } catch (error) {
    console.error('Failed to fetch live streams:', error)
    streams.value = []
  } finally {
    loading.value = false
  }
}

const formatViewerCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const handleImageError = (event: Event, stream: LiveStream) => {
  const img = event.target as HTMLImageElement
  // Fallback to UI Avatars API
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(stream.name)}&background=random`
}

onMounted(() => {
  fetchStreams()
  // Refresh every 2 minutes
  refreshInterval = setInterval(fetchStreams, 120000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped lang="scss">
.home-live-streams {
  padding: 40px 0;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .section-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-gray-900);

      .dark & {
        color: var(--color-gray-100);
      }

      .live-indicator {
        display: flex;
        align-items: center;
        gap: 10px;

        .pulse-dot {
          width: 12px;
          height: 12px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
      }
    }
  }

  .loading-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }

    .skeleton-card {
      .skeleton-image {
        width: 100%;
        height: 150px;
        border-radius: 8px;
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }

  .streams-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }

    @media (min-width: 768px) and (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .stream-card-mobile {
    background: var(--color-gray-50);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s;
    cursor: pointer;
    text-decoration: none;

    .dark & {
      background: var(--color-gray-800);
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

      .dark & {
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }
    }

    .card-image-container {
      position: relative;
      width: 100%;
      height: 150px;
      background: var(--color-gray-200);

      .dark & {
        background: var(--color-gray-700);
      }

      .card-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .image-fallback {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-gray-400);

        .dark & {
          color: var(--color-gray-600);
        }
      }

      .live-badge-mobile {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(239, 68, 68, 0.9);
        backdrop-filter: blur(4px);
        color: white;
        font-size: 11px;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 4px;

        .live-dot {
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
      }
    }

    .card-content {
      padding: 16px;

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-gray-900);
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          .dark & {
            color: var(--color-gray-100);
          }
        }

        .platform-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;

          &.twitch {
            color: #9146ff;
          }

          &.x {
            color: var(--color-gray-900);

            .dark & {
              color: var(--color-gray-100);
            }
          }
        }
      }

      .card-subtitle {
        font-size: 13px;
        color: var(--color-gray-600);
        line-height: 1.5;
        margin-bottom: 8px;
        min-height: 40px;

        .dark & {
          color: var(--color-gray-400);
        }
      }

      .card-viewers {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--color-gray-500);
        margin-bottom: 8px;
        font-weight: 500;
      }

      .card-tags {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;

        .tag {
          font-size: 11px;
          padding: 3px 8px;
          background: var(--color-gray-200);
          color: var(--color-gray-700);
          border-radius: 12px;

          .dark & {
            background: var(--color-gray-700);
            color: var(--color-gray-300);
          }
        }
      }
    }
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

// Show only on mobile and tablet
@media (min-width: 1025px) {
  .home-live-streams {
    display: none;
  }
}
</style>