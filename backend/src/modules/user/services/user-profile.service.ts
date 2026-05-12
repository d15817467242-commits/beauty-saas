import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { UserSetting } from '../entities/user-setting.entity';
import { UpdateProfileDto, ChangePasswordDto, UpdateThemeDto } from '../dto/profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSetting)
    private settingRepository: Repository<UserSetting>,
  ) {}

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'name', 'phone', 'avatar', 'role', 'isActive', 'createdAt', 'updatedAt'],
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    Object.assign(user, dto);
    const saved = await this.userRepository.save(user);
    delete (saved as any).password;
    return saved;
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const isValid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('旧密码错误');
    }
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('两次密码输入不一致');
    }
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);
  }

  async getSettings(userId: string): Promise<UserSetting> {
    let settings = await this.settingRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = this.settingRepository.create({
        userId,
        theme: 'light',
        primaryColor: '#1890ff',
        fontSize: 'medium',
        layout: 'side',
        language: 'zh-CN',
        notifications: '{"email":true,"sms":true,"push":true}',
      });
      await this.settingRepository.save(settings);
    }
    // SQLite存储JSON为字符串，前端需要对象
    if (typeof settings.notifications === 'string') {
      try {
        (settings as any).notifications = JSON.parse(settings.notifications);
      } catch {
        (settings as any).notifications = { email: true, sms: true, push: true };
      }
    }
    return settings;
  }

  async updateTheme(userId: string, dto: UpdateThemeDto): Promise<UserSetting> {
    let settings = await this.settingRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = this.settingRepository.create({ userId });
    }
    Object.assign(settings, dto);
    const saved = await this.settingRepository.save(settings);
    // 返回时解析notifications为对象
    if (typeof saved.notifications === 'string') {
      try {
        (saved as any).notifications = JSON.parse(saved.notifications);
      } catch {
        (saved as any).notifications = { email: true, sms: true, push: true };
      }
    }
    return saved;
  }

  async updateNotifications(
    userId: string,
    notifications: { email?: boolean; sms?: boolean; push?: boolean }
  ): Promise<UserSetting> {
    let settings = await this.settingRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = this.settingRepository.create({ userId });
    }
    let currentNotifications: any = settings.notifications;
    if (typeof currentNotifications === 'string') {
      try {
        currentNotifications = JSON.parse(currentNotifications);
      } catch {
        currentNotifications = { email: true, sms: true, push: true };
      }
    }
    settings.notifications = JSON.stringify({ ...currentNotifications, ...notifications });
    const saved = await this.settingRepository.save(settings);
    // 返回时解析为对象
    if (typeof saved.notifications === 'string') {
      try {
        (saved as any).notifications = JSON.parse(saved.notifications);
      } catch {
        (saved as any).notifications = { email: true, sms: true, push: true };
      }
    }
    return saved;
  }

  async updateLanguage(userId: string, language: string): Promise<UserSetting> {
    let settings = await this.settingRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = this.settingRepository.create({ userId });
    }
    settings.language = language;
    return this.settingRepository.save(settings);
  }
}
