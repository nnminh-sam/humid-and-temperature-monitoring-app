import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import * as dotenv from 'dotenv';
import { ChannelService } from './channel.service';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { RequestedUser } from 'src/decorator/request-user.decorator';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
dotenv.config();

const resourcePath: string = `${process.env.API_PREFIX}/${process.env.API_VERSION}/channels`;
@Controller(resourcePath)
@UseGuards(JwtGuard)
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Get(':id')
  async findOne(@RequestedUser() user: any, @Param('id') id: string) {
    const channel = await this.channelService.findById(id);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    if (channel.user.id !== user.id) {
      throw new UnauthorizedException('Unauthorized user');
    }
  }

  @Get()
  async findAll(@RequestedUser() user: any) {
    return await this.channelService.findAll(user.id);
  }

  @Post()
  async create(
    @RequestedUser() user: any,
    @Body() createChannelDto: CreateChannelDto,
  ) {
    return await this.channelService.create(user, createChannelDto);
  }

  @Patch(':id')
  async update(
    @RequestedUser() user: any,
    @Param('id') id: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return await this.channelService.update(user, id, updateChannelDto);
  }
}
