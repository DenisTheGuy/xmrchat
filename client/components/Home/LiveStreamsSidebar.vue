<template>
  <div class="live-streams-sidebar">
    <div class="sidebar-header">
      <h3 class="sidebar-title">
        <span v-if="hasLiveStreams" class="live-indicator">
          <span class="pulse-dot"></span>
          {{ $t('liveNow') || 'Live Now' }}
        </span>
        <span v-else>
          {{ $t('featuredCreators') || 'Featured Creators' }}
        </span>
      </h3>
      <NuxtLink
        v-if="streams.length > 3"
        to="/creator"
        class="show-more-btn"
      >
        {{ $t('viewAll') || 'View all' }}
        <Icon name="heroicons:arrow-right" class="text-xs ml-1" />
      </NuxtLink>
    </div>

    <div v-if="loading" class="loading-container">
      <div v-for="i in 4" :key="i" class="skeleton-card">
        <USkeleton class="skeleton-avatar" :ui="{ rounded: 'rounded-full' }" />
        <div class="skeleton-content">
          <USkeleton class="h-4 w-24 mb-1" />
          <USkeleton class="h-3 w-16" />
        </div>
      </div>
    </div>

    <div v-else-if="streams.length === 0" class="empty-state">
      <Icon name="heroicons:video-camera-slash" class="text-2xl text-gray-400 mb-2" />
      <p class="text-xs text-gray-500">{{ $t('noCreatorsAvailable') || 'No creators available' }}</p>
      <NuxtLink to="/creator" class="browse-link">
        {{ $t('browseCreators') || 'Browse creators' }}
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
            @error="handleImageError($event, stream)"
          />
          <div v-else class="avatar-fallback" :style="getAvatarColor(stream.name)">
            <span class="avatar-initials">{{ getInitials(stream.name) }}</span>
          </div>
          <!-- Avatar live indicator removed in favor of text badge -->
        </div>

        <div class="stream-info">
          <div class="stream-header">
            <h4 class="stream-name" :title="stream.name">{{ stream.name }}</h4>
            <span v-if="stream.isLive" class="live-text-badge">
              <span class="live-pulse"></span>
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
            </div>
          </div>

          <div v-if="stream.isLive" class="stream-status">
            <div class="stream-metrics">
              <div v-if="stream.viewerCount" class="stream-viewers">
                <Icon name="heroicons:users-solid" class="viewer-icon" />
                <span class="viewers-count">{{ formatViewerCount(stream.viewerCount) }}</span>
              </div>
              <div v-if="stream.startedAt" class="stream-duration">
                <Icon name="heroicons:clock" class="duration-icon" />
                <span class="duration-text">{{ getStreamDuration(stream.startedAt) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="stream-status">
            <p class="stream-offline">Offline</p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
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
  startedAt?: string | Date
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
  // Show only live streams if any exist, otherwise show featured (max 3)
  const live = streams.value.filter(s => s.isLive);
  if (live.length > 0) {
    return live.slice(0, 3);
  }
  const featured = streams.value.filter(s => !s.isLive);
  return featured.slice(0, 3);
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
  // Remove src to show fallback
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
  // Generate subtle gradient based on name for consistency
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Use orange-based gradients with subtle variations
  const gradients = [
    'linear-gradient(135deg, #FF8A4C 0%, #FF6B2B 100%)', // Main orange
    'linear-gradient(135deg, #FFB366 0%, #FF8A4C 100%)', // Light orange
    'linear-gradient(135deg, #FF6B2B 0%, #E55100 100%)', // Deep orange
    'linear-gradient(135deg, #FFA860 0%, #FF8A4C 100%)', // Soft orange
    'linear-gradient(135deg, #FF9558 0%, #FF7638 100%)', // Mid orange
  ]

  const colorIndex = Math.abs(hash) % gradients.length

  return {
    background: gradients[colorIndex],
    color: 'white',
  }
}

const getStreamDuration = (startedAt: string | Date): string => {
  const start = new Date(startedAt)
  const now = new Date()
  const diff = Math.floor((now.getTime() - start.getTime()) / 1000) // seconds

  const hours = Math.floor(diff / 3600)
  const minutes = Math.floor((diff % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
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
.live-streams-sidebar {
  background: var(--color-gray-50);
  border-radius: 16px;
  padding: 20px;
  height: fit-content;
  position: sticky;
  top: 80px;

  // Hide scrollbar but keep functionality
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  scrollbar-width: none; // Firefox
  -ms-overflow-style: none; // IE and Edge

  &::-webkit-scrollbar {
    display: none; // Chrome, Safari, Opera
  }

  .dark & {
    background: var(--color-gray-800);
    border: 1px solid var(--color-gray-700);
  }

  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .sidebar-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-gray-900);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
      letter-spacing: -0.01em;

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
          box-shadow: 0 0 0 0 rgba(255, 107, 43, 0.4);
        }
      }
    }

    .show-more-btn {
      font-size: 12px;
      font-weight: 500;
      color: #FF6B2B;
      text-decoration: none;
      display: flex;
      align-items: center;
      transition: all 0.2s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;

      &:hover {
        color: #E55100;
        transform: translateX(2px);
      }
    }
  }

  .loading-container {
    .skeleton-card {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;

      .skeleton-avatar {
        width: 48px;
        height: 48px;
        flex-shrink: 0;
      }

      .skeleton-content {
        flex: 1;
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 32px 16px;

    .browse-link {
      display: inline-block;
      margin-top: 12px;
      font-size: 13px;
      font-weight: 500;
      color: #FF6B2B;
      text-decoration: none;
      transition: all 0.2s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;

      &:hover {
        color: #E55100;
        text-decoration: underline;
      }
    }
  }

  .streams-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .stream-card {
    display: flex;
    gap: 12px;
    padding: 10px;
    border-radius: 12px;
    transition: all 0.2s ease;
    cursor: pointer;
    text-decoration: none;
    position: relative;

    &:hover {
      background: var(--color-gray-100);
      transform: translateX(2px);

      .dark & {
        background: var(--color-gray-700);
      }

      .stream-avatar {
        transform: scale(1.05);
      }
    }

    &.is-live {
      background: linear-gradient(90deg, rgba(255, 107, 43, 0.04) 0%, transparent 100%);

      .dark & {
        background: linear-gradient(90deg, rgba(255, 107, 43, 0.08) 0%, transparent 100%);
      }

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 2px;
        height: 60%;
        background: linear-gradient(180deg, transparent, #FF6B2B, transparent);
        opacity: 0.6;
      }
    }

    .stream-avatar {
      position: relative;
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      transition: transform 0.2s ease;

      .avatar-img,
      .avatar-fallback {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .avatar-img {
        border: 2px solid var(--color-gray-200);

        .dark & {
          border-color: var(--color-gray-600);
        }
      }

      .avatar-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1),
                    0 2px 4px rgba(0, 0, 0, 0.05);
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
          pointer-events: none;
        }

        .avatar-initials {
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
          position: relative;
          z-index: 1;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
      }

      // Live badge removed - using text badge instead
    }

    .stream-info {
      flex: 1;
      min-width: 0;

      .stream-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 3px;

        .stream-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-gray-900);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          line-height: 1.3;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
          letter-spacing: -0.01em;

          .dark & {
            color: var(--color-gray-100);
          }
        }

        .live-text-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          background: rgba(255, 107, 43, 0.1);
          border: 1px solid rgba(255, 107, 43, 0.3);
          border-radius: 4px;
          font-size: 9px;
          font-weight: 700;
          color: #FF6B2B;
          letter-spacing: 0.05em;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;

          .dark & {
            background: rgba(255, 107, 43, 0.15);
            border-color: rgba(255, 107, 43, 0.4);
          }

          .live-pulse {
            width: 5px;
            height: 5px;
            background: #FF6B2B;
            border-radius: 50%;
            animation: livePulse 1.5s ease-in-out infinite;
          }
        }

        .platform-badge {
          display: flex;
          align-items: center;
          padding: 2px;
          background: var(--color-gray-100);
          border-radius: 4px;

          .dark & {
            background: var(--color-gray-700);
          }
        }

        .platform-icon {
          width: 12px;
          height: 12px;
          flex-shrink: 0;

          &.twitch {
            color: #9146ff;
          }

          &.x {
            color: var(--color-gray-700);

            .dark & {
              color: var(--color-gray-300);
            }
          }
        }
      }

      .stream-status {
        .stream-metrics {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .stream-offline {
          font-size: 11px;
          color: var(--color-gray-500);
          line-height: 1.4;
          font-style: normal;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
          opacity: 0.8;

          .dark & {
            color: var(--color-gray-500);
          }
        }

        .stream-viewers {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          color: #FF6B2B;
          font-weight: 500;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;

          .viewer-icon {
            width: 10px;
            height: 10px;
          }

          .viewers-count {
            letter-spacing: -0.01em;
          }
        }

        .stream-duration {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          color: var(--color-gray-600);
          font-weight: 500;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;

          .dark & {
            color: var(--color-gray-400);
          }

          .duration-icon {
            width: 10px;
            height: 10px;
          }

          .duration-text {
            letter-spacing: -0.01em;
          }
        }
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

// Hide on mobile and tablet
@media (max-width: 1024px) {
  .live-streams-sidebar {
    display: none;
  }
}
</style>