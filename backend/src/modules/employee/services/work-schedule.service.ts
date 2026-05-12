import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkSchedule } from '../entities/work-schedule.entity';

@Injectable()
export class WorkScheduleService {
  constructor(
    @InjectRepository(WorkSchedule)
    private readonly scheduleRepository: Repository<WorkSchedule>,
  ) {}

  async findAll(query?: { employeeId?: string; date?: string; type?: string }): Promise<WorkSchedule[]> {
    const qb = this.scheduleRepository.createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.employee', 'employee');

    if (query?.employeeId) {
      qb.andWhere('schedule.employeeId = :employeeId', { employeeId: query.employeeId });
    }
    if (query?.date) {
      qb.andWhere('schedule.scheduleDate = :date', { date: query.date });
    }
    if (query?.type) {
      qb.andWhere('schedule.type = :type', { type: query.type });
    }

    return qb.orderBy('schedule.scheduleDate', 'DESC').getMany();
  }

  async findOne(id: string): Promise<WorkSchedule | null> {
    return this.scheduleRepository.findOne({ where: { id }, relations: ['employee'] });
  }

  async create(data: Partial<WorkSchedule>): Promise<WorkSchedule> {
    const schedule = this.scheduleRepository.create(data);
    return this.scheduleRepository.save(schedule);
  }

  async update(id: string, data: Partial<WorkSchedule>): Promise<WorkSchedule | null> {
    await this.scheduleRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.scheduleRepository.delete(id);
  }
}
