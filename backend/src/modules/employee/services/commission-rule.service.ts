import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionRule, CommissionRuleType } from '../entities/commission-rule.entity';
import { CreateCommissionRuleDto, UpdateCommissionRuleDto } from '../dto/commission-rule.dto';

@Injectable()
export class CommissionRuleService {
  constructor(
    @InjectRepository(CommissionRule)
    private ruleRepository: Repository<CommissionRule>,
  ) {}

  async create(dto: CreateCommissionRuleDto): Promise<CommissionRule> {
    const rule = this.ruleRepository.create(dto);
    return this.ruleRepository.save(rule);
  }

  async findAll(isActive?: boolean, ruleType?: CommissionRuleType): Promise<CommissionRule[]> {
    const query = this.ruleRepository.createQueryBuilder('rule');
    
    if (isActive !== undefined) {
      query.where('rule.isActive = :isActive', { isActive });
    }
    
    if (ruleType) {
      query.andWhere('rule.ruleType = :ruleType', { ruleType });
    }
    
    return query.orderBy('rule.priority', 'DESC').addOrderBy('rule.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<CommissionRule> {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('提成规则不存在');
    }
    return rule;
  }

  async findByTarget(ruleType: CommissionRuleType, targetId: string): Promise<CommissionRule | null> {
    return this.ruleRepository.findOne({
      where: { ruleType, targetId, isActive: true },
      order: { priority: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateCommissionRuleDto): Promise<CommissionRule> {
    const rule = await this.findOne(id);
    Object.assign(rule, dto);
    return this.ruleRepository.save(rule);
  }

  async remove(id: string): Promise<void> {
    const rule = await this.findOne(id);
    await this.ruleRepository.remove(rule);
  }

  // 计算提成金额
  calculateCommission(rule: CommissionRule, baseAmount: number): number {
    // 固定提成
    if (rule.fixedAmount) {
      return Math.min(rule.fixedAmount, rule.maxCommission || Infinity);
    }

    // 比例提成
    if (rule.commissionRate) {
      const commission = baseAmount * rule.commissionRate / 100;
      return Math.min(commission, rule.maxCommission || Infinity);
    }

    // 阶梯提成
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
}
