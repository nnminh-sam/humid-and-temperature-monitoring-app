import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { transformMongooseDocument } from 'src/mongoose/mongoose.service';
import { UpdateUserDto } from './dto/update-user.dto';

const bcrypt = require('bcryptjs');
const bcryptSaltRounds: number = parseInt(process.env.BCRYPT_SALT_ROUNDS);

@Injectable()
export class UserService {
  private logger: Logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private async checkDuplicatedEmail(email: string) {
    return (
      (await this.userModel
        .countDocuments({
          email,
          deletedAt: null,
        })
        .exec()) !== 0
    );
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, bcryptSaltRounds);
  }

  async create(payload: CreateUserDto) {
    const isEmailExist = await this.checkDuplicatedEmail(payload.email);
    if (isEmailExist) {
      throw new BadRequestException('Email already exists');
    }

    try {
      const model = new this.userModel({
        ...payload,
        password: await this.hashPassword(payload.password),
      });
      const userDocument: UserDocument = await model.save();
      return await this.findById(userDocument._id.toString());
    } catch (error: any) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Failed to create user', error);
    }
  }

  async findById(id: string): Promise<User> {
    return await this.userModel
      .findOne({
        _id: id,
        deletedAt: null,
      })
      .select('-password -deletedAt -__v')
      .transform(transformMongooseDocument)
      .exec();
  }

  async findUserDetailByEmail(email: string): Promise<User> {
    return await this.userModel
      .findOne({ email, deletedAt: null })
      .transform(transformMongooseDocument)
      .exec();
  }

  async findUserDetailById(id: string): Promise<User> {
    return await this.userModel
      .findOne({ _id: id })
      .transform(transformMongooseDocument)
      .exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const userDocument: UserDocument = await this.userModel
        .findByIdAndUpdate(id, { ...updateUserDto }, { new: true })
        .exec();
      if (!userDocument) throw new NotFoundException('User not found');
      return await this.findById(id);
    } catch (error: any) {
      this.logger.fatal(error);
      throw new InternalServerErrorException('Failed to update user', error);
    }
  }

  async updatePassword(id: string, newPassword: string) {
    try {
      const hashedPassword = await this.hashPassword(newPassword);
      const userDocument: UserDocument = await this.userModel
        .findByIdAndUpdate(id, { password: hashedPassword }, { new: true })
        .exec();
      if (!userDocument) throw new NotFoundException('User not found');
      return await this.findById(id);
    } catch (error: any) {
      this.logger.fatal(error);
      throw new InternalServerErrorException(
        'Failed to update password',
        error,
      );
    }
  }
}
