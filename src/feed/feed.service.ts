import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model, Mongoose } from 'mongoose';
import { Feed, FeedDocument, PopulatedFeed } from './entities/feed.entity';
import { InjectModel } from '@nestjs/mongoose';
import { CreateFeedDto } from './dto/create-feed.dto';
import { transformMongooseDocument } from 'src/mongoose/mongoose.service';
import { PaginationDto } from '../helper/api/pagination.dto';
import { ChannelService } from 'src/channel/channel.service';
import { PopulatedChannel } from 'src/channel/entities/channel.entity';
import { SocketGateway } from 'src/socket-gateway/entities/socket-gateway.entity';
import { SocketGatewayGateway } from 'src/socket-gateway/socket-gateway.gateway';
import { create } from 'domain';

@Injectable()
export class FeedService {
  private readonly logger: Logger = new Logger(FeedService.name);

  constructor(
    @InjectModel(Feed.name)
    private readonly feedModel: Model<FeedDocument>,

    private readonly channelService: ChannelService,

    private readonly socketGateway: SocketGatewayGateway,
  ) {}

  async createByWriteKey(writeKey: string, payload: CreateFeedDto) {
    const channel: PopulatedChannel = await this.channelService.findById(
      payload.channelId,
    );
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.writeKey !== writeKey) {
      throw new UnauthorizedException('Unauthorized write key');
    }

    return await this.create(payload);
  }

  async findByReadKey(
    channelId: string,
    readKey: string,
    paginationDto: PaginationDto,
  ) {
    const channel: PopulatedChannel =
      await this.channelService.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.readKey !== readKey) {
      throw new UnauthorizedException('Unauthorized read key');
    }

    return await this.findAll(channelId, paginationDto);
  }

  async create(payload: CreateFeedDto) {
    try {
      const feedModel = new this.feedModel({
        ...payload,
        channel: payload.channelId,
      });
      const feedDocument: FeedDocument = await feedModel.save();
      const newFeed = await this.findById(feedDocument._id.toString());
      this.socketGateway.create(payload.channelId, newFeed);
      return newFeed;
    } catch (error: any) {
      this.logger.fatal(error);
      throw new InternalServerErrorException(
        'Failed to create new feed',
        error,
      );
    }
  }

  async findById(id: string) {
    return (await this.feedModel
      .findOne({ _id: id })
      .select('-__v')
      .populate({
        path: 'channel',
        select: '-__v -writeKey -readKey',
        transform: transformMongooseDocument,
      })
      .transform(transformMongooseDocument)
      .exec()) as PopulatedFeed;
  }

  async findAll(channelId: string, paginationDto: PaginationDto) {
    const filter: Record<string, any> = {
      channel: channelId,
    };

    const { page, size, sortBy, orderBy } = paginationDto;
    const skip: number = (page - 1) * size;
    const totalDocuments: number = await this.feedModel.countDocuments(filter);
    const totalPages: number = Math.ceil(totalDocuments / size);

    const feeds: PopulatedFeed[] = (await this.feedModel
      .find(filter)
      .select('-__v')
      .populate({
        path: 'channel',
        select: '-__v -writeKey -readKey -createdAt -updatedAt -_id',
        transform: transformMongooseDocument,
      })
      // .limit(size)
      // .skip(skip)
      .sort({ [sortBy]: orderBy.toLowerCase() === 'desc' ? -1 : 1 })
      .transform((doc: any) => doc.map(transformMongooseDocument))
      .exec()) as PopulatedFeed[];

    return {
      data: feeds,
      metadata: {
        pagination: {
          totalDocuments,
          totalPages,
          page,
          size,
          sortBy,
          orderBy,
        },
      },
    };
  }

  async findCurrentThresholds(channelId: string, readKey: string) {
    const channel: PopulatedChannel =
      await this.channelService.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.readKey !== readKey) {
      throw new UnauthorizedException('Unauthorized read key');
    }

    console.log(channel);

    const latestFeed = await this.feedModel
      .find({
        channel: channelId,
        temperature: { $exists: true },
        humidity: { $exists: true },
      })
      .sort({ createdAt: -1 })
      .limit(1)
      .select('-__v')
      .transform((doc: any) => doc.map(transformMongooseDocument))
      .exec();
    return {
      temperatureThreshold: latestFeed[0].temperatureThreshold,
      humidityThreshold: latestFeed[0].humidityThreshold,
    };
  }
}
