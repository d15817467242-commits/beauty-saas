import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { CommissionRecord, CommissionStatus, CommissionSource } from '../entities/commission-record.entity';
import { CommissionRule, CommissionRuleType } from '../entities/commission-rule.entity';
import { Employee } from '../entities/employee.entity';
import { 
  CreateCommissionRecordDto, 
  UpdateCommissionRecordDto, 
  CommissionQueryDto, 
  CommissionStatsQueryDto,
  ApproveCommissionDto,
  PayCommissionDto,
  CalculateCommissionDto,
} from '../dto/commission-record.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class CommissionRecordService {
  constructor(
    @InjectRepository(CommissionRecord)
    private recordRepository: Repository<CommissionRecord>,
    @InjectRepository(CommissionRule)
    private ruleRepository: Repository<CommissionRule>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(dto: CreateCommissionRecordDto): Promise<CommissionRecord> {
    const period = dto.period || dayjs().format('YYYY-MM');
    const record = this.recordRepository.create({
      ...dto,
      period,
    });
    return this.recordRepository.save(record);
  }

  async findAll(dto: CommissionQueryDto): Promise<CommissionRecord[]> {
    const query = this.recordRepository.createQueryBuilder('record')
      .leftJoinAndSelect('record.employee', 'employee')
      .where('record.employeeId = :employeeId', { employeeId: dto.employeeId });

    if (dto.startDate && dto.endDate) {
      query.andWhere('record.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      });
    }

    if (dto.status) {
      query.andWhere('record.status = :status', { status: dto.status });
    }

    if (dto.sourceType) {
      query.andWhere('record.sourceType = :sourceType', { sourceType: dto.sourceType });
    }

    return query.orderBy('record.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<CommissionRecord> {
    const record = await this.recordRepository.findOne({
      where: { id },
      relations: ['employee'],
    });
    if (!record) {
      throw new NotFoundException('提成记录不存在');
    }
    return record;
  }

  async update(id: string, dto: UpdateCommissionRecordDto): Promise<CommissionRecord> {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    return this.recordRepository.save(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);
    await this.recordRepository.remove(record);
  }

  // 计算提成
  async calculate(dto: CalculateCommissionDto): Promise<{ amount: number; ruleId?: string }> {
    // 映射来源类型到规则类型
    const ruleTypeMap: Record<string, CommissionRuleType> = {
      [CommissionSource.SERVICE]: CommissionRuleType.SERVICE,
      [CommissionSource.PRODUCT]: CommissionRuleType.PRODUCT,
      [CommissionSource.CARD]: CommissionRuleType.CARD,
      [CommissionSource.RECHARGE]: CommissionRuleType.RECHARGE,
    };
    
    const ruleType = ruleTypeMap[dto.sourceType];
    if (!ruleType) {
      return { amount: 0 };
    }

    // 查找适用的提成规则
    const rule = await this.ruleRepository.findOne({
      where: {
        ruleType,
        targetId: dto.sourceId,
        isActive: true,
      },
      order: { priority: 'DESC' },
    });

    if (!rule) {
      // 使用默认规则
      const defaultRule = await this.ruleRepository.findOne({
        where: {
          ruleType,
          isActive: true,
        },
        order: { priority: 'DESC' },
      });

      if (!defaultRule) {
        return { amount: 0 };
      }

      return {
        amount: this.calculateByRule(defaultRule, dto.baseAmount),
        ruleId: defaultRule.id,
      };
    }

    return {
      amount: this.calculateByRule(rule, dto.baseAmount),
      ruleId: rule.id,
    };
  }

  private calculateByRule(rule: CommissionRule, baseAmount: number): number {
    if (rule.fixedAmount) {
      return Math.min(rule.fixedAmount, rule.maxCommission || Infinity);
    }

    if (rule.commissionRate) {
      const commission = baseAmount * rule.commissionRate / 100;
      return Math.min(commission, rule.maxCommission || Infinity);
    }

    if (rule.tieredRules && rule.tieredRules.length > 0) {
      for (const tier of rule.tieredRules) {
        if (baseAmount >= tier.minAmount && baseAmount < tier.maxAmount) {
          const commission = tier.fixedAmount || (baseAmount * tier.rate / 100);
          return Math.min(commission, rule.maxCommission || Infinity);
        }
      }
    }

    return 0;
  }

  // 审核提成
  async approve(dto: ApproveCommissionDto, approvedBy: string): Promise<CommissionRecord[]> {
    const records = await this.recordRepository.find({
      where: { id: In(dto.recordIds) },
    });

    const now = new Date();
    for (const record of records) {
      record.status = CommissionStatus.APPROVED;
      record.approvedBy = approvedBy;
      record.approvedAt = now;
    }

    return this.recordRepository.save(records);
  }

  // 发放提成
  async pay(dto: PayCommissionDto): Promise<CommissionRecord[]> {
    const records = await this.recordRepository.find({
      where: { id: In(dto.recordIds) },
    });

    const now = new Date();
    for (const record of records) {
      if (record.status !== CommissionStatus.APPROVED) {
        throw new NotFoundException(`提成记录 ${record.id} 未审核，不能发放`);
      }
      record.status = CommissionStatus.PAID;
      record.paidAt = now;
    }

    return this.recordRepository.save(records);
  }

  // 提成统计
  async getStats(dto: CommissionStatsQueryDto): Promise<any> {
    const query = this.recordRepository.createQueryBuilder('record')
      .where('record.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      });

    if (dto.employeeId) {
      query.andWhere('record.employeeId = :employeeId', { employeeId: dto.employeeId });
    }

    const records = await query.getMany();

    const stats = {
      totalAmount: records.reduce((sum, r) => sum + Number(r.amount), 0),
      pendingAmount: records.filter(r => r.status === CommissionStatus.PENDING).reduce((sum, r) => sum + Number(r.amount), 0),
      approvedAmount: records.filter(r => r.status === CommissionStatus.APPROVED).reduce((sum, r) => sum + Number(r.amount), 0),
      paidAmount: records.filter(r => r.status === CommissionStatus.PAID).reduce((sum, r) => sum + Number(r.amount), 0),
      bySource: this.groupBySource(records),
      byPeriod: this.groupByPeriod(records),
    };

    return stats;
  }

  private groupBySource(records: CommissionRecord[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const record of records) {
      const source = record.sourceType;
      result[source] = (result[source] || 0) + Number(record.amount);
    }
    return result;
  }

  private groupByPeriod(records: CommissionRecord[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const record of records) {
      const period = record.period;
      result[period] = (result[period] || 0) + Number(record.amount);
    }
    return result;
  }

  // 获取员工提成汇总
  async getEmployeeSummary(employeeId: string, period: string): Promise<any> {
    const records = await this.recordRepository.find({
      where: { employeeId, period },
      relations: ['employee'],
    });

    return {
      employeeId,
      period,
      totalAmount: records.reduce((sum, r) => sum + Number(r.amount), 0),
      pendingAmount: records.filter(r => r.status === CommissionStatus.PENDING).reduce((sum, r) => sum + Number(r.amount), 0),
      approvedAmount: records.filter(r => r.status === CommissionStatus.APPROVED).reduce((sum, r) => sum + Number(r.amount), 0),
      paidAmount: records.filter(r => r.status === CommissionStatus.PAID).reduce((sum, r) => sum + Number(r.amount), 0),
      records,
    };
  }
}
