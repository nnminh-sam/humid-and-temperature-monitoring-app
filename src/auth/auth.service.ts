import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticationDto } from './dto/authentication.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { JwtClaims } from './dto/jwt-claim.dto';
import { AuthorizedResponse } from './dto/authorized-response.dto';
import { User } from 'src/user/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
const bcrypt = require('bcryptjs');

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  private async generateToken(payload: JwtClaims): Promise<AuthorizedResponse> {
    return { accessToken: this.jwtService.sign({ ...payload }) };
  }

  private isTokenExpired(exp: number) {
    const currentTime: number = Math.floor(Date.now() / 1000);
    return currentTime > exp;
  }

  async validateToken(token: string) {
    try {
      const claims: any = this.jwtService.decode(token);
      const expiredToken = this.isTokenExpired(claims.exp);
      if (expiredToken) {
        throw new BadRequestException('Token expired');
      }
    } catch (error: any) {
      throw new BadRequestException(
        error.message === 'Token expired' ? error.message : 'Invalid token',
      );
    }
    return { accessToken: token };
  }

  async validateUser({ email, password }: AuthenticationDto) {
    const userDetail = await this.userService.findUserDetailByEmail(email);
    if (!userDetail) throw new NotFoundException('User not found');

    const isPasswordMatch = await bcrypt.compare(password, userDetail.password);
    if (!isPasswordMatch) throw new BadRequestException('Invalid password');

    return userDetail;
  }

  async authenticate(user: any): Promise<AuthorizedResponse> {
    const payload: JwtClaims = {
      email: user.email,
      id: user.id,
    };
    return await this.generateToken(payload);
  }

  async registrate(createUserDto: CreateUserDto) {
    const newUser: User = await this.userService.create(createUserDto);
    return await this.authenticate(newUser);
  }

  async changePassword(
    requestUserId: string,
    changePasswordDto: ChangePasswordDto,
  ) {
    const userDetail = await this.userService.findUserDetailById(requestUserId);
    const isPasswordMatch = await bcrypt.compare(
      changePasswordDto.oldPassword,
      userDetail.password,
    );
    if (!isPasswordMatch) throw new BadRequestException('Invalid password');

    return await this.userService.updatePassword(
      requestUserId,
      changePasswordDto.newPassword,
    );
  }
}
