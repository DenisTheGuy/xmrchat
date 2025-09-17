export interface LiveStreamDto {
  id: number;
  path: string;
  name: string;
  description?: string;
  logo?: string;
  platform: 'twitch' | 'x' | null;
  isLive: boolean;
  streamTitle?: string;
  viewerCount?: number;
  streamUrl?: string;
  startedAt?: Date;
  tags?: string[];
}

export interface TwitchStream {
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
}

export interface XSpace {
  id: string;
  state: string;
  title?: string;
  host_ids?: string[];
  speaker_ids?: string[];
  participant_count?: number;
  started_at?: string;
  scheduled_start?: string;
}