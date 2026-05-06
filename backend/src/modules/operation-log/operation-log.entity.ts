import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  IMPORT = 'import',
  BACKUP = 'backup',
  RESTORE = 'restore'}

@Entity('operation_logs')
export class OperationLog extends BaseEntity {
  @Column({ type: 'text', comment: '操作用户ID' })
  userId: string;

  @Column({ nullable: true, comment: '操作用户名' })
  userName: string;

  @Column({ type: 'text',
    
    
    comment: '操作类型'})
  operationType: OperationType;

  @Column({ type: 'text', comment: '操作模块' })
  module: string;

  @Column({ type: 'text', comment: '操作描述' })
  description: string;

  @Column({ nullable: true, comment: '请求方法' })
  method: string;

  @Column({ nullable: true, comment: '请求路径' })
  path: string;

  @Column({ nullable: true, type: 'text', comment: '请求参数' })
  params: Record<string, any>;

  @Column({ nullable: true, type: 'text', comment: '响应结果' })
  result: Record<string, any>;

  @Column({ nullable: true, comment: 'IP地址' })
  ip: string;

  @Column({ nullable: true, comment: '用户代理' })
  userAgent: string;

  @Column({ type: 'text', default: true, name: 'is_success', comment: '是否成功' })
  isSuccess: boolean;

  @Column({ nullable: true, name: 'error_message', comment: '错误信息' })
  errorMessage: string;

  @Column({ type: 'text', default: 0, name: 'duration', comment: '执行时长(ms)' })
  duration: number;
}
