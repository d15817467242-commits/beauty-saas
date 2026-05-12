import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('user_stores')
export class UserStore extends BaseEntity {
  @Column({ name: 'user_id', comment: '用户ID' })
  userId: string;

  @Column({ name: 'store_id', comment: '门店ID' })
  storeId: string;
}
