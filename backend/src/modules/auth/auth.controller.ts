import { Controller, Post, Body, Get, UseGuards, Req, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { LicenseService } from '../license/license.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { UserRole } from '../user/user.entity';

class LoginDto {
  @IsString() username: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() password: string;
}

class RegisterDto {
  @IsNotEmpty({ message: '请输入用户名' }) @IsString() username: string;
  @IsNotEmpty({ message: '请输入姓名' }) @IsString() name: string;
  @IsNotEmpty({ message: '请输入手机号' }) @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' }) phone: string;
  @IsNotEmpty({ message: '请输入密码' }) @IsString() password: string;
  @IsOptional() @IsString() licenseKey?: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly licenseService: LicenseService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.username, dto.phone || '', dto.password);
    return this.authService.login(user);
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    // 检查手机号是否已注册
    const existing = await this.userService.findByPhone(dto.phone);
    if (existing) {
      throw new BadRequestException('该手机号已注册，请直接登录');
    }

    // 检查用户名是否已存在
    const existingUsername = await this.userService.findByUsername(dto.username);
    if (existingUsername) {
      throw new BadRequestException('该用户名已被使用');
    }

    if (dto.licenseKey) {
      // 用密钥注册 → 成为管理员（admin），密钥必须有效
      const license = await this.licenseService.validateKey(dto.licenseKey);
      if (!license) {
        throw new BadRequestException('密钥无效或已使用');
      }
      const user = await this.userService.create({
        ...dto,
        role: UserRole.ADMIN,
        storeId: license.storeId,
      });
      await this.licenseService.useKey(dto.licenseKey, user.id);
      if (license.storeId) {
        await this.userService.addUserStore(user.id, license.storeId);
      }
      return this.authService.login(user);
    }

    // 无密钥注册 → 默认员工（employee），必须由管理员后续分配门店
    const user = await this.userService.create({
      ...dto,
      role: UserRole.EMPLOYEE,
      isActive: '0',
    });
    // 注册成功但不自动登录，需要管理员审核后才能使用
    return {
      message: '注册成功，请等待管理员审核后登录',
      userId: user.id,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    return req.user;
  }

  // 重置密码：只有管理员可以重置其他人的密码
  @UseGuards(JwtAuthGuard)
  @Post('reset-password')
  async resetPassword(
    @Body() body: { userId: string; newPassword: string },
    @Req() req: any,
  ) {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以重置密码');
    }
    await this.userService.update(body.userId, { password: body.newPassword });
    return { message: '密码重置成功' };
  }
}
