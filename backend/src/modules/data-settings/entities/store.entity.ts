import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, comment: '门店名称' })
  name: string;

  @Column({ length: 50, unique: true, comment: '门店编码' })
  code: string;

  @Column({ type: 'text', nullable: true, comment: '门店地址' })
  address?: string;

  @Column({ length: 20, nullable: true, comment: '联系电话' })
  phone?: string;

  @Column({ length: 50, nullable: true, comment: '负责人' })
  manager?: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true, comment: '经度' })
  longitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true, comment: '纬度' })
  latitude?: number;

  @Column({ type: 'text', nullable: true, comment: '营业时间设置' })
  businessHours?: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isOpen: boolean;
  }[];

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'text', nullable: true, comment: '门店简介' })
  description?: string;

  @Column({ type: 'text', nullable: true, comment: '门店图片' })
  images?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
