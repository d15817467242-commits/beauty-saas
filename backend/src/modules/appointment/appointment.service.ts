import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, DataSource } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { Schedule, ScheduleType } from './schedule.entity';
import { CreateAppointmentDto, UpdateAppointmentDto, CancelAppointmentDto, QueryAppointmentDto } from './dto/appointment.dto';
import { CreateScheduleDto, UpdateScheduleDto, BatchCreateScheduleDto, QueryScheduleDto } from './dto/schedule.dto';
import { MemberService } from '../member/member.service';
import { EmployeeService } from '../employee/employee.service';
import { ServiceService } from '../service/service.service';

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: Appointment[];
}

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    private memberService: MemberService,
    private employeeService: EmployeeService,
    private serviceService: ServiceService,
    private dataSource: DataSource,
  ) {}

  // ========== 预约管理 ==========

  async create(dto: CreateAppointmentDto, userId: string): Promise<Appointment> {
    // 验证服务项目
    const service = await this.serviceService.findOne(dto.serviceId);
    
    // 验证员工
    const employee = await this.employeeService.findOne(dto.employeeId);
    
    // 验证会员（如果有）
    if (dto.memberId) {
      await this.memberService.findOne(dto.memberId);
    }

    // 检查员工排班
    const schedule = await this.scheduleRepository.findOne({
      where: {
        employeeId: dto.employeeId,
        date: new Date(dto.appointmentDate),
      },
    });

    if (schedule && schedule.type !== ScheduleType.WORK) {
      throw new BadRequestException('该员工当天不工作');
    }

    // 检查时间冲突
    const conflictResult = await this.checkTimeConflict(
      dto.employeeId,
      dto.appointmentDate,
      dto.startTime,
      dto.endTime,
    );

    if (conflictResult.hasConflict) {
      const conflictDetails = conflictResult.conflicts.map(c => 
        `${c.startTime}-${c.endTime}`
      ).join(', ');
      throw new ConflictException(`该时间段已有预约，冲突时段: ${conflictDetails}`);
    }

    const appointment = this.appointmentRepository.create({
      ...dto,
      appointmentDate: new Date(dto.appointmentDate),
      status: AppointmentStatus.PENDING,
      createdBy: userId,
    });

    return this.appointmentRepository.save(appointment);
  }

  private isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && end1 > start2;
  }

  async findAll(query: QueryAppointmentDto): Promise<Appointment[]> {
    const where: any = {};

    if (query.date) {
      where.appointmentDate = new Date(query.date);
    } else if (query.startDate && query.endDate) {
      where.appointmentDate = Between(new Date(query.startDate), new Date(query.endDate));
    }

    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.memberId) where.memberId = query.memberId;
    if (query.status) where.status = query.status;

    return this.appointmentRepository.find({
      where,
      relations: ['member', 'employee', 'service'],
      order: { appointmentDate: 'ASC', startTime: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['member', 'employee', 'service'],
    });
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    
    if (dto.appointmentDate) {
      appointment.appointmentDate = new Date(dto.appointmentDate);
    }
    
    Object.assign(appointment, dto);
    return this.appointmentRepository.save(appointment);
  }

  async cancel(id: string, dto: CancelAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('已完成的预约不能取消');
    }
    
    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancelReason = dto.cancelReason;
    
    return this.appointmentRepository.save(appointment);
  }

  async confirm(id: string): Promise<Appointment> {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.CONFIRMED;
    return this.appointmentRepository.save(appointment);
  }

  async complete(id: string): Promise<Appointment> {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.COMPLETED;
    return this.appointmentRepository.save(appointment);
  }

  async noShow(id: string): Promise<Appointment> {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.NO_SHOW;
    return this.appointmentRepository.save(appointment);
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentRepository.remove(appointment);
  }

  // ========== 排班管理 ==========

  async createSchedule(dto: CreateScheduleDto, userId: string): Promise<Schedule> {
    // 验证员工
    await this.employeeService.findOne(dto.employeeId);

    // 检查是否已存在排班
    const existing = await this.scheduleRepository.findOne({
      where: {
        employeeId: dto.employeeId,
        date: new Date(dto.date),
      },
    });

    if (existing) {
      throw new ConflictException('该员工当天已有排班记录');
    }

    const schedule = this.scheduleRepository.create({
      ...dto,
      date: new Date(dto.date),
      type: dto.type as ScheduleType || ScheduleType.WORK,
      createdBy: userId,
    });

    return this.scheduleRepository.save(schedule);
  }

  async batchCreateSchedule(dto: BatchCreateScheduleDto, userId: string): Promise<Schedule[]> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const restDays = dto.restDays || ['0', '6']; // 默认周六日休息

    const schedules: Schedule[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay().toString();
      const isRestDay = restDays.includes(dayOfWeek);

      for (const employeeId of dto.employeeIds) {
        // 检查是否已存在
        const existing = await this.scheduleRepository.findOne({
          where: {
            employeeId,
            date: new Date(currentDate),
          },
        });

        if (!existing) {
          const schedule = this.scheduleRepository.create();
          schedule.employeeId = employeeId;
          schedule.date = new Date(currentDate);
          schedule.type = isRestDay ? ScheduleType.REST : (dto.type as ScheduleType || ScheduleType.WORK);
          if (!isRestDay) {
            schedule.startTime = dto.startTime || '09:00';
            schedule.endTime = dto.endTime || '18:00';
          }
          schedule.createdBy = userId;
          schedules.push(schedule);
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return this.scheduleRepository.save(schedules);
  }

  async findSchedules(query: QueryScheduleDto): Promise<Schedule[]> {
    const where: any = {};

    if (query.date) {
      where.date = new Date(query.date);
    } else if (query.startDate && query.endDate) {
      where.date = Between(new Date(query.startDate), new Date(query.endDate));
    }

    if (query.employeeId) where.employeeId = query.employeeId;

    return this.scheduleRepository.find({
      where,
      relations: ['employee'],
      order: { date: 'ASC', employeeId: 'ASC' },
    });
  }

  async findSchedule(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['employee'],
    });
    if (!schedule) {
      throw new NotFoundException('排班记录不存在');
    }
    return schedule;
  }

  async updateSchedule(id: string, dto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.findSchedule(id);
    
    if (dto.type) {
      schedule.type = dto.type as ScheduleType;
    }
    
    Object.assign(schedule, dto);
    return this.scheduleRepository.save(schedule);
  }

  async removeSchedule(id: string): Promise<void> {
    const schedule = await this.findSchedule(id);
    await this.scheduleRepository.remove(schedule);
  }

  // ========== 获取员工可用时间段 ==========

  async getAvailableSlots(employeeId: string, date: string): Promise<any[]> {
    // 获取员工排班
    const schedule = await this.scheduleRepository.findOne({
      where: {
        employeeId,
        date: new Date(date),
      },
    });

    if (!schedule || schedule.type !== ScheduleType.WORK) {
      return [];
    }

    // 获取当天预约
    const appointments = await this.appointmentRepository.find({
      where: {
        employeeId,
        appointmentDate: new Date(date),
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
    });

    // 生成可用时间段
    const slots: any[] = [];
    const workStart = schedule.startTime || '09:00';
    const workEnd = schedule.endTime || '18:00';
    const slotDuration = 30; // 30分钟一个时间段

    let currentTime = this.parseTime(workStart);
    const endTime = this.parseTime(workEnd);

    while (currentTime < endTime) {
      const slotStart = this.formatTime(currentTime);
      const slotEnd = this.formatTime(currentTime + slotDuration);

      // 检查是否被预约
      const isBooked = appointments.some(
        appt => this.isTimeOverlap(slotStart, slotEnd, appt.startTime, appt.endTime)
      );

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        available: !isBooked,
      });

      currentTime += slotDuration;
    }

    return slots;
  }

  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // ========== 冲突检测（供外部调用） ==========

  async checkTimeConflict(
    employeeId: string,
    appointmentDate: Date | string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<ConflictResult> {
    const where: any = {
      employeeId,
      appointmentDate: typeof appointmentDate === 'string' ? new Date(appointmentDate) : appointmentDate,
      status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
    };

    const existingAppointments = await this.appointmentRepository.find({ where });

    const conflicts: Appointment[] = [];

    for (const appt of existingAppointments) {
      if (excludeId && appt.id === excludeId) continue;

      if (this.isTimeOverlap(startTime, endTime, appt.startTime, appt.endTime)) {
        conflicts.push(appt);
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }
}
