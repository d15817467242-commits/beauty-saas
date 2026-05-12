import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, comment: '房间名称' })
  name: string;

  @Column({ length: 50, unique: true, nullable: true, comment: '房间编码' })
  code: string;

  @Column({ type: 'text', default: 'room', comment: '类型: room=房间, bed=床位, chair=座位' })
  type: 'room' | 'bed' | 'chair';

  @Column({ nullable: true, comment: '所属房间ID（床位/座位用）' })
  parentId?: string;

  @Column({ nullable: true, comment: '门店ID' })
  storeId?: string;

  @Column({ type: 'int', default: 1, comment: '容纳人数' })
  capacity: number;

  @Column({ type: 'text', default: 'available', comment: '状态' })
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';

  @Column({ type: 'text', nullable: true, comment: '设施设备' })
  facilities?: string[];

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark?: string;

  @Column({ type: 'text', default: 0, comment: '排序' })
  sort: number;

  @Column({ type: 'boolean', default: true, comment: '是否启用' })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
