import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { firstValueFrom } from 'rxjs';
import { PagesService } from '../pages/pages.service';
import { LiveStreamDto, TwitchStream, XSpace } from './dto/live-stream.dto';
import { Page } from '../pages/page.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LiveStreamsService {
  private readonly logger = new Logger(LiveStreamsService.name);
  private twitchAccessToken: string | null = null;
  private twitchTokenExpiry: Date | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly pagesService: PagesService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getLiveStreams(): Promise<LiveStreamDto[]> {
    try {
      // Get all creators from database
      const { pages } = await this.pagesService.searchPages(null, 0, 1000);

      if (!pages || pages.length === 0) {
        return [];
      }

      // Extract creators with Twitch usernames
      const twitchUsernames = pages
        .filter(p => p.twitchUsername || p.twitchChannel)
        .map(p => p.twitchUsername || p.twitchChannel);

      // Extract creators with X usernames
      const xUsernames = pages
        .filter(p => p.xUsername)
        .map(p => p.xUsername);

      // Query APIs for live status
      const [twitchStreams, xSpaces] = await Promise.all([
        twitchUsernames.length > 0 ? this.checkTwitchStreams(twitchUsernames) : Promise.resolve(new Map()),
        xUsernames.length > 0 ? this.checkXSpaces(xUsernames) : Promise.resolve(new Map()),
      ]);

      // Combine results
      return this.combineResults(pages, twitchStreams, xSpaces);
    } catch (error) {
      this.logger.error('Error fetching live streams:', error);
      return [];
    }
  }

  private async getTwitchAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.twitchAccessToken && this.twitchTokenExpiry && this.twitchTokenExpiry > new Date()) {
      return this.twitchAccessToken;
    }

    const clientId = this.configService.get<string>('TWITCH_CLIENT_ID');
    const clientSecret = this.configService.get<string>('TWITCH_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      this.logger.warn('Twitch API credentials not configured');
      return '';
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post('https://id.twitch.tv/oauth2/token', null, {
          params: {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
          },
        })
      );

      this.twitchAccessToken = response.data.access_token;
      // Set expiry to 1 hour before actual expiry
      this.twitchTokenExpiry = new Date(Date.now() + (response.data.expires_in - 3600) * 1000);

      return this.twitchAccessToken;
    } catch (error) {
      this.logger.error('Failed to get Twitch access token:', error.response?.data || error.message);
      return '';
    }
  }

  private async checkTwitchStreams(usernames: string[]): Promise<Map<string, TwitchStream>> {
    const cacheKey = `twitch_streams_${usernames.sort().join(',')}_${Math.floor(Date.now() / 120000)}`;

    // Check cache first (2 minute cache)
    const cached = await this.cacheManager.get<Map<string, TwitchStream>>(cacheKey);
    if (cached) {
      return new Map(cached);
    }

    const accessToken = await this.getTwitchAccessToken();
    if (!accessToken) {
      return new Map();
    }

    const clientId = this.configService.get<string>('TWITCH_CLIENT_ID');
    const streamsMap = new Map<string, TwitchStream>();

    try {
      // Twitch API allows up to 100 usernames per request
      const chunks = [];
      for (let i = 0; i < usernames.length; i += 100) {
        chunks.push(usernames.slice(i, i + 100));
      }

      for (const chunk of chunks) {
        const params = new URLSearchParams();
        chunk.forEach(username => params.append('user_login', username.toLowerCase()));

        const response = await firstValueFrom(
          this.httpService.get('https://api.twitch.tv/helix/streams', {
            headers: {
              'Client-ID': clientId,
              'Authorization': `Bearer ${accessToken}`,
            },
            params,
          })
        );

        if (response.data?.data) {
          response.data.data.forEach((stream: TwitchStream) => {
            streamsMap.set(stream.user_login.toLowerCase(), stream);
          });
        }
      }

      // Cache the results
      await this.cacheManager.set(cacheKey, Array.from(streamsMap.entries()), 120000); // 2 minutes

      return streamsMap;
    } catch (error) {
      this.logger.error('Failed to check Twitch streams:', error.response?.data || error.message);
      return new Map();
    }
  }

  private async checkXSpaces(usernames: string[]): Promise<Map<string, XSpace>> {
    const cacheKey = `x_spaces_${usernames.sort().join(',')}_${Math.floor(Date.now() / 900000)}`;

    // Check cache first (15 minute cache for X)
    const cached = await this.cacheManager.get<Map<string, XSpace>>(cacheKey);
    if (cached) {
      return new Map(cached);
    }

    const bearerToken = this.configService.get<string>('X_BEARER_TOKEN');
    if (!bearerToken) {
      this.logger.warn('X API bearer token not configured');
      return new Map();
    }

    const spacesMap = new Map<string, XSpace>();

    try {
      // First, get user IDs from usernames
      const userIds = await this.getXUserIds(usernames);

      if (userIds.length === 0) {
        return new Map();
      }

      // Then check for live spaces by user
      for (const userId of userIds) {
        try {
          const response = await firstValueFrom(
            this.httpService.get(`https://api.twitter.com/2/spaces/by/creator_ids`, {
              headers: {
                'Authorization': `Bearer ${bearerToken}`,
              },
              params: {
                user_ids: userId.id,
                'space.fields': 'id,state,title,participant_count,started_at,scheduled_start,host_ids,speaker_ids',
              },
            })
          );

          if (response.data?.data) {
            response.data.data
              .filter((space: XSpace) => space.state === 'live')
              .forEach((space: XSpace) => {
                spacesMap.set(userId.username.toLowerCase(), space);
              });
          }
        } catch (error) {
          // Individual space check failed, continue with others
          this.logger.debug(`Failed to check X spaces for user ${userId.username}`);
        }
      }

      // Cache the results
      await this.cacheManager.set(cacheKey, Array.from(spacesMap.entries()), 900000); // 15 minutes

      return spacesMap;
    } catch (error) {
      this.logger.error('Failed to check X spaces:', error.response?.data || error.message);
      return new Map();
    }
  }

  private async getXUserIds(usernames: string[]): Promise<{ id: string; username: string }[]> {
    const bearerToken = this.configService.get<string>('X_BEARER_TOKEN');

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api.twitter.com/2/users/by', {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
          },
          params: {
            usernames: usernames.join(','),
          },
        })
      );

      if (response.data?.data) {
        return response.data.data.map((user: any) => ({
          id: user.id,
          username: user.username,
        }));
      }

      return [];
    } catch (error) {
      this.logger.error('Failed to get X user IDs:', error.response?.data || error.message);
      return [];
    }
  }

  private combineResults(
    pages: Page[],
    twitchStreams: Map<string, TwitchStream>,
    xSpaces: Map<string, XSpace>,
  ): LiveStreamDto[] {
    const results: LiveStreamDto[] = [];

    for (const page of pages) {
      const twitchUsername = (page.twitchUsername || page.twitchChannel || '').toLowerCase();
      const xUsername = (page.xUsername || '').toLowerCase();

      const twitchStream = twitchUsername ? twitchStreams.get(twitchUsername) : null;
      const xSpace = xUsername ? xSpaces.get(xUsername) : null;

      if (twitchStream) {
        results.push({
          id: page.id,
          path: page.path,
          name: page.name,
          description: page.description,
          logo: page.logo?.url || null,
          platform: 'twitch',
          isLive: true,
          streamTitle: twitchStream.title,
          viewerCount: twitchStream.viewer_count,
          streamUrl: `https://twitch.tv/${twitchStream.user_login}`,
          startedAt: new Date(twitchStream.started_at),
          tags: page.searchTerms?.split(',').map(t => t.trim()).filter(Boolean) || [],
        });
      } else if (xSpace) {
        results.push({
          id: page.id,
          path: page.path,
          name: page.name,
          description: page.description,
          logo: page.logo?.url || null,
          platform: 'x',
          isLive: true,
          streamTitle: xSpace.title,
          viewerCount: xSpace.participant_count,
          streamUrl: `https://twitter.com/i/spaces/${xSpace.id}`,
          startedAt: xSpace.started_at ? new Date(xSpace.started_at) : null,
          tags: page.searchTerms?.split(',').map(t => t.trim()).filter(Boolean) || [],
        });
      } else if (page.twitchUsername || page.twitchChannel || page.xUsername) {
        // Featured creator (not live)
        results.push({
          id: page.id,
          path: page.path,
          name: page.name,
          description: page.description,
          logo: page.logo?.url || null,
          platform: null,
          isLive: false,
          viewerCount: 0,
          streamUrl: page.twitchUsername || page.twitchChannel
            ? `https://twitch.tv/${page.twitchUsername || page.twitchChannel}`
            : page.xUsername
            ? `https://twitter.com/${page.xUsername}`
            : null,
          tags: page.searchTerms?.split(',').map(t => t.trim()).filter(Boolean) || [],
        });
      }
    }

    // Sort by viewer count (live streams first, then featured)
    return results.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return (b.viewerCount || 0) - (a.viewerCount || 0);
    });
  }
}