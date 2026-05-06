import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In, Between } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { BackupConfig, BackupRecord, BackupType, BackupStatus, BackupFormat } from './backup.entity';
import { CreateBackupConfigDto, QueryBackupRecordDto } from './dto/backup.dto';

@Injectable()
export class BackupService {
  private backupDir = path.join(process.cwd(), 'backups');

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    @InjectRepository(BackupConfig)
    private configRepository: Repository<BackupConfig>,
    @InjectRepository(BackupRecord)
    private recordRepository: Repository<BackupRecord>,
  ) {
    // 确保备份目录存在
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // ========== 备份配置管理 ==========

  // 创建备份配置
  async createConfig(dto: CreateBackupConfigDto): Promise<BackupConfig> {
    const config = this.configRepository.create(dto);
    return this.configRepository.save(config);
  }

  // 更新备份配置
  async updateConfig(id: string, dto: Partial<CreateBackupConfigDto>): Promise<BackupConfig> {
    const config = await this.configRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('备份配置不存在');
    }
    Object.assign(config, dto);
    return this.configRepository.save(config);
  }

  // 删除备份配置
  async deleteConfig(id: string): Promise<void> {
    const config = await this.configRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('备份配置不存在');
    }
    await this.configRepository.remove(config);
  }

  // 获取备份配置详情
  async getConfig(id: string): Promise<BackupConfig> {
    const config = await this.configRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('备份配置不存在');
    }
    return config;
  }

  // 获取备份配置列表
  async listConfigs(storeId?: string): Promise<BackupConfig[]> {
    const queryBuilder = this.configRepository.createQueryBuilder('config');
    
    if (storeId) {
      queryBuilder.where('config.storeId = :storeId OR config.storeId IS NULL', { storeId });
    }
    
    return queryBuilder.orderBy('config.createdAt', 'DESC').getMany();
  }

  // 获取启用的自动备份配置
  async getActiveAutoConfigs(): Promise<BackupConfig[]> {
    return this.configRepository.find({ 
      where: { isActive: true, isAuto: true },
      order: { createdAt: 'ASC' }
    });
  }

  // 启用/禁用配置
  async toggleConfig(id: string, isActive: boolean): Promise<BackupConfig> {
    const config = await this.getConfig(id);
    config.isActive = isActive;
    return this.configRepository.save(config);
  }

  // ========== 备份执行 ==========

  // 执行备份
  async executeBackup(
    configId?: string, 
    options?: { 
      type?: BackupType; 
      format?: BackupFormat; 
      tables?: string[];
      triggeredBy?: string;
    }
  ): Promise<BackupRecord> {
    let config: BackupConfig | null = null;
    
    if (configId) {
      config = await this.configRepository.findOne({ where: { id: configId } });
    }
    
    const type = options?.type || config?.type || BackupType.FULL;
    const format = options?.format || config?.format || BackupFormat.JSON;
    const triggeredBy = options?.triggeredBy || 'system';
    
    // 创建备份记录
    const record = this.recordRepository.create({
      configId,
      type,
      format,
      status: BackupStatus.PENDING,
      filename: '',
      filepath: '',
      triggeredBy,
      triggerType: configId ? 'auto' : 'manual',
      startedAt: new Date(),
    });
    await this.recordRepository.save(record);
    
    try {
      // 更新状态为执行中
      record.status = BackupStatus.RUNNING;
      await this.recordRepository.save(record);
      
      // 执行备份
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${type}-${timestamp}.${format}`;
      const filepath = path.join(this.backupDir, filename);
      
      let tables: string[] = [];
      let recordCount = 0;
      
      if (format === BackupFormat.JSON) {
        const result = await this.backupToJson(filepath, options?.tables || config?.includeTables, config?.excludeTables);
        tables = result.tables;
        recordCount = result.recordCount;
      } else if (format === BackupFormat.SQL) {
        const result = await this.backupToSql(filepath, options?.tables || config?.includeTables, config?.excludeTables);
        tables = result.tables;
        recordCount = result.recordCount;
      } else {
        const result = await this.backupToCsv(filepath, options?.tables || config?.includeTables, config?.excludeTables);
        tables = result.tables;
        recordCount = result.recordCount;
      }
      
      // 更新备份记录
      const stats = fs.statSync(filepath);
      record.status = BackupStatus.COMPLETED;
      record.filename = filename;
      record.filepath = filepath;
      record.fileSize = stats.size;
      record.tables = tables;
      record.recordCount = recordCount;
      record.completedAt = new Date();
      record.duration = Math.floor((record.completedAt.getTime() - record.startedAt.getTime()) / 1000);
      
      await this.recordRepository.save(record);
      
      // 更新配置的执行时间
      if (config) {
        config.lastRunAt = new Date();
        await this.configRepository.save(config);
      }
      
      return record;
    } catch (error: any) {
      record.status = BackupStatus.FAILED;
      record.errorMessage = error.message;
      record.completedAt = new Date();
      record.duration = Math.floor((record.completedAt.getTime() - record.startedAt.getTime()) / 1000);
      await this.recordRepository.save(record);
      
      throw error;
    }
  }

  // JSON格式备份
  private async backupToJson(
    filepath: string, 
    includeTables?: string[], 
    excludeTables?: string[]
  ): Promise<{ tables: string[]; recordCount: number }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      let tables = await this.getTableList(queryRunner);
      
      // 过滤表
      if (includeTables && includeTables.length > 0) {
        tables = tables.filter(t => includeTables.includes(t));
      }
      if (excludeTables && excludeTables.length > 0) {
        tables = tables.filter(t => !excludeTables.includes(t));
      }
      
      const backupData: Record<string, any[]> = {};
      let recordCount = 0;
      
      for (const tableName of tables) {
        const rows = await queryRunner.query(`SELECT * FROM ${tableName}`);
        backupData[tableName] = rows;
        recordCount += rows.length;
      }
      
      const jsonContent = JSON.stringify({
        backupTime: new Date().toISOString(),
        version: '1.0',
        tables: backupData,
      }, null, 2);
      
      fs.writeFileSync(filepath, jsonContent, 'utf8');
      
      return { tables, recordCount };
    } finally {
      await queryRunner.release();
    }
  }

  // SQL格式备份
  private async backupToSql(
    filepath: string, 
    includeTables?: string[], 
    excludeTables?: string[]
  ): Promise<{ tables: string[]; recordCount: number }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      let tables = await this.getTableList(queryRunner);
      
      if (includeTables && includeTables.length > 0) {
        tables = tables.filter(t => includeTables.includes(t));
      }
      if (excludeTables && excludeTables.length > 0) {
        tables = tables.filter(t => !excludeTables.includes(t));
      }
      
      let sqlContent = `-- 美业SaaS数据库备份\n`;
      sqlContent += `-- 备份时间: ${new Date().toISOString()}\n\n`;
      
      let recordCount = 0;
      
      for (const tableName of tables) {
        const rows = await queryRunner.query(`SELECT * FROM ${tableName}`);
        recordCount += rows.length;
        
        if (rows.length > 0) {
          sqlContent += `\n-- 表: ${tableName}\n`;
          const columns = Object.keys(rows[0]);
          
          for (const row of rows) {
            const values = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (val instanceof Date) return `'${val.toISOString()}'`;
              return val;
            });
            sqlContent += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          }
        }
      }
      
      fs.writeFileSync(filepath, sqlContent, 'utf8');
      return { tables, recordCount };
    } finally {
      await queryRunner.release();
    }
  }

  // CSV格式备份（每个表一个文件）
  private async backupToCsv(
    dirpath: string, 
    includeTables?: string[], 
    excludeTables?: string[]
  ): Promise<{ tables: string[]; recordCount: number }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      let tables = await this.getTableList(queryRunner);
      
      if (includeTables && includeTables.length > 0) {
        tables = tables.filter(t => includeTables.includes(t));
      }
      if (excludeTables && excludeTables.length > 0) {
        tables = tables.filter(t => !excludeTables.includes(t));
      }
      
      // 创建目录
      if (!fs.existsSync(dirpath)) {
        fs.mkdirSync(dirpath, { recursive: true });
      }
      
      let recordCount = 0;
      
      for (const tableName of tables) {
        const rows = await queryRunner.query(`SELECT * FROM ${tableName}`);
        recordCount += rows.length;
        
        if (rows.length > 0) {
          const columns = Object.keys(rows[0]);
          const csvContent = [
            columns.join(','),
            ...rows.map((row: any) => columns.map(col => {
              const val = row[col];
              if (val === null) return '';
              if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
              return val;
            }).join(','))
          ].join('\n');
          
          fs.writeFileSync(path.join(dirpath, `${tableName}.csv`), csvContent, 'utf8');
        }
      }
      
      return { tables, recordCount };
    } finally {
      await queryRunner.release();
    }
  }

  // 获取表列表
  private async getTableList(queryRunner: any): Promise<string[]> {
    const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    return tables.map((t: any) => t.table_name);
  }

  // ========== 备份恢复 ==========

  // 从备份恢复
  async restoreBackup(id: string, restoredBy?: string): Promise<BackupRecord> {
    const record = await this.recordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('备份记录不存在');
    }
    
    if (record.status !== BackupStatus.COMPLETED) {
      throw new Error('备份未完成，无法恢复');
    }
    
    if (!fs.existsSync(record.filepath)) {
      throw new Error('备份文件不存在');
    }
    
    try {
      if (record.format === BackupFormat.JSON) {
        await this.restoreFromJson(record.filepath);
      } else if (record.format === BackupFormat.SQL) {
        await this.restoreFromSql(record.filepath);
      }
      
      record.isRestored = true;
      record.restoredAt = new Date();
      record.restoredBy = restoredBy || 'system';
      await this.recordRepository.save(record);
      
      return record;
    } catch (error: any) {
      throw new Error(`恢复失败: ${error.message}`);
    }
  }

  // 从JSON恢复
  private async restoreFromJson(filepath: string): Promise<void> {
    const content = fs.readFileSync(filepath, 'utf8');
    const backupData = JSON.parse(content);
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      for (const [tableName, rows] of Object.entries(backupData.tables || {})) {
        await queryRunner.query(`TRUNCATE TABLE ${tableName} CASCADE`);
        
        for (const row of rows as any[]) {
          const columns = Object.keys(row);
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            return val;
          });
          
          await queryRunner.query(
            `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')})`
          );
        }
      }
      
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 从SQL恢复
  private async restoreFromSql(filepath: string): Promise<void> {
    const content = fs.readFileSync(filepath, 'utf8');
    const statements = content.split(';').filter(s => s.trim());
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      for (const statement of statements) {
        if (statement.trim()) {
          await queryRunner.query(statement);
        }
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ========== 备份记录管理 ==========

  // 获取备份记录列表
  async listRecords(query: QueryBackupRecordDto): Promise<{ data: BackupRecord[]; total: number }> {
    const { configId, type, status, startDate, endDate, page = 1, pageSize = 20 } = query;
    
    const queryBuilder = this.recordRepository.createQueryBuilder('record');
    
    if (configId) {
      queryBuilder.andWhere('record.configId = :configId', { configId });
    }
    
    if (type) {
      queryBuilder.andWhere('record.type = :type', { type });
    }
    
    if (status) {
      queryBuilder.andWhere('record.status = :status', { status });
    }
    
    if (startDate && endDate) {
      queryBuilder.andWhere('record.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }
    
    queryBuilder
      .orderBy('record.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    
    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  // 获取备份记录详情
  async getRecord(id: string): Promise<BackupRecord> {
    const record = await this.recordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('备份记录不存在');
    }
    return record;
  }

  // 删除备份记录
  async deleteRecord(id: string): Promise<void> {
    const record = await this.recordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('备份记录不存在');
    }
    
    // 删除文件
    if (fs.existsSync(record.filepath)) {
      fs.unlinkSync(record.filepath);
    }
    
    await this.recordRepository.remove(record);
  }

  // 清理过期备份
  async cleanOldBackups(daysToKeep?: number): Promise<number> {
    const configs = await this.configRepository.find();
    let totalDeleted = 0;
    
    for (const config of configs) {
      const retentionDays = daysToKeep || config.retentionDays || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const records = await this.recordRepository.find({
        where: { configId: config.id },
        order: { createdAt: 'DESC' },
      });
      
      // 保留最大备份数
      const maxBackups = config.maxBackups || 10;
      const toDelete = records.slice(maxBackups).filter(r => r.createdAt < cutoffDate);
      
      for (const record of toDelete) {
        if (fs.existsSync(record.filepath)) {
          fs.unlinkSync(record.filepath);
        }
        await this.recordRepository.remove(record);
        totalDeleted++;
      }
    }
    
    return totalDeleted;
  }

  // ========== 统计 ==========

  // 获取备份统计
  async getStats(): Promise<any> {
    const totalConfigs = await this.configRepository.count();
    const activeConfigs = await this.configRepository.count({ where: { isActive: true } });
    const totalRecords = await this.recordRepository.count();
    const completedRecords = await this.recordRepository.count({ where: { status: BackupStatus.COMPLETED } });
    const failedRecords = await this.recordRepository.count({ where: { status: BackupStatus.FAILED } });
    
    // 计算总备份大小
    const records = await this.recordRepository.find({ where: { status: BackupStatus.COMPLETED } });
    const totalSize = records.reduce((sum, r) => sum + r.fileSize, 0);
    
    // 按类型统计
    const byType = await this.recordRepository
      .createQueryBuilder('record')
      .select('record.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('record.type')
      .getRawMany();
    
    return {
      totalConfigs,
      activeConfigs,
      totalRecords,
      completedRecords,
      failedRecords,
      totalSize,
      byType,
    };
  }

  // 获取数据库统计
  async getDatabaseStats(): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      const tables = await this.getTableList(queryRunner);
      const stats: Record<string, { count: number }> = {};
      
      for (const tableName of tables) {
        const countResult = await queryRunner.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        stats[tableName] = { count: countResult[0].count };
      }
      
      const dbSize = await queryRunner.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
      
      return {
        tables: stats,
        totalTables: tables.length,
        databaseSize: dbSize[0]?.size || 'Unknown',
      };
    } finally {
      await queryRunner.release();
    }
  }
}
