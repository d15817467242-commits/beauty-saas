import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, DataSource, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AppointmentReminder, ReminderStatus, ReminderType, ReminderTiming } from './appointment-reminder.entity';
import { Queue, QueueStatus } from './queue.entity';
import { QueueItem, QueueItemStatus } from './queue-item.entity';
import { AppointmentReview } from './appointment-review.entity';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { EmployeeService } from '../employee/employee.service';
import { MemberService } from '../member/member.service';
import {
  CreateReminderDto,
  QueryReminderDto,
  SendReminderDto,
  CreateQueueDto,
  UpdateQueueDto,
  QueryQueueDto,
  TakeQueueNumberDto,
  CallQueueNumberDto,
  UpdateQueueItemDto,
  QueryQueueItemDto,
  CreateReviewDto,
  UpdateReviewDto,
  ReplyReviewDto,
  QueryReviewDto,
  CalendarQueryDto,
  CheckConflictDto,
} from './dto/enhanced.dto';

@Injectable()
export class AppointmentEnhancedService {
  constructor(
    @InjectRepository(AppointmentReminder)
    private reminderRepository: Repository<AppointmentReminder>,
    @InjectRepository(Queue)
    private queueRepository: Repository<Queue>,
    @InjectRepository(QueueItem)
    private queueItemRepository: Repository<QueueItem>,
    @InjectRepository(AppointmentReview)
    private reviewRepository: Repository<AppointmentReview>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    private employeeService: EmployeeService,
    private memberService: MemberService,
    private dataSource: DataSource,
  ) {}

  // ========== 预约提醒系统 ==========

