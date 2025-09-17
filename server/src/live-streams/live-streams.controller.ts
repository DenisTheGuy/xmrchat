import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { SkipThrottle } from '@nestjs/throttler';
import { IsPublic } from '../shared/decorators/is-public.decorator';
import { LiveStreamsService } from './live-streams.service';
import { LiveStreamDto } from './dto/live-stream.dto';

@Controller('live-streams')
@UseInterceptors(CacheInterceptor)
@SkipThrottle()
@IsPublic()
export class LiveStreamsController {
  constructor(private readonly liveStreamsService: LiveStreamsService) {}

  @Get()
  @SkipThrottle()
  async getLiveStreams(): Promise<LiveStreamDto[]> {
    return this.liveStreamsService.getLiveStreams();
  }
}