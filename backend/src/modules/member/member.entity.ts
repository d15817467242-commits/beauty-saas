import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum MemberLevel {
  NORMAL = 'normal',     // 普通会员
  SILVER = 'silver',     // 银卡会员
  GOLD = 'gold',         // 金卡会员
  DIAMOND = 'diamond',   // 钻石会员
}

export enum MemberCardType {
  BALANCE = 'balance',   // 储值卡
  COUNT = 'count',       // 次卡
}

@Entity('members')
export class Member extends BaseEntity {
  @Column({ nullable: true, name: 'store_id', comment: '所属门店ID' })
  storeId: string;

  @Column({ type: 'text', comment: '会员姓名' })
  name: string;

  @Column({ unique: true, comment: '手机号' })
  phone: string;

  @Column({ nullable: true, comment: '性别' })
  gender: string;

  @Column({ nullable: true, type: 'date', comment: '生日' })
  birthday: Date;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @Column({ type: 'text',
    
    
    default: MemberLevel.NORMAL,
    comment: '会员等级'})
  level: MemberLevel;

  @Column({ type: 'text', default: 0, comment: '积分' })
  points: number;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2, comment: '储值余额' })
  balance: number;

  @Column({ nullable: true, type: 'text', comment: '次卡信息' })
  countCards: Record<string, number>;

  @Column({ nullable: true, type: 'date', name: 'last_visit_at', comment: '最后到店时间' })
  lastVisitAt: Date;

  @Column({ default: 0, name: 'total_spent', type: 'decimal', precision: 10, scale: 2, comment: '累计消费' })
  totalSpent: number;

  @Column({ type: 'text', default: 0, name: 'visit_count', comment: '到店次数' })
  visitCount: number;
}
