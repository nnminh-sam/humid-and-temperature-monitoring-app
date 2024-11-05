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
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
const crypto = require('crypto');

@Injectable()
export class ChannelService {
  private readonly logger: Logger = new Logger(ChannelService.name);

  constructor(
    @InjectModel(Channel.name)
    private readonly channelModel: Model<ChannelDocument>,

    private readonly userService: UserService,

    private readonly jwtService: JwtService,
  ) {}

  private createReadAndWriteToken(user: string, channel: string) {
    const readKey: string = this.jwtService.sign({
      user,
      channel,
      type: 'read',
    });
    const writeKey: string = this.jwtService.sign({
      user,
      channel,
      type: 'write',
    });
    return { readKey, writeKey };
  }

  private hashSHA256(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  private validateKey(inputKey: string, storedHash: string): boolean {
    const hashedInput = this.hashSHA256(inputKey);
    return hashedInput === storedHash;
  }

  async generateReadAndWriteToken(email: string, channelId: string) {
    try {
      const channel: PopulatedChannel = await this.findById(channelId);
      if (!channel) {
        throw new NotFoundException('Channel not found');
      }
      if (channel.user.email !== email) {
        throw new UnauthorizedException('Unauthorized user');
      }

      const user = await this.userService.findByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const { readKey, writeKey } = this.createReadAndWriteToken(
        user.email,
        channelId,
      );
      const hashedKeys = {
        readKey: this.hashSHA256(readKey),
        writeKey: this.hashSHA256(writeKey),
      };

      const channelDocument: ChannelDocument = await this.channelModel
        .findByIdAndUpdate(channelId, { readKey, writeKey }, { new: true })
        .exec();
      if (!channelDocument) throw new NotFoundException('Channel not found');
      return hashedKeys;
    } catch (error: any) {
      this.logger.fatal(error);
      throw new InternalServerErrorException(
        'Failed to generate read and write token',
        error,
      );
    }
  }

  private async validateReadKey(channelId: string, readKey: string) {
    const channelKeys = await this.findKeysById(channelId);
    if (!channelKeys) {
      throw new NotFoundException('Channel not found');
    }
    return this.validateKey(channelKeys.readKey, readKey);
  }

  private async validateWriteKey(channelId: string, writeKey: string) {
    const channelKeys = await this.findKeysById(channelId);
    if (!channelKeys) {
      throw new NotFoundException('Channel not found');
    }
    return this.validateKey(channelKeys.writeKey, writeKey);
  }

  async validateKeys(
    channelId: string,
    email: string,
    readKey: string,
    writeKey: string,
  ) {
    const channel = await this.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    const user: User = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (channel.user.id !== user.id) {
      throw new UnauthorizedException('Unauthorized user');
    }

    const readKeyValid = await this.validateReadKey(channelId, readKey);
    const writeKeyValid = await this.validateWriteKey(channelId, writeKey);
    if (!readKeyValid || !writeKeyValid) {
      throw new UnauthorizedException('Invalid read or write key');
    }
    return channel;
  }

  async create(userId: string, createChannelDto: CreateChannelDto) {
    const user: User = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      const channelModel = new this.channelModel({
        ...createChannelDto,
        user: user.id,
      });
      const channelDocument: ChannelDocument = await channelModel.save();
      const { readKey, writeKey } = this.createReadAndWriteToken(
        user.email,
        channelDocument._id.toString(),
      );
      const hashedKeys = {
        readKey: this.hashSHA256(readKey),
        writeKey: this.hashSHA256(writeKey),
      };
      const updatedChannelDocument: ChannelDocument = await this.channelModel
        .findByIdAndUpdate(
          channelDocument._id,
          { readKey, writeKey },
          { new: true },
        )
        .exec();
      const response = await this.findById(channelDocument._id.toString());
      return {
        ...response,
        readKey: hashedKeys.readKey,
        writeKey: hashedKeys.writeKey,
      } as PopulatedChannel;
    } catch (error: any) {
      this.logger.fatal(error);
      throw new InternalServerErrorException('Failed to create channel', error);
    }
  }

  async findKeysById(id: string) {
    const channel: PopulatedChannel = await this.findById(id);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return await this.channelModel
      .findById(id)
      .select('readKey writeKey')
      .exec();
  }

  async findById(id: string) {
    const channel: PopulatedChannel = (await this.channelModel
      .findOne({ _id: id })
      .select('-__v')
      .populate({
        path: 'user',
        select: '-__v -password',
        transform: transformMongooseDocument,
      })
      .transform(transformMongooseDocument)
      .exec()) as PopulatedChannel;
    if (!channel) {
      return null;
    }
    const haskedKeys = {
      readKey: this.hashSHA256(channel.readKey),
      writeKey: this.hashSHA256(channel.writeKey),
    };
    return {
      ...channel,
      readKey: haskedKeys.readKey,
      writeKey: haskedKeys.writeKey,
    } as PopulatedChannel;
  }

  async findAll(userId: string) {
    const channels: PopulatedChannel[] = (await this.channelModel
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

    return channels.map((channel) => {
      const haskedKeys = {
        readKey: this.hashSHA256(channel.readKey),
        writeKey: this.hashSHA256(channel.writeKey),
      };
      return {
        ...channel,
        readKey: haskedKeys.readKey,
        writeKey: haskedKeys.writeKey,
      };
    }) as PopulatedChannel[];
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
        .findByIdAndUpdate(channelId, { ...payload }, { new: true })
        .exec();
      return await this.findById(channelDocument._id.toString());
    } catch (error: any) {
      this.logger.fatal(error);
      throw new InternalServerErrorException('Failed to update channel', error);
    }
  }
}
