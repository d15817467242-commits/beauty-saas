import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DefaultRolePermissions, RoleCode } from '../role.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'meiye-saas-secret-key'),
    });
  }

  async validate(payload: any) {
    // 根据角色获取权限列表
    const roleCode = payload.role as RoleCode;
    const permissions = DefaultRolePermissions[roleCode] || [];
    
    return { 
      userId: payload.sub, 
      username: payload.username,
      role: payload.role,
      name: payload.name,
      permissions,
    };
  }
}
