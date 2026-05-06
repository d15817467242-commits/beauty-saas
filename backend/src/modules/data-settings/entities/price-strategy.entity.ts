import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('price_strategies')
export class PriceStrategy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, comment: '策略名称' })
  name: string;

  @Column({ length: 50, unique: true, comment: '策略编码' })
  code: string;

  @Column({ type: 'text', default: 'fixed', comment: '策略类型' })
  type: 'fixed' | 'percentage' | 'member_level' | 'time_based';

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '固定金额/折扣值' })
  value?: number;

  @Column({ type: 'text', nullable: true, comment: '会员等级价格设置' })
  memberLevelPrices?: {
    level: string;
    discount: number;
    fixedPrice?: number;
  }[];

  @Column({ type: 'text', nullable: true, comment: '时段价格设置' })
  timeBasedPrices?: {
    startTime: string;
    endTime: string;
    discount: number;
    daysOfWeek?: number[];
  }[];

  @Column({ type: 'text', default: 0, comment: '排序' })
  sort: number;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
