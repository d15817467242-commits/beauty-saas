import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum BackupType {
  FULL = 'full',         // 全量备份
  INCREMENTAL = 'incremental', // 增量备份
  TABLE = 'table',       // 单表备份
}

export enum BackupStatus {
  PENDING = 'pending',   // 待执行
  RUNNING = 'running',   // 执行中
  COMPLETED = 'completed', // 已完成
  FAILED = 'failed',     // 失败
}

export enum BackupFormat {
  SQL = 'sql',
  JSON = 'json',
  CSV = 'csv'}

@Entity('backup_configs')
export class BackupConfig extends BaseEntity {
  @Column({ name: 'store_id', nullable: true, comment: '门店ID' })
  storeId: string;

  @Column({ type: 'text', comment: '配置名称' })
  name: string;

  @Column({ type: 'text',
    
    
    default: BackupType.FULL,
    comment: '备份类型'})
  type: BackupType;

  @Column({ type: 'text',
    
    
    default: BackupFormat.JSON,
    comment: '备份格式'})
  format: BackupFormat;

  @Column({ type: 'int', default: 1, name: 'is_auto', comment: '是否自动备份' })
  isAuto: boolean;

  @Column({ type: 'text', default: '0 2 * * *', name: 'cron_expression', comment: 'Cron表达式' })
  cronExpression: string;

  @Column({ type: 'int', default: 30, name: 'retention_days', comment: '保留天数' })
  retentionDays: number;

  @Column({ type: 'int', default: 10, name: 'max_backups', comment: '最大备份数' })
  maxBackups: number;

  @Column({ nullable: true, type: 'text', name: 'include_tables', comment: '包含的表' })
  includeTables: string; // JSON string

  @Column({ nullable: true, type: 'text', name: 'exclude_tables', comment: '排除的表' })
  excludeTables: string; // JSON string

  @Column({ nullable: true, name: 'storage_path', comment: '存储路径' })
  storagePath: string;

  @Column({ nullable: true, name: 'notify_email', comment: '通知邮箱' })
  notifyEmail: string;

  @Column({ type: 'int', default: 1, name: 'notify_on_success', comment: '成功时通知' })
  notifyOnSuccess: boolean;

  @Column({ type: 'int', default: 1, name: 'notify_on_failure', comment: '失败时通知' })
  notifyOnFailure: boolean;

  @Column({ type: 'int', default: 1, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ nullable: true, name: 'last_run_at', comment: '上次执行时间' })
  lastRunAt: Date;

  @Column({ nullable: true, name: 'next_run_at', comment: '下次执行时间' })
  nextRunAt: Date;

  @Column({ nullable: true, type: 'text', comment: '扩展配置' })
  extra: Record<string, any>;
}

@Entity('backup_records')
export class BackupRecord extends BaseEntity {
  @Column({ name: 'config_id', nullable: true, comment: '配置ID' })
  configId: string;

  @Column({ type: 'text',
    
    
    comment: '备份类型'})
  type: BackupType;

  @Column({ type: 'text',
    
    
    comment: '备份格式'})
  format: BackupFormat;

  @Column({ type: 'text',
    
    
    default: BackupStatus.PENDING,
    comment: '备份状态'})
  status: BackupStatus;

  @Column({ type: 'text', comment: '备份文件名' })
  filename: string;

  @Column({ type: 'text', comment: '备份文件路径' })
  filepath: string;

  @Column({ type: 'int', default: 0, name: 'file_size', comment: '文件大小(字节)' })
  fileSize: number;

  @Column({ nullable: true, type: 'text', name: 'tables', comment: '备份的表' })
  tables: string; // JSON string

  @Column({ type: 'int', default: 0, name: 'record_count', comment: '记录数' })
  recordCount: number;

  @Column({ nullable: true, name: 'started_at', comment: '开始时间' })
  startedAt: Date;

  @Column({ nullable: true, name: 'completed_at', comment: '完成时间' })
  completedAt: Date;

  @Column({ type: 'int', default: 0, name: 'duration', comment: '耗时(秒)' })
  duration: number;

  @Column({ nullable: true, name: 'error_message', comment: '错误信息' })
  errorMessage: string;

  @Column({ nullable: true, name: 'triggered_by', comment: '触发者' })
  triggeredBy: string;

  @Column({ nullable: true, name: 'trigger_type', comment: '触发类型(manual/auto)' })
  triggerType: string;

  @Column({ type: 'int', default: 0, name: 'is_restored', comment: '是否已恢复' })
  isRestored: boolean;

  @Column({ nullable: true, name: 'restored_at', comment: '恢复时间' })
  restoredAt: Date;

  @Column({ nullable: true, name: 'restored_by', comment: '恢复者' })
  restoredBy: string;

  @Column({ nullable: true, type: 'text', comment: '元数据' })
  metadata: Record<string, any>;
}
