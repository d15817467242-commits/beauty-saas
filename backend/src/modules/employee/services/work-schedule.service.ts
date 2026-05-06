import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { WorkSchedule, ScheduleStatus } from '../entities/work-schedule.entity';
import { ShiftTemplate } from '../entities/shift-template.entity';
import { Employee } from '../entities/employee.entity';
import { CreateWorkScheduleDto, UpdateWorkScheduleDto, BatchScheduleDto, CopyScheduleDto } from '../dto/work-schedule.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class WorkScheduleService {
  constructor(
    @InjectRepository(WorkSchedule)
    private scheduleRepository: Repository<WorkSchedule>,
    @InjectRepository(ShiftTemplate)
    private shiftTemplateRepository: Repository<ShiftTemplate>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(dto: CreateWorkScheduleDto): Promise<WorkSchedule> {
    // 检查是否已存在排班
    const existing = await this.scheduleRepository.findOne({
      where: {
        employeeId: dto.employeeId,
        scheduleDate: new Date(dto.scheduleDate),
      },
    });
    
    if (existing) {
      throw new ConflictException('该员工当天已有排班');
    }

    const schedule = this.scheduleRepository.create({
      ...dto,
      scheduleDate: new Date(dto.scheduleDate),
    });
    return this.scheduleRepository.save(schedule);
  }

  async findAll(employeeId?: string, startDate?: string, endDate?: string): Promise<WorkSchedule[]> {
    const query = this.scheduleRepository.createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.employee', 'employee')
      .leftJoinAndSelect('schedule.shift', 'shift');

    if (employeeId) {
      query.andWhere('schedule.employeeId = :employeeId', { employeeId });
    }

    if (startDate && endDate) {
      query.andWhere('schedule.scheduleDate BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    return query.orderBy('schedule.scheduleDate', 'ASC').getMany();
  }

  async findOne(id: string): Promise<WorkSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['employee', 'shift'],
    });
    if (!schedule) {
      throw new NotFoundException('排班记录不存在');
    }
    return schedule;
  }

  async update(id: string, dto: UpdateWorkScheduleDto): Promise<WorkSchedule> {
    const schedule = await this.findOne(id);
    Object.assign(schedule, dto);
    if (dto.scheduleDate) {
      schedule.scheduleDate = new Date(dto.scheduleDate);
    }
    return this.scheduleRepository.save(schedule);
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findOne(id);
    await this.scheduleRepository.remove(schedule);
  }

  // 批量排班
  async batchSchedule(dto: BatchScheduleDto): Promise<WorkSchedule[]> {
    const schedules: WorkSchedule[] = [];
    const errors: string[] = [];

    for (const employeeId of dto.employeeIds) {
      for (const scheduleDate of dto.scheduleDates) {
        try {
          // 检查是否已存在
          const existing = await this.scheduleRepository.findOne({
            where: {
              employeeId,
              scheduleDate: new Date(scheduleDate),
            },
          });

          if (!existing) {
            const schedule = this.scheduleRepository.create({
              employeeId,
              shiftId: dto.shiftId,
              scheduleDate: new Date(scheduleDate),
              remark: dto.remark,
            });
            schedules.push(schedule);
          }
        } catch (error) {
          errors.push(`${employeeId} - ${scheduleDate}: ${error.message}`);
        }
      }
    }

    if (schedules.length > 0) {
      await this.scheduleRepository.save(schedules);
    }

    return schedules;
  }

  // 复制排班
  async copySchedule(dto: CopyScheduleDto): Promise<WorkSchedule[]> {
    const sourceSchedules = await this.scheduleRepository.find({
      where: {
        scheduleDate: Between(new Date(dto.sourceStartDate), new Date(dto.sourceEndDate)),
        ...(dto.employeeIds && { employeeId: In(dto.employeeIds) }),
      },
    });

    const sourceStart = dayjs(dto.sourceStartDate);
    const targetStart = dayjs(dto.targetStartDate);
    const daysDiff = targetStart.diff(sourceStart, 'day');

    const newSchedules: WorkSchedule[] = [];
    for (const source of sourceSchedules) {
      const newDate = dayjs(source.scheduleDate).add(daysDiff, 'day').toDate();
      
      // 检查目标日期是否已有排班
      const existing = await this.scheduleRepository.findOne({
        where: {
          employeeId: source.employeeId,
          scheduleDate: newDate,
        },
      });

      if (!existing) {
        const newSchedule = this.scheduleRepository.create({
          employeeId: source.employeeId,
          shiftId: source.shiftId,
          scheduleDate: newDate,
          remark: source.remark,
        });
        newSchedules.push(newSchedule);
      }
    }

    if (newSchedules.length > 0) {
      await this.scheduleRepository.save(newSchedules);
    }

    return newSchedules;
  }

  // 获取员工排班日历
  async getEmployeeCalendar(employeeId: string, month: string): Promise<any> {
    const startDate = dayjs(month).startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs(month).endOf('month').format('YYYY-MM-DD');

    const schedules = await this.scheduleRepository.find({
      where: {
        employeeId,
        scheduleDate: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['shift'],
    });

    return schedules.map(s => ({
      date: dayjs(s.scheduleDate).format('YYYY-MM-DD'),
      shift: s.shift,
      status: s.status,
      actualStart: s.actualStart,
      actualEnd: s.actualEnd,
    }));
  }
}
