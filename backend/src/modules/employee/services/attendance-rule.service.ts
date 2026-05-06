import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRule } from '../entities/attendance-rule.entity';
import { CreateAttendanceRuleDto, UpdateAttendanceRuleDto } from '../dto/attendance-rule.dto';

@Injectable()
export class AttendanceRuleService {
  constructor(
    @InjectRepository(AttendanceRule)
    private ruleRepository: Repository<AttendanceRule>,
  ) {}

  async create(dto: CreateAttendanceRuleDto): Promise<AttendanceRule> {
    const rule = this.ruleRepository.create(dto);
    return this.ruleRepository.save(rule);
  }

  async findAll(isActive?: boolean): Promise<AttendanceRule[]> {
    const query = this.ruleRepository.createQueryBuilder('rule');
    
    if (isActive !== undefined) {
      query.where('rule.isActive = :isActive', { isActive });
    }
    
    return query.orderBy('rule.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<AttendanceRule> {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('考勤规则不存在');
    }
    return rule;
  }

  async getActiveRule(): Promise<AttendanceRule | null> {
    return this.ruleRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateAttendanceRuleDto): Promise<AttendanceRule> {
    const rule = await this.findOne(id);
    Object.assign(rule, dto);
    return this.ruleRepository.save(rule);
  }

  async remove(id: string): Promise<void> {
    const rule = await this.findOne(id);
    await this.ruleRepository.remove(rule);
  }
}
