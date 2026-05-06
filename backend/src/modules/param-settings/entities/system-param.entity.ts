import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_params')
export class SystemParam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true, comment: '参数键名' })
  key: string;

  @Column({ type: 'text', comment: '参数值' })
  value: string;

  @Column({ length: 50, comment: '参数分组' })
  group: string;

  @Column({ length: 100, nullable: true, comment: '参数名称' })
  name?: string;

  @Column({ type: 'text', nullable: true, comment: '参数说明' })
  description?: string;

  @Column({ length: 20, default: 'string', comment: '值类型: string/number/boolean/json' })
  valueType: string;

  @Column({ type: 'text', nullable: true, comment: '可选值列表' })
  options?: string; // JSON string

  @Column({ type: 'int', default: 0, comment: '是否系统参数' })
  isSystem: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
