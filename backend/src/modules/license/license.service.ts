import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LicenseKey, LicenseStatus } from './license.entity';
import { User } from '../user/user.entity';

@Injectable()
export class LicenseService {
  constructor(
    @InjectRepository(LicenseKey)
    private licenseRepo: Repository<LicenseKey>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // 生成密钥（绑定门店）
  async generateKeys(count: number, storeId: string, remark?: string): Promise<LicenseKey[]> {
    const keys: LicenseKey[] = [];
    for (let i = 0; i < count; i++) {
      const key = 'SHOWBA-' + this.randomSegment() + '-' + this.randomSegment();
      const license = this.licenseRepo.create({ key, storeId, remark: remark || undefined, status: LicenseStatus.UNUSED });
      keys.push(license);
    }
    return this.licenseRepo.save(keys);
  }

  // 验证密钥是否有效
  async validateKey(key: string): Promise<LicenseKey> {
    const license = await this.licenseRepo.findOne({ where: { key } });
    if (!license) throw new BadRequestException('密钥不存在');
    if (license.status === LicenseStatus.USED) throw new BadRequestException('密钥已被使用');
    if (license.status === LicenseStatus.REVOKED) throw new BadRequestException('密钥已作废');
    return license;
  }

  // 使用密钥（注册管理员时调用）
  async useKey(key: string, userId: string): Promise<LicenseKey> {
    const license = await this.validateKey(key);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    license.status = LicenseStatus.USED;
    license.usedBy = user ? user.name : userId;
    license.usedAt = new Date().toISOString();
    return this.licenseRepo.save(license);
  }

  // 作废密钥
  async revokeKey(id: string): Promise<LicenseKey> {
    const license = await this.licenseRepo.findOne({ where: { id } });
    if (!license) throw new NotFoundException('密钥不存在');
    if (license.status === LicenseStatus.USED) throw new BadRequestException('已使用的密钥不能作废');
    license.status = LicenseStatus.REVOKED;
    return this.licenseRepo.save(license);
  }

  // 查询所有密钥
  async findAll(): Promise<any[]> {
    return this.licenseRepo.find({ order: { createdAt: 'DESC' } });
  }

  // 生成4位随机段
  private randomSegment(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}