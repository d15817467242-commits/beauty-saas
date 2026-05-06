import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum MiniappUserStatus {
  ACTIVE = 'active',       // 正常
  BANNED = 'banned',       // 禁用
}

@Entity('miniapp_users')
@Index(['openid'], { unique: true })
@Index(['unionid'])
@Index(['phone'])
export class MiniappUser extends BaseEntity {
  @Column({ type: 'text', comment: '微信openid' })
  openid: string;

  @Column({ nullable: true, comment: '微信unionid' })
  unionid: string;

  @Column({ nullable: true, comment: '手机号' })
  phone: string;

  @Column({ nullable: true, comment: '昵称' })
  nickname: string;

  @Column({ nullable: true, comment: '头像URL' })
  avatar: string;

  @Column({ nullable: true, comment: '性别(0未知1男2女)' })
  gender: number;

  @Column({ nullable: true, comment: '国家' })
  country: string;

  @Column({ nullable: true, comment: '省份' })
  province: string;

  @Column({ nullable: true, comment: '城市' })
  city: string;

  @Column({ nullable: true, comment: '语言' })
  language: string;

  @Column({ name: 'member_id', nullable: true, comment: '关联会员ID' })
  memberId: string;

  @Column({ type: 'text',
    
    
    default: MiniappUserStatus.ACTIVE,
    comment: '状态'})
  status: MiniappUserStatus;

  @Column({ type: 'datetime', nullable: true, name: 'last_login_at', comment: '最后登录时间' })
  lastLoginAt: Date;

  @Column({ nullable: true, name: 'last_login_ip', comment: '最后登录IP' })
  lastLoginIp: string;

  @Column({ type: 'int', default: 0, name: 'login_count', comment: '登录次数' })
  loginCount: number;
}
