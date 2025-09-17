import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { LiveStreamsController } from './live-streams.controller';
import { LiveStreamsService } from './live-streams.service';
import { PagesModule } from '../pages/pages.module';

@Module({
  imports: [
    HttpModule,
    PagesModule,
    CacheModule.register({
      ttl: 120000, // 2 minutes default
      max: 100,
    }),
  ],
  controllers: [LiveStreamsController],
  providers: [LiveStreamsService],
  exports: [LiveStreamsService],
})
export class LiveStreamsModule {}