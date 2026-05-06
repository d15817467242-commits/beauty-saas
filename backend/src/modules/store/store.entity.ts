import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum StoreStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance'}

@Entity('stores')
export class Store extends BaseEntity {
  @Column({ unique: true, comment: '门店编码' })
  code: string;

  @Column({ type: 'text', comment: '门店名称' })
  name: string;

  @Column({ nullable: true, comment: '门店Logo' })
  logo: string;

  @Column({ nullable: true, comment: '联系电话' })
  phone: string;

  @Column({ nullable: true, comment: '联系邮箱' })
  email: string;

  @Column({ nullable: true, comment: '省份' })
  province: string;

  @Column({ nullable: true, comment: '城市' })
  city: string;

  @Column({ nullable: true, comment: '区县' })
  district: string;

  @Column({ nullable: true, comment: '详细地址' })
  address: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 7, comment: '经度' })
  longitude: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 7, comment: '纬度' })
  latitude: number;

  @Column({ nullable: true, comment: '营业时间' })
  businessHours: string;

  @Column({ nullable: true, type: 'text', comment: '门店简介' })
  description: string;

  @Column({ type: 'text',
    
    
    default: StoreStatus.ACTIVE,
    comment: '门店状态'})
  status: StoreStatus;

  @Column({ type: 'int', default: 1, name: 'is_headquarters', comment: '是否总部' })
  isHeadquarters: boolean;

  @Column({ nullable: true, name: 'parent_id', comment: '上级门店ID' })
  parentId: string;

  @Column({ nullable: true, name: 'manager_id', comment: '店长ID' })
  managerId: string;

  @Column({ nullable: true, name: 'manager_name', comment: '店长姓名' })
  managerName: string;

  @Column({ type: 'int', default: 0, name: 'max_employees', comment: '最大员工数' })
  maxEmployees: number;

  @Column({ type: 'int', default: 0, name: 'max_appointments', comment: '每日最大预约数' })
  maxAppointments: number;

  @Column({ nullable: true, type: 'text', comment: '门店配置' })
  config: Record<string, any>;

  @Column({ nullable: true, type: 'text', comment: '扩展信息' })
  extra: Record<string, any>;
}

@Entity('store_configs')
export class StoreConfig extends BaseEntity {
  @Column({ name: 'store_id', comment: '门店ID' })
  storeId: string;

  @Column({ unique: true, comment: '配置键' })
  key: string;

  @Column({ type: 'text', comment: '配置值' })
  value: string;

  @Column({ nullable: true, comment: '配置描述' })
  description: string;

  @Column({ nullable: true, comment: '配置类型' })
  type: string; // string, number, boolean, json
}
