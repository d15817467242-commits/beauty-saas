import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('system_configs')
export class SystemConfig extends BaseEntity {
  @Column({ unique: true, comment: '配置键' })
  key: string;

  @Column({ type: 'text', comment: '配置值' })
  value: string;

  @Column({ nullable: true, comment: '配置描述' })
  description: string;

  @Column({ nullable: true, comment: '配置分组' })
  group: string;

  @Column({ nullable: true, comment: '配置类型' })
  type: string;  // string, number, boolean, json

  @Column({ type: 'int', default: 1, name: 'is_public', comment: '是否公开' })
  isPublic: boolean;
}
