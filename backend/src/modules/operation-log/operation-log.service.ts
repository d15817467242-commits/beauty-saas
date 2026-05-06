import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Like } from 'typeorm';
import { OperationLog, OperationType } from './operation-log.entity';
import { CreateOperationLogDto, QueryOperationLogDto } from './dto/operation-log.dto';
import * as fs from 'fs';
import * as path from 'path';

export interface OperationLogStats {
  total: number;
  success: number;
  failed: number;
  byType: Array<{ type: string; count: number }>;
  byModule: Array<{ module: string; count: number }>;
  byUser: Array<{ userId: string; userName: string; count: number }>;
  dailyTrend: Array<{ date: string; count: number; success: number; failed: number }>;
}

@Injectable()
export class OperationLogService {
  constructor(
    @InjectRepository(OperationLog)
    private logRepository: Repository<OperationLog>,
  ) {}

  // 创建操作日志
  async create(dto: CreateOperationLogDto): Promise<OperationLog> {
    const log = this.logRepository.create(dto);
    return this.logRepository.save(log);
  }

  // 批量创建操作日志
  async createMany(dtos: CreateOperationLogDto[]): Promise<OperationLog[]> {
    const logs = this.logRepository.create(dtos);
    return this.logRepository.save(logs);
  }

  // 获取操作日志详情
  async get(id: string): Promise<OperationLog | null> {
    return this.logRepository.findOne({ where: { id } });
  }

