import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../user/user.entity';
import { Store } from '../store/store.entity';
import { UserStore } from '../user/entities/user-store.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(UserStore)
    private userStoreRepository: Repository<UserStore>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, phone: string, password: string): Promise<any> {
    // 优先用 username 精确匹配，避免多个帐号共享手机号时匹配错误
    let user = await this.userRepository.findOne({ where: { username } });
    if (!user && phone) {
      user = await this.userRepository.findOne({ where: { phone } });
    }
    if (!user) throw new UnauthorizedException('用户不存在');
    if (phone && user.phone !== phone) throw new UnauthorizedException('手机号不匹配');

    // 支持 bcrypt 加密密码和明文密码
    const isBcrypt = user.password.startsWith('$2');
    const isMatch = isBcrypt
      ? await bcrypt.compare(password, user.password)
      : user.password === password;
    if (!isMatch) throw new UnauthorizedException('密码错误');

    if (user.isActive === '0' || user.isActive === 0 || user.isActive === false) throw new UnauthorizedException('帐号待审核，请等待管理员审核后登录');
    return user;
  }

  async login(user: User) {
    // 根据角色确定门店列表
    let storeList: { id: string; name: string }[] = [];
    let storeId: string | null = null;
    let storeName: string | null = null;

    if (user.role === UserRole.SUPERADMIN) {
      // 服务商：看所有门店
      const stores = await this.storeRepository.find();
      storeList = stores.map(s => ({ id: s.id, name: s.name }));
    } else if (user.role === UserRole.ADMIN) {
      // 连锁管理员：看自己关联的门店
      const userStores = await this.userStoreRepository.find({ where: { userId: user.id } });
      if (userStores.length > 0) {
        const storeIds = userStores.map(us => us.storeId);
        const stores = await this.storeRepository.find({ where: { id: In(storeIds) } });
        storeList = stores.map(s => ({ id: s.id, name: s.name }));
        storeId = storeList[0]?.id || null;
        storeName = storeList[0]?.name || null;
      }
    } else {
      // 店长/收银员/员工：只看绑定的门店
      if (user.storeId) {
        const store = await this.storeRepository.findOne({ where: { id: user.storeId } });
        storeName = store?.name || null;
        storeId = user.storeId;
        storeList = storeId ? [{ id: storeId, name: storeName || '' }] : [];
      }
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      storeId,
      storeName,
    };

    const permissions = this.getPermissions(user.role);

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        storeId,
        storeName,
      },
      storeList,
      permissions,
    };
  }

  private getPermissions(role: string): string[] {
    const permissionMap: Record<string, string[]> = {
      superadmin: ['all'],
      admin: ['store:manage', 'member:manage', 'employee:manage', 'cashier:manage', 'service:manage', 'appointment:manage', 'report:view', 'inventory:manage', 'sms:manage'],
      manager: ['store:view', 'member:manage', 'employee:view', 'cashier:manage', 'service:view', 'appointment:manage', 'report:view', 'inventory:view'],
      cashier: ['cashier:manage', 'member:view', 'appointment:view'],
      employee: ['member:view', 'appointment:view', 'service:view'],
    };
    return permissionMap[role] || [];
  }
}
