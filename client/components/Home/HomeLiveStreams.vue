<template>
  <section class="home-live-streams">
    <div class="section-header">
      <h2 class="section-title">
        <span v-if="hasLiveStreams" class="live-indicator">
          <span class="pulse-dot"></span>
          {{ $t('liveNow') || 'Live Now' }}
        </span>
        <span v-else>
          {{ $t('featuredCreators') || 'Featured Creators' }}
        </span>
      </h2>
      <NuxtLink
        v-if="streams.length > 3"
        to="/creator"
        class="view-all-link"
      >
        {{ $t('viewAll') || 'View all' }}
        <Icon name="heroicons:arrow-right" class="arrow-icon" />
      </NuxtLink>
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

    <div v-else class="streams-container">
      <div class="streams-scroll">
        <NuxtLink
          v-for="stream in displayedStreams"
          :key="stream.id"
          :to="`/${stream.path}`"
          class="stream-card-mobile"
        >
          <div class="card-avatar">
            <img
              v-if="stream.logo"
              :src="stream.logo"
              :alt="stream.name"
              class="avatar-image"
              @error="handleImageError($event, stream)"
            />
            <div v-else class="avatar-fallback" :style="getAvatarColor(stream.name)">
              <span class="avatar-initials">{{ getInitials(stream.name) }}</span>
            </div>
            <span v-if="stream.isLive" class="live-badge">
              <span class="live-dot"></span>
              LIVE
            </span>
          </div>
          <div class="card-content">
            <h3 class="card-name">{{ stream.name }}</h3>
            <div v-if="stream.isLive" class="card-viewers">
              <Icon name="heroicons:users-solid" class="viewer-icon" />
              <span>{{ formatViewerCount(stream.viewerCount || 0) }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>
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

const displayedStreams = computed(() => {
  const live = streams.value.filter(s => s.isLive)
  const featured = streams.value.filter(s => !s.isLive)

  if (live.length > 0) {
    return [...live.slice(0, 5), ...featured.slice(0, 3 - Math.min(live.length, 5))]
  }
  return featured.slice(0, 5)
})

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
  img.style.display = 'none'
}

const getInitials = (name: string): string => {
  const words = name.split(' ')
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const getAvatarColor = (name: string): Record<string, string> => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  const gradients = [
    'linear-gradient(135deg, #FF8A4C 0%, #FF6B2B 100%)',
    'linear-gradient(135deg, #FFB366 0%, #FF8A4C 100%)',
    'linear-gradient(135deg, #FF6B2B 0%, #E55100 100%)',
    'linear-gradient(135deg, #FFA860 0%, #FF8A4C 100%)',
    'linear-gradient(135deg, #FF9558 0%, #FF7638 100%)',
  ]

  const colorIndex = Math.abs(hash) % gradients.length

  return {
    background: gradients[colorIndex],
    color: 'white',
  }
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
  padding: 20px 0 10px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding: 0 20px;

    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--color-gray-900);

      .dark & {
        color: var(--color-gray-100);
      }

      .live-indicator {
        display: flex;
        align-items: center;
        gap: 8px;

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #FF6B2B;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
      }
    }

    .view-all-link {
      font-size: 13px;
      font-weight: 500;
      color: #FF6B2B;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 4px;

      .arrow-icon {
        width: 14px;
        height: 14px;
      }
    }
  }

  .loading-grid {
    display: flex;
    gap: 12px;
    padding: 0 20px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }

    .skeleton-card {
      min-width: 140px;

      .skeleton-image {
        width: 140px;
        height: 140px;
        border-radius: 12px;
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
  }

  .streams-container {
    position: relative;

    .streams-scroll {
      display: flex;
      gap: 12px;
      padding: 0 20px;
      overflow-x: auto;
      scroll-behavior: smooth;
      scrollbar-width: none;
      -ms-overflow-style: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }
  }

  .stream-card-mobile {
    display: flex;
    flex-direction: column;
    min-width: 110px;
    text-decoration: none;
    align-items: center;
    transition: transform 0.2s ease;

    &:active {
      transform: scale(0.98);
    }

    .card-avatar {
      position: relative;
      width: 110px;
      height: 110px;
      margin-bottom: 8px;

      .avatar-image,
      .avatar-fallback {
        width: 100%;
        height: 100%;
        border-radius: 20px;
        object-fit: cover;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .avatar-fallback {
        display: flex;
        align-items: center;
        justify-content: center;

        .avatar-initials {
          font-weight: 700;
          font-size: 28px;
          text-transform: uppercase;
          color: white;
        }
      }

      .live-badge {
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        background: #FF6B2B;
        color: white;
        font-size: 10px;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
        box-shadow: 0 2px 6px rgba(255, 107, 43, 0.3);
        border: 2px solid white;

        .live-dot {
          width: 5px;
          height: 5px;
          background: white;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
      }
    }

    .card-content {
      text-align: center;
      width: 100%;
      padding-top: 2px;

      .card-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--color-gray-900);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 0 4px;
        margin-bottom: 2px;

        .dark & {
          color: var(--color-gray-100);
        }
      }

      .card-viewers {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        font-size: 11px;
        color: #FF6B2B;
        font-weight: 500;

        .viewer-icon {
          width: 12px;
          height: 12px;
        }
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

// Show only on mobile and tablet
@media (min-width: 1025px) {
  .home-live-streams {
    display: none;
  }
}

// Responsive adjustments for tablets
@media (min-width: 640px) and (max-width: 1024px) {
  .home-live-streams {
    .stream-card-mobile {
      min-width: 130px;

      .card-avatar {
        width: 130px;
        height: 130px;

        .avatar-initials {
          font-size: 32px;
        }
      }

      .card-content {
        .card-name {
          font-size: 15px;
        }
      }
    }
  }
}
</style>