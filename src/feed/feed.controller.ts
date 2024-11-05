import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import * as dotenv from 'dotenv';
import { FeedService } from './feed.service';
import { CreateFeedDto } from './dto/create-feed.dto';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
dotenv.config();

const resourcePath: string = `${process.env.API_PREFIX}/${process.env.API_VERSION}/feeds`;
@Controller(resourcePath)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('/create')
  async createFeedByWriteKey(
    @Query('channel-id') channelId: string,
    @Query('write-key') writeKey: string,
    @Query('temperature') temperature: number,
    @Query('humidity') humidity: number,
    @Query('temperature-threshold') temperatureThreshold: number,
    @Query('humidity-threshold') humidityThreshold: number,
  ) {
    return await this.feedService.createByWriteKey(writeKey, {
      channelId,
      temperature,
      humidity,
      temperatureThreshold,
      humidityThreshold,
    });
  }

  @Get('/read')
  async findFeedsByReadKey(
    @Query('channel-id') channelId: string,
    @Query('read-key') readKey: string,
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('sort-by') sortBy: string,
    @Query('order-by') orderBy: string,
  ) {
    return await this.feedService.findByReadKey(channelId, readKey, {
      page: page || 1,
      size: size || 10,
      sortBy: sortBy || 'createdAt',
      orderBy: orderBy || 'asc',
    });
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async findById(@Param('id') id: string) {
    return await this.feedService.findById(id);
  }

  @Get()
  @UseGuards(JwtGuard)
  async findAll(
    @Query('channelId') channelId: string,
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('sortBy') sortBy: string,
    @Query('orderBy') orderBy: string,
  ) {
    return await this.feedService.findAll(channelId, {
      page: page || 1,
      size: size || 10,
      sortBy: sortBy || 'createdAt',
      orderBy: orderBy || 'asc',
    });
  }

  @Post()
  @UseGuards(JwtGuard)
  async create(@Body() creatFeedDto: CreateFeedDto) {
    return await this.feedService.create(creatFeedDto);
  }
}