  // 查询操作日志列表
  async query(query: QueryOperationLogDto): Promise<{ data: OperationLog[]; total: number }> {
    const { 
      userId, 
      operationType, 
      module, 
      isSuccess, 
      keyword,
      startDate, 
      endDate, 
      page = 1, 
      pageSize = 20 
    } = query;
    
    const queryBuilder = this.logRepository.createQueryBuilder('log');
    
    if (userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId });
    }
    
    if (operationType) {
      queryBuilder.andWhere('log.operationType = :operationType', { operationType });
    }
    
    if (module) {
      queryBuilder.andWhere('log.module = :module', { module });
    }
    
    if (isSuccess !== undefined) {
      queryBuilder.andWhere('log.isSuccess = :isSuccess', { isSuccess });
    }
    
    if (keyword) {
      queryBuilder.andWhere(
        '(log.description LIKE :keyword OR log.userName LIKE :keyword)',
        { keyword: `%${keyword}%` }
      );
    }
    
    if (startDate && endDate) {
      queryBuilder.andWhere('log.createdAt BETWEEN :startDate AND :endDate', { 
        startDate, 
        endDate 
      });
    } else if (startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', { endDate });
    }
    
    queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    
    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  // 获取最近的操作日志
  async getRecent(limit: number = 100): Promise<OperationLog[]> {
    return this.logRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // 获取用户的操作日志
  async getByUser(userId: string, limit: number = 50): Promise<OperationLog[]> {
    return this.logRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // 删除操作日志
  async delete(id: string): Promise<void> {
    await this.logRepository.delete({ id });
  }

  // 批量删除操作日志
  async deleteMany(ids: string[]): Promise<void> {
    await this.logRepository.delete({ id: In(ids) });
  }

  // 清理过期日志
  async cleanOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await this.logRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();
    
    return result.affected || 0;
  }

  // ========== 统计分析 ==========

  // 获取操作日志统计
  async getStats(startDate?: Date, endDate?: Date): Promise<OperationLogStats> {
    const queryBuilder = this.logRepository.createQueryBuilder('log');
    
    if (startDate && endDate) {
      queryBuilder.where('log.createdAt BETWEEN :startDate AND :endDate', { 
        startDate, 
        endDate 
      });
    } else if (startDate) {
      queryBuilder.where('log.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.where('log.createdAt <= :endDate', { endDate });
    }
    
    // 总数
    const total = await queryBuilder.getCount();
    
    // 成功数
    const success = await queryBuilder.clone().andWhere('log.isSuccess = :isSuccess', { isSuccess: true }).getCount();
    
    // 失败数
    const failed = await queryBuilder.clone().andWhere('log.isSuccess = :isSuccess', { isSuccess: false }).getCount();
    
    // 按类型统计
    const byType = await this.logRepository
      .createQueryBuilder('log')
      .select('log.operationType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.operationType')
      .getRawMany();
    
    // 按模块统计
    const byModule = await this.logRepository
      .createQueryBuilder('log')
      .select('log.module', 'module')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.module')
      .getRawMany();
    
    // 按用户统计（Top 10）
    const byUser = await this.logRepository
      .createQueryBuilder('log')
      .select('log.userId', 'userId')
      .addSelect('log.userName', 'userName')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.userId')
      .addGroupBy('log.userName')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();
    
    // 每日趋势（最近30天）
    const dailyTrend = await this.logRepository
      .createQueryBuilder('log')
      .select("DATE(log.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect("SUM(CASE WHEN log.isSuccess = true THEN 1 ELSE 0 END)", 'success')
      .addSelect("SUM(CASE WHEN log.isSuccess = false THEN 1 ELSE 0 END)", 'failed')
      .groupBy("DATE(log.createdAt)")
      .orderBy("DATE(log.createdAt)", 'DESC')
      .limit(30)
      .getRawMany();
    
    return { total, success, failed, byType, byModule, byUser, dailyTrend };
  }

  // 获取模块操作统计
  async getModuleStats(module: string, startDate?: Date, endDate?: Date): Promise<any> {
    const queryBuilder = this.logRepository.createQueryBuilder('log')
      .where('log.module = :module', { module });
    
    if (startDate && endDate) {
      queryBuilder.andWhere('log.createdAt BETWEEN :startDate AND :endDate', { 
        startDate, 
        endDate 
      });
    }
    
    const total = await queryBuilder.getCount();
    const success = await queryBuilder.clone().andWhere('log.isSuccess = :isSuccess', { isSuccess: true }).getCount();
    const failed = await queryBuilder.clone().andWhere('log.isSuccess = :isSuccess', { isSuccess: false }).getCount();
    
    // 平均执行时长
    const avgDuration = await this.logRepository
      .createQueryBuilder('log')
      .select('AVG(log.duration)', 'avg')
      .where('log.module = :module', { module })
      .getRawOne();
    
    return {
      module,
      total,
      success,
      failed,
      avgDuration: avgDuration?.avg || 0,
    };
  }

  // 获取用户操作统计
  async getUserStats(userId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const queryBuilder = this.logRepository.createQueryBuilder('log')
      .where('log.userId = :userId', { userId });
    
    if (startDate && endDate) {
      queryBuilder.andWhere('log.createdAt BETWEEN :startDate AND :endDate', { 
        startDate, 
        endDate 
      });
    }
    
    const total = await queryBuilder.getCount();
    const success = await queryBuilder.clone().andWhere('log.isSuccess = :isSuccess', { isSuccess: true }).getCount();
    const failed = await queryBuilder.clone().andWhere('log.isSuccess = :isSuccess', { isSuccess: false }).getCount();
    
    // 按模块统计
    const byModule = await this.logRepository
      .createQueryBuilder('log')
      .select('log.module', 'module')
      .addSelect('COUNT(*)', 'count')
      .where('log.userId = :userId', { userId })
      .groupBy('log.module')
      .getRawMany();
    
    return {
      userId,
      total,
      success,
      failed,
      byModule,
    };
  }

  // ========== 导出功能 ==========

  // 导出日志为JSON
  async exportToJson(query: QueryOperationLogDto): Promise<string> {
    const { data } = await this.query({ ...query, page: 1, pageSize: 10000 });
    
    const exportDir = path.join(process.cwd(), 'exports', 'logs');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `operation-logs-${timestamp}.json`;
    const filepath = path.join(exportDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    return filepath;
  }

  // 导出日志为CSV
  async exportToCsv(query: QueryOperationLogDto): Promise<string> {
    const { data } = await this.query({ ...query, page: 1, pageSize: 10000 });
    
    const exportDir = path.join(process.cwd(), 'exports', 'logs');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `operation-logs-${timestamp}.csv`;
    const filepath = path.join(exportDir, filename);
    
    const headers = ['ID', '用户ID', '用户名', '操作类型', '模块', '描述', 'IP', '是否成功', '错误信息', '创建时间'];
    const rows = data.map(log => [
      log.id,
      log.userId,
      log.userName || '',
      log.operationType,
      log.module,
      log.description,
      log.ip || '',
      log.isSuccess ? '是' : '否',
      log.errorMessage || '',
      log.createdAt.toISOString(),
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    fs.writeFileSync(filepath, csvContent, 'utf8');
    return filepath;
  }

  // 导出日志为Excel（简化版，实际应使用exceljs等库）
  async exportToExcel(query: QueryOperationLogDto): Promise<string> {
    // 这里简化为CSV格式，实际项目应使用exceljs库
    return this.exportToCsv(query);
  }

  // 获取导出文件列表
  async getExportFiles(): Promise<Array<{ filename: string; size: number; createdAt: Date }>> {
    const exportDir = path.join(process.cwd(), 'exports', 'logs');
    if (!fs.existsSync(exportDir)) {
      return [];
    }
    
    const files = fs.readdirSync(exportDir);
    return files
      .filter(f => f.endsWith('.json') || f.endsWith('.csv') || f.endsWith('.xlsx'))
      .map(filename => {
        const filepath = path.join(exportDir, filename);
        const stats = fs.statSync(filepath);
        return {
          filename,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取导出文件内容
  async getExportFileContent(filename: string): Promise<string> {
    const filepath = path.join(process.cwd(), 'exports', 'logs', filename);
    if (!fs.existsSync(filepath)) {
      throw new Error('导出文件不存在');
    }
    return fs.readFileSync(filepath, 'utf8');
  }

  // 删除导出文件
  async deleteExportFile(filename: string): Promise<void> {
    const filepath = path.join(process.cwd(), 'exports', 'logs', filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}
