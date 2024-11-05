import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Channel,
  ChannelDocument,
  PopulatedChannel,
} from './entities/channel.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { transformMongooseDocument } from 'src/mongoose/mongoose.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class ChannelService {
  private readonly logger: Logger = new Logger(ChannelService.name);

  constructor(
    @InjectModel(Channel.name)
    private readonly channelModel: Model<ChannelDocument>,

    private readonly userService: UserService,
  ) {}

  async create(userId: string, payload: CreateChannelDto) {
    const user: User = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      const channelModel = new this.channelModel({
        ...payload,
        user: user.id,
      });
      const channelDocument: ChannelDocument = await channelModel.save();
      return await this.findById(channelDocument._id.toString());
    } catch (error: any) {
      this.logger.fatal(error);
      throw new InternalServerErrorException('Failed to create channel', error);
    }
  }

  async findById(id: string) {
    return (await this.channelModel
      .findOne({ _id: id })
      .select('-__v')
      .populate({
        path: 'user',
        select: '-__v -password',
        transform: transformMongooseDocument,
      })
      .transform(transformMongooseDocument)
      .exec()) as PopulatedChannel;
  }

  async findAll(userId: string) {
    return (await this.channelModel
      .find({
        user: userId,
      })
      .select('-__v')
      .populate({
        path: 'user',
        select: '-__v -password',
        transform: transformMongooseDocument,
      })
      .transform((doc) => doc.map(transformMongooseDocument))
      .exec()) as PopulatedChannel[];
  }

  async update(userId: string, channelId: string, payload: UpdateChannelDto) {
    const channel: PopulatedChannel = await this.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    if (channel.user.id !== userId) {
      throw new UnauthorizedException('Unauthorized user');
    }

    try {
      const channelDocument: ChannelDocument = await this.channelModel
        .findByIdAndUpdate()
        .exec();
      return await this.findById(channelDocument._id.toString());
    } catch (error: any) {
      this.logger.fatal(error);
      throw new InternalServerErrorException('Failed to update channel', error);
    }
  }
}
