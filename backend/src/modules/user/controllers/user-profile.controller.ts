import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { UserProfileService } from '../services/user-profile.service';
import { UpdateProfileDto, ChangePasswordDto, UpdateThemeDto } from '../dto/profile.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../user.entity';
import { UserSetting } from '../entities/user-setting.entity';

@Controller('user')
export class UserProfileController {
  constructor(private readonly service: UserProfileService) {}

  // ========== 个人中心 ==========

  @Get('profile')
  getProfile(@CurrentUser('id') userId: string): Promise<User> {
    return this.service.getProfile(userId);
  }

  @Put('profile')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto
  ): Promise<User> {
    return this.service.updateProfile(userId, dto);
  }

  // ========== 密码管理 ==========

  @Put('password')
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto
  ): Promise<{ success: boolean }> {
    await this.service.changePassword(userId, dto);
    return { success: true };
  }

  // ========== 主题设置 ==========

  @Get('settings')
  getSettings(@CurrentUser('id') userId: string): Promise<UserSetting> {
    return this.service.getSettings(userId);
  }

  @Put('theme')
  updateTheme(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateThemeDto
  ): Promise<UserSetting> {
    return this.service.updateTheme(userId, dto);
  }

  @Put('notifications')
  updateNotifications(
    @CurrentUser('id') userId: string,
    @Body() notifications: { email?: boolean; sms?: boolean; push?: boolean }
  ): Promise<UserSetting> {
    return this.service.updateNotifications(userId, notifications);
  }

  @Put('language')
  updateLanguage(
    @CurrentUser('id') userId: string,
    @Body('language') language: string
  ): Promise<UserSetting> {
    return this.service.updateLanguage(userId, language);
  }
}
