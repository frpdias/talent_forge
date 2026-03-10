import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PublisherService } from './publisher.service';
import { ChannelCode } from './types';

@Controller()
export class PublisherController {
  constructor(private readonly publisherService: PublisherService) {}

  /** GET /api/v1/jobs/:id/channels — Status de publicação da vaga */
  @Get('jobs/:id/channels')
  async getJobPublications(@Param('id') jobId: string) {
    return this.publisherService.getJobPublications(jobId);
  }

  /** POST /api/v1/jobs/:id/publish — Publicar vaga nos canais selecionados */
  @Post('jobs/:id/publish')
  @HttpCode(HttpStatus.OK)
  async publishJob(
    @Param('id') jobId: string,
    @Body() body: { channel_ids: string[] },
  ) {
    return this.publisherService.publishJob(jobId, body.channel_ids);
  }

  /** DELETE /api/v1/jobs/:id/publish/:channelId — Despublicar vaga de um canal */
  @Delete('jobs/:id/publish/:channelId')
  @HttpCode(HttpStatus.OK)
  async unpublishJob(
    @Param('id') jobId: string,
    @Param('channelId') channelId: string,
  ) {
    return this.publisherService.unpublishJob(jobId, channelId);
  }

  /** GET /api/v1/organizations/:id/channels — Canais configurados pela org */
  @Get('organizations/:id/channels')
  async getOrgChannels(@Param('id') orgId: string) {
    return this.publisherService.getOrgChannels(orgId);
  }

  /** POST /api/v1/organizations/:id/channels — Configurar canal */
  @Post('organizations/:id/channels')
  async upsertChannel(
    @Param('id') orgId: string,
    @Body() body: {
      channel_code: ChannelCode;
      display_name: string;
      credentials: Record<string, string>;
      config?: Record<string, unknown>;
      is_active?: boolean;
    },
  ) {
    return this.publisherService.upsertChannel(orgId, body);
  }
}