  async createReminder(dto: CreateReminderDto, userId: string): Promise<AppointmentReminder> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: dto.appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }

    // 计算提醒时间
    const timingMinutes = dto.timingType === '0' 
      ? (dto.timingMinutes || 60) 
      : parseInt(dto.timingType);
    
    const appointmentDateTime = new Date(`${appointment.appointmentDate.toISOString().split('T')[0]}T${appointment.startTime}`);
    const reminderTime = new Date(appointmentDateTime.getTime() - timingMinutes * 60 * 1000);

    const reminder = this.reminderRepository.create({
      appointmentId: dto.appointmentId,
      reminderType: dto.reminderType as ReminderType,
      timingType: dto.timingType as unknown as ReminderTiming,
      timingMinutes,
      reminderTime,
      status: ReminderStatus.PENDING,
      content: dto.content,
      createdBy: userId,
    });

    return this.reminderRepository.save(reminder);
  }

  async sendReminder(dto: SendReminderDto): Promise<AppointmentReminder> {
    const reminder = await this.reminderRepository.findOne({
      where: { id: dto.id },
      relations: ['appointment', 'appointment.member', 'appointment.employee'],
    });

    if (!reminder) {
      throw new NotFoundException('提醒记录不存在');
    }

    if (reminder.status === ReminderStatus.SENT) {
      throw new BadRequestException('提醒已发送');
    }

    try {
      // 获取发送目标
      const appointment = reminder.appointment;
      let sentTo = '';

      if (reminder.reminderType === ReminderType.SMS || reminder.reminderType === ReminderType.BOTH) {
        sentTo = appointment.member?.phone || appointment.guestPhone || '';
        // TODO: 调用短信服务发送
        // await this.smsService.send(sentTo, reminder.content || this.generateReminderContent(appointment));
      }

      if (reminder.reminderType === ReminderType.WECHAT || reminder.reminderType === ReminderType.BOTH) {
        // TODO: 调用微信服务发送
        // await this.wechatService.sendTemplate(appointment.member?.openid, ...);
      }

      reminder.status = ReminderStatus.SENT;
      reminder.sentAt = new Date();
      reminder.sentTo = sentTo;
      reminder.retryCount += 1;

      return this.reminderRepository.save(reminder);
    } catch (error) {
      reminder.status = ReminderStatus.FAILED;
      reminder.errorMessage = error.message;
      reminder.retryCount += 1;
      await this.reminderRepository.save(reminder);
      throw error;
    }
  }

  async findReminders(query: QueryReminderDto): Promise<AppointmentReminder[]> {
    const where: any = {};

    if (query.appointmentId) where.appointmentId = query.appointmentId;
    if (query.status) where.status = query.status;

    if (query.startDate && query.endDate) {
      where.reminderTime = Between(new Date(query.startDate), new Date(query.endDate));
    }

    return this.reminderRepository.find({
      where,
      relations: ['appointment', 'appointment.member', 'appointment.employee'],
      order: { reminderTime: 'ASC' },
    });
  }

  async getPendingReminders(): Promise<AppointmentReminder[]> {
    const now = new Date();
    return this.reminderRepository.find({
      where: {
        status: ReminderStatus.PENDING,
        reminderTime: LessThanOrEqual(now),
      },
      relations: ['appointment', 'appointment.member', 'appointment.employee'],
    });
  }

  // ========== 预约排队系统 ==========

  async createQueue(dto: CreateQueueDto, userId: string): Promise<Queue> {
    await this.employeeService.findOne(dto.employeeId);

    const queue = this.queueRepository.create({
      ...dto,
      queueDate: dto.queueDate ? new Date(dto.queueDate) : new Date(),
      status: QueueStatus.ACTIVE,
      createdBy: userId,
    });

    return this.queueRepository.save(queue);
  }

  async findQueues(query: QueryQueueDto): Promise<Queue[]> {
    const where: any = {};

    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status) where.status = query.status;
    if (query.date) where.queueDate = new Date(query.date);

    return this.queueRepository.find({
      where,
      relations: ['employee', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findQueue(id: string): Promise<Queue> {
    const queue = await this.queueRepository.findOne({
      where: { id },
      relations: ['employee', 'items', 'items.member'],
    });

    if (!queue) {
      throw new NotFoundException('排队队列不存在');
    }

    return queue;
  }

  async updateQueue(id: string, dto: UpdateQueueDto): Promise<Queue> {
    const queue = await this.findQueue(id);
    Object.assign(queue, dto);
    return this.queueRepository.save(queue);
  }

  async takeQueueNumber(dto: TakeQueueNumberDto, userId: string): Promise<QueueItem> {
    const queue = await this.findQueue(dto.queueId);

    if (queue.status !== QueueStatus.ACTIVE) {
      throw new BadRequestException('队列已关闭或暂停');
    }

    if (queue.maxCapacity && queue.nextNumber > queue.maxCapacity) {
      throw new BadRequestException('队列已满');
    }

    // 验证会员
    if (dto.memberId) {
      await this.memberService.findOne(dto.memberId);
    }

    // 计算等待人数和预计等待时间
    const waitingCount = await this.queueItemRepository.count({
      where: {
        queueId: dto.queueId,
        status: QueueItemStatus.WAITING,
      },
    });

    const estimatedWaitTime = waitingCount * queue.avgWaitTime;

    const item = this.queueItemRepository.create({
      queueId: dto.queueId,
      number: queue.nextNumber,
      memberId: dto.memberId,
      guestName: dto.guestName,
      guestPhone: dto.guestPhone,
      status: QueueItemStatus.WAITING,
      waitCount: waitingCount,
      estimatedWaitTime,
      remark: dto.remark,
      createdBy: userId,
    });

    // 更新队列下一个号码
    queue.nextNumber += 1;
    await this.queueRepository.save(queue);

    return this.queueItemRepository.save(item);
  }

  async callQueueNumber(dto: CallQueueNumberDto): Promise<QueueItem> {
    const queue = await this.findQueue(dto.queueId);

    if (queue.status !== QueueStatus.ACTIVE) {
      throw new BadRequestException('队列已关闭或暂停');
    }

    // 获取下一个等待的号码
    const nextItem = await this.queueItemRepository.findOne({
      where: {
        queueId: dto.queueId,
        status: QueueItemStatus.WAITING,
      },
      order: { number: 'ASC' },
    });

    if (!nextItem) {
      throw new NotFoundException('没有等待中的号码');
    }

    nextItem.status = QueueItemStatus.CALLED;
    nextItem.calledAt = new Date();

    // 更新队列当前号码
    queue.currentNumber = nextItem.number;
    await this.queueRepository.save(queue);

    // 更新其他等待项的等待人数
    await this.queueItemRepository.update(
      { queueId: dto.queueId, status: QueueItemStatus.WAITING },
      { waitCount: () => 'wait_count - 1' }
    );

    return this.queueItemRepository.save(nextItem);
  }

  async updateQueueItem(id: string, dto: UpdateQueueItemDto): Promise<QueueItem> {
    const item = await this.queueItemRepository.findOne({
      where: { id },
      relations: ['queue'],
    });

    if (!item) {
      throw new NotFoundException('排队项不存在');
    }

    item.status = dto.status as QueueItemStatus;

    if (dto.status === 'serving') {
      item.servingAt = new Date();
    } else if (dto.status === 'completed') {
      item.completedAt = new Date();
      // 更新平均等待时间
      if (item.queue) {
        const waitTime = Math.floor((item.completedAt.getTime() - item.createdAt.getTime()) / 60000);
        const completedItems = await this.queueItemRepository.count({
          where: { queueId: item.queueId, status: QueueItemStatus.COMPLETED },
        });
        item.queue.avgWaitTime = Math.floor((item.queue.avgWaitTime * completedItems + waitTime) / (completedItems + 1));
        await this.queueRepository.save(item.queue);
      }
    }

    return this.queueItemRepository.save(item);
  }

  async findQueueItems(query: QueryQueueItemDto): Promise<QueueItem[]> {
    const where: any = {};

    if (query.queueId) where.queueId = query.queueId;
    if (query.status) where.status = query.status;
    if (query.memberId) where.memberId = query.memberId;

    return this.queueItemRepository.find({
      where,
      relations: ['queue', 'queue.employee', 'member'],
      order: { number: 'ASC' },
    });
  }

  async getQueueStatus(queueId: string): Promise<any> {
    const queue = await this.findQueue(queueId);

    const waitingCount = await this.queueItemRepository.count({
      where: { queueId, status: QueueItemStatus.WAITING },
    });

    const servingItem = await this.queueItemRepository.findOne({
      where: { queueId, status: QueueItemStatus.SERVING },
      relations: ['member'],
    });

    const calledItem = await this.queueItemRepository.findOne({
      where: { queueId, status: QueueItemStatus.CALLED },
      relations: ['member'],
      order: { calledAt: 'DESC' },
    });

    return {
      queue,
      waitingCount,
      currentNumber: queue.currentNumber,
      servingNumber: servingItem?.number || null,
      calledNumber: calledItem?.number || null,
      calledItem,
      servingItem,
    };
  }

  // ========== 预约评价系统 ==========

  async createReview(dto: CreateReviewDto, userId: string): Promise<AppointmentReview> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: dto.appointmentId },
      relations: ['member', 'employee'],
    });

    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }

    // 检查是否已评价
    const existing = await this.reviewRepository.findOne({
      where: { appointmentId: dto.appointmentId },
    });

    if (existing) {
      throw new ConflictException('该预约已评价');
    }

    const review = this.reviewRepository.create({
      appointmentId: dto.appointmentId,
      memberId: appointment.memberId,
      employeeId: appointment.employeeId,
      rating: dto.rating,
      serviceRating: dto.serviceRating,
      environmentRating: dto.environmentRating,
      attitudeRating: dto.attitudeRating,
      content: dto.content,
      tags: dto.tags,
      imageUrls: dto.imageUrls,
      isAnonymous: dto.isAnonymous || false,
      createdBy: userId,
    });

    return this.reviewRepository.save(review);
  }

  async findReviews(query: QueryReviewDto): Promise<AppointmentReview[]> {
    const where: any = {};

    if (query.appointmentId) where.appointmentId = query.appointmentId;
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.memberId) where.memberId = query.memberId;
    if (query.rating) where.rating = query.rating;

    if (query.startDate && query.endDate) {
      where.createdAt = Between(new Date(query.startDate), new Date(query.endDate));
    }

    return this.reviewRepository.find({
      where,
      relations: ['appointment', 'member', 'employee', 'appointment.service'],
      order: { createdAt: 'DESC' },
    });
  }

  async findReview(id: string): Promise<AppointmentReview> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['appointment', 'member', 'employee', 'appointment.service'],
    });

    if (!review) {
      throw new NotFoundException('评价不存在');
    }

    return review;
  }

  async updateReview(id: string, dto: UpdateReviewDto): Promise<AppointmentReview> {
    const review = await this.findReview(id);
    Object.assign(review, dto);
    return this.reviewRepository.save(review);
  }

  async replyReview(id: string, dto: ReplyReviewDto, userId: string): Promise<AppointmentReview> {
    const review = await this.findReview(id);
    review.replyContent = dto.content;
    review.repliedAt = new Date();
    return this.reviewRepository.save(review);
  }

  async getReviewStatistics(employeeId?: string): Promise<any> {
    const query = this.reviewRepository.createQueryBuilder('review');

    if (employeeId) {
      query.where('review.employeeId = :employeeId', { employeeId });
    }

    const total = await query.getCount();

    const avgRating = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where(employeeId ? 'review.employeeId = :employeeId' : '1=1', { employeeId })
      .getRawOne();

    const avgServiceRating = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.serviceRating)', 'avg')
      .where('review.serviceRating IS NOT NULL')
      .andWhere(employeeId ? 'review.employeeId = :employeeId' : '1=1', { employeeId })
      .getRawOne();

    const avgEnvironmentRating = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.environmentRating)', 'avg')
      .where('review.environmentRating IS NOT NULL')
      .andWhere(employeeId ? 'review.employeeId = :employeeId' : '1=1', { employeeId })
      .getRawOne();

    const avgAttitudeRating = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.attitudeRating)', 'avg')
      .where('review.attitudeRating IS NOT NULL')
      .andWhere(employeeId ? 'review.employeeId = :employeeId' : '1=1', { employeeId })
      .getRawOne();

    // 评分分布
    const ratingDistribution = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where(employeeId ? 'review.employeeId = :employeeId' : '1=1', { employeeId })
      .groupBy('review.rating')
      .getRawMany();

    return {
      total,
      avgRating: parseFloat(avgRating?.avg || '0').toFixed(2),
      avgServiceRating: parseFloat(avgServiceRating?.avg || '0').toFixed(2),
      avgEnvironmentRating: parseFloat(avgEnvironmentRating?.avg || '0').toFixed(2),
      avgAttitudeRating: parseFloat(avgAttitudeRating?.avg || '0').toFixed(2),
      ratingDistribution,
    };
  }

  // ========== 预约日历视图 ==========

  async getCalendarView(query: CalendarQueryDto): Promise<any> {
    const date = new Date(query.date);
    const view = query.view || 'day';
    const employeeId = query.employeeId;

    let startDate: Date;
    let endDate: Date;

    if (view === 'day') {
      startDate = new Date(date);
      endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
    } else if (view === 'week') {
      const dayOfWeek = date.getDay();
      startDate = new Date(date);
      startDate.setDate(startDate.getDate() - dayOfWeek);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
    } else {
      // month
      startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    }

    const where: any = {
      appointmentDate: Between(startDate, endDate),
      status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED]),
    };

    if (employeeId) where.employeeId = employeeId;

    const appointments = await this.appointmentRepository.find({
      where,
      relations: ['member', 'employee', 'service'],
      order: { appointmentDate: 'ASC', startTime: 'ASC' },
    });

    // 按日期分组
    const calendarData: { [key: string]: any[] } = {};
    
    for (const appt of appointments) {
      const dateKey = appt.appointmentDate.toISOString().split('T')[0];
      if (!calendarData[dateKey]) {
        calendarData[dateKey] = [];
      }
      calendarData[dateKey].push(appt);
    }

    // 统计信息
    const statistics = {
      total: appointments.length,
      pending: appointments.filter(a => a.status === AppointmentStatus.PENDING).length,
      confirmed: appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length,
      completed: appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length,
    };

    return {
      view,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      calendarData,
      statistics,
    };
  }

  // ========== 预约冲突检测 ==========

  async checkConflict(dto: CheckConflictDto): Promise<{ hasConflict: boolean; conflicts: Appointment[] }> {
    const where: any = {
      employeeId: dto.employeeId,
      appointmentDate: new Date(dto.appointmentDate),
      status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
    };

    const existingAppointments = await this.appointmentRepository.find({ where });

    const conflicts: Appointment[] = [];
    const newStart = dto.startTime;
    const newEnd = dto.endTime;

    for (const appt of existingAppointments) {
      // 排除自己
      if (dto.excludeId && appt.id === dto.excludeId) continue;

      if (this.isTimeOverlap(newStart, newEnd, appt.startTime, appt.endTime)) {
        conflicts.push(appt);
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  private isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && end1 > start2;
  }
}
