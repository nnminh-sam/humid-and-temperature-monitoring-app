import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { UserService } from './user.service';
import { RequestedUser } from 'src/decorator/request-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import * as dotenv from 'dotenv';
dotenv.config();

const resourcePath: string = `${process.env.API_PREFIX}/${process.env.API_VERSION}/users`;

@Controller(resourcePath)
@UseGuards(JwtGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('my')
  async findProfile(@RequestedUser() user: any) {
    return await this.userService.findById(user.id);
  }

  @Patch()
  async update(
    @RequestedUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(user.id, updateUserDto);
  }
}
