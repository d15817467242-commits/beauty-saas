
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/user.entity';
import { DefaultRolePermissions } from './role.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { username } });
    
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    
    // 修复：检查 isActive 字段，兼容文本和布尔值
    const isActive = 
      user.isActive === true || user.isActive === 1 || user.isActive === '1' || user.isActive === '1.0';
    
    if (!isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: User) {
    // 获取用户权限
    const roleKey = user.role as string;
    const permissions = (DefaultRolePermissions as Record<string, string[]>)[roleKey] || [];
    
    const payload = { 
      sub: user.id, 
      username: user.username,
      role: user.role,
      name: user.name,
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      permissions,
    };
  }
}
