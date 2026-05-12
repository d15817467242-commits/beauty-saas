import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance, AttendanceStatus } from '../entities/attendance.entity';
import { AttendanceRule } from '../entities/attendance-rule.entity';
import { WorkSchedule } from '../entities/work-schedule.entity';
import { CheckInDto, CheckOutDto, AttendanceQueryDto, AttendanceStatsQueryDto, UpdateAttendanceDto } from '../dto/attendance.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(AttendanceRule)
    private ruleRepository: Repository<AttendanceRule>,
    @InjectRepository(WorkSchedule)
    private scheduleRepository: Repository<WorkSchedule>,
  ) {}

  // 签到
  async checkIn(dto: CheckInDto): Promise<Attendance> {
    const today = dayjs().format('YYYY-MM-DD');
    const now = new Date();

    // 查找或创建今日考勤记录
    let attendance = await this.attendanceRepository.findOne({
      where: {
        employeeId: dto.employeeId,
        date: new Date(today),
      },
    });

    if (!attendance) {
      attendance = this.attendanceRepository.create({
        employeeId: dto.employeeId,
        date: new Date(today),
      });
    }

    if (attendance.checkInTime) {
      throw new NotFoundException('今日已签到');
    }

    attendance.checkInTime = now;
    attendance.checkInLocation = dto.checkInLocation || '';
    attendance.checkInPhoto = dto.checkInPhoto || '';

    // 获取排班信息
    const schedule = await this.scheduleRepository.findOne({
      where: {
        employeeId: dto.employeeId,
        scheduleDate: today,
      } as any,
    });

    if (schedule) {
      attendance.scheduledStart = schedule.startTime || '';
      attendance.scheduledEnd = schedule.endTime || '';
    }

    // 获取考勤规则并计算状态
    const rule = await this.ruleRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    if (rule) {
      attendance.ruleId = rule.id;
      attendance.checkInStatus = this.calculateCheckInStatus(now, attendance.scheduledStart, rule);
    }

    return this.attendanceRepository.save(attendance);
  }

  // 签退
  async checkOut(dto: CheckOutDto): Promise<Attendance> {
    const today = dayjs().format('YYYY-MM-DD');
    const now = new Date();

    const attendance = await this.attendanceRepository.findOne({
      where: {
        employeeId: dto.employeeId,
        date: new Date(today),
      },
    });

    if (!attendance) {
      throw new NotFoundException('今日未签到');
    }

    if (attendance.checkOutTime) {
      throw new NotFoundException('今日已签退');
    }

    attendance.checkOutTime = now;
    attendance.checkOutLocation = dto.checkOutLocation || '';
    attendance.checkOutPhoto = dto.checkOutPhoto || '';

    // 计算签退状态和工作时长
    const rule = attendance.ruleId ? await this.ruleRepository.findOne({ where: { id: attendance.ruleId } }) : null;
    
    if (attendance.checkInTime) {
      const workMinutes = dayjs(now).diff(dayjs(attendance.checkInTime), 'minute');
      attendance.workHours = workMinutes;

      if (rule) {
        attendance.checkOutStatus = this.calculateCheckOutStatus(now, attendance.scheduledEnd, rule);
        attendance.penaltyAmount = this.calculatePenalty(attendance, rule);
        
        // 计算加班
        if (attendance.scheduledEnd) {
          const scheduledEnd = dayjs(`${today} ${attendance.scheduledEnd}`);
          if (dayjs(now).isAfter(scheduledEnd)) {
            attendance.overtimeHours = dayjs(now).diff(scheduledEnd, 'minute');
            // 简单计算加班费，需要结合员工基本工资
            attendance.overtimePay = 0; // 需要员工基本工资信息
          }
        }
      }
    }

    return this.attendanceRepository.save(attendance);
  }

  // 计算签到状态
  private calculateCheckInStatus(checkInTime: Date, scheduledStart: string, rule: AttendanceRule): AttendanceStatus {
    if (!scheduledStart) return AttendanceStatus.NORMAL;

    const today = dayjs().format('YYYY-MM-DD');
    const scheduled = dayjs(`${today} ${scheduledStart}`);
    const actual = dayjs(checkInTime);
    const diffMinutes = actual.diff(scheduled, 'minute');

    if (diffMinutes <= 0) {
      return AttendanceStatus.NORMAL;
    } else if (diffMinutes <= rule.lateThreshold) {
      return AttendanceStatus.NORMAL; // 在宽限时间内
    } else if (diffMinutes >= rule.absentThreshold) {
      return AttendanceStatus.ABSENT;
    } else {
      return AttendanceStatus.LATE;
    }
  }

  // 计算签退状态
  private calculateCheckOutStatus(checkOutTime: Date, scheduledEnd: string, rule: AttendanceRule): AttendanceStatus {
    if (!scheduledEnd) return AttendanceStatus.NORMAL;

    const today = dayjs().format('YYYY-MM-DD');
    const scheduled = dayjs(`${today} ${scheduledEnd}`);
    const actual = dayjs(checkOutTime);
    const diffMinutes = scheduled.diff(actual, 'minute');

    if (diffMinutes <= 0) {
      return AttendanceStatus.NORMAL; // 正常或加班
    } else if (diffMinutes <= rule.earlyLeaveThreshold) {
      return AttendanceStatus.NORMAL; // 在宽限时间内
    } else {
      return AttendanceStatus.EARLY_LEAVE;
    }
  }

  // 计算扣款
  private calculatePenalty(attendance: Attendance, rule: AttendanceRule): number {
    let penalty = 0;

    if (attendance.checkInStatus === AttendanceStatus.LATE) {
      penalty += rule.latePenalty;
    } else if (attendance.checkInStatus === AttendanceStatus.ABSENT) {
      penalty += rule.absentPenalty;
    }

    if (attendance.checkOutStatus === AttendanceStatus.EARLY_LEAVE) {
      penalty += rule.earlyLeavePenalty;
    }

    return penalty;
  }

  // 查询考勤记录
  async findByEmployee(dto: AttendanceQueryDto): Promise<Attendance[]> {
    const where: any = {};
    if (dto.employeeId) where.employeeId = dto.employeeId;
    if (dto.startDate && dto.endDate) {
      where.date = Between(new Date(dto.startDate!), new Date(dto.endDate!));
    }
    return this.attendanceRepository.find({
      where,
      relations: ['employee'],
      order: { date: 'DESC' },
    });
  }

  // 考勤统计
  async getStats(dto: AttendanceStatsQueryDto): Promise<any> {
    const query = this.attendanceRepository.createQueryBuilder('attendance')
      .where('attendance.date BETWEEN :startDate AND :endDate', {
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      });

    if (dto.employeeId) {
      query.andWhere('attendance.employeeId = :employeeId', { employeeId: dto.employeeId });
    }

    const records = await query.getMany();

    const stats = {
      totalDays: records.length,
      normalDays: records.filter(r => r.checkInStatus === AttendanceStatus.NORMAL && r.checkOutStatus === AttendanceStatus.NORMAL).length,
      lateDays: records.filter(r => r.checkInStatus === AttendanceStatus.LATE).length,
      earlyLeaveDays: records.filter(r => r.checkOutStatus === AttendanceStatus.EARLY_LEAVE).length,
      absentDays: records.filter(r => r.checkInStatus === AttendanceStatus.ABSENT).length,
      totalWorkHours: records.reduce((sum, r) => sum + (r.workHours || 0), 0),
      totalOvertimeHours: records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0),
      totalPenalty: records.reduce((sum, r) => sum + Number(r.penaltyAmount || 0), 0),
      totalOvertimePay: records.reduce((sum, r) => sum + Number(r.overtimePay || 0), 0),
    };

    return stats;
  }

  async findOne(id: string): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
      relations: ['employee'],
    });
    if (!attendance) {
      throw new NotFoundException('考勤记录不存在');
    }
    return attendance;
  }

  async update(id: string, dto: UpdateAttendanceDto): Promise<Attendance> {
    const attendance = await this.findOne(id);
    Object.assign(attendance, dto);
    return this.attendanceRepository.save(attendance);
  }
}
