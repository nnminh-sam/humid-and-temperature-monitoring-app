import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { RequestedUser } from 'src/decorator/request-user.decorator';
import * as dotenv from 'dotenv';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
dotenv.config();

const resourcePath: string = `${process.env.API_PREFIX}/${process.env.API_VERSION}/channels`;
@Controller(resourcePath)
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Get(':channelId/keys')
  async generateReadAndWriteKey(
    @Param('channelId') channelId: string,
    @Query('email') email: string,
  ) {
    return await this.channelService.generateReadAndWriteToken(
      email,
      channelId,
    );
  }

  @Get(':channelId/validate-keys')
  async validateKeys(
    @Param('channelId') channelId: string,
    @Query('read-key') readKey: string,
    @Query('write-key') writeKey: string,
    @Query('email') email: string,
  ): Promise<any> {
    return await this.channelService.validateKeys(
      channelId,
      email,
      readKey,
      writeKey,
    );
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async findOne(@RequestedUser() user: any, @Param('id') id: string) {
    const channel = await this.channelService.findById(id);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    if (channel.user.id !== user.id) {
      throw new UnauthorizedException('Unauthorized user');
    }
    return channel;
  }

  @Get()
  @UseGuards(JwtGuard)
  async findAll(@RequestedUser() user: any) {
    return await this.channelService.findAll(user.id);
  }

  @Post()
  @UseGuards(JwtGuard)
  async create(
    @RequestedUser() user: any,
    @Body() createChannelDto: CreateChannelDto,
  ) {
    console.log(createChannelDto);
    return await this.channelService.create(user.id, createChannelDto);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  async update(
    @RequestedUser() user: any,
    @Param('id') id: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return await this.channelService.update(user.id, id, updateChannelDto);
  }
}
