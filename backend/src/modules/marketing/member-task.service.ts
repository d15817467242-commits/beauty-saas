import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource, LessThan, MoreThan } from 'typeorm';
import {
  MemberTask,
  TaskReward,
  MemberTaskRecord,
  TaskStatistics,
  TaskType,
  TaskAction,
  TaskStatus,
  RewardType,
  TaskRecordStatus,
} from './member-task.entity';
import {
  CreateMemberTaskDto,
  UpdateMemberTaskDto,
  CreateTaskRewardDto,
  UpdateTaskRewardDto,
  CompleteTaskDto,
  ClaimRewardDto,
  TaskQueryDto,
  TaskStatisticsQueryDto,
} from './dto/member-task.dto';

@Injectable()
export class MemberTaskService {
  constructor(
    @InjectRepository(MemberTask)
    private taskRepository: Repository<MemberTask>,
    @InjectRepository(TaskReward)
    private rewardRepository: Repository<TaskReward>,
    @InjectRepository(MemberTaskRecord)
    private recordRepository: Repository<MemberTaskRecord>,
    @InjectRepository(TaskStatistics)
    private statisticsRepository: Repository<TaskStatistics>,
    private dataSource: DataSource,
  ) {}

  // ==================== 任务管理 ====================

  async create(dto: CreateMemberTaskDto, userId: string): Promise<MemberTask> {
    const task = this.taskRepository.create({
      name: dto.name,
      description: dto.description,
      type: dto.type,
      action: dto.action,
      targetCount: dto.targetCount ?? 1,
      maxProgress: dto.maxProgress ?? 1,
      sortOrder: dto.sortOrder ?? 0,
      actionConfig: dto.actionConfig,
      targetConditions: dto.targetConditions,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      createdBy: userId,
      status: TaskStatus.ACTIVE,
    });
    return this.taskRepository.save(task);
  }

  async findAll(dto: TaskQueryDto): Promise<{ list: MemberTask[]; total: number }> {
    const queryBuilder = this.taskRepository.createQueryBuilder('t');

    if (dto.type) {
      queryBuilder.andWhere('t.type = :type', { type: dto.type });
    }
    if (dto.action) {
      queryBuilder.andWhere('t.action = :action', { action: dto.action });
    }
    if (dto.status) {
      queryBuilder.andWhere('t.status = :status', { status: dto.status });
    }

    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;

    queryBuilder
      .orderBy('t.sortOrder', 'ASC')
      .addOrderBy('t.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await queryBuilder.getManyAndCount();
    return { list, total };
  }

  async findActiveTasks(): Promise<MemberTask[]> {
    const now = new Date();
    const queryBuilder = this.taskRepository
      .createQueryBuilder('t')
      .where('t.status = :status', { status: TaskStatus.ACTIVE });

    queryBuilder.andWhere(
      '(t.startTime IS NULL OR t.startTime <= :now)',
      { now }
    );
    queryBuilder.andWhere(
      '(t.endTime IS NULL OR t.endTime >= :now)',
      { now }
    );

    return queryBuilder
      .orderBy('t.sortOrder', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<MemberTask> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['rewards'],
    });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    return task;
  }

  async update(id: string, dto: UpdateMemberTaskDto): Promise<MemberTask> {
    const task = await this.findOne(id);
    Object.assign(task, dto);
    return this.taskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }

  // ==================== 奖励管理 ====================

  async createReward(dto: CreateTaskRewardDto): Promise<TaskReward> {
    const task = await this.findOne(dto.taskId);
    const reward = this.rewardRepository.create(dto);
    return this.rewardRepository.save(reward);
  }

  async findRewards(taskId: string): Promise<TaskReward[]> {
    return this.rewardRepository.find({
      where: { taskId, enabled: true },
      order: { createdAt: 'ASC' },
    });
  }

  async updateReward(id: string, dto: UpdateTaskRewardDto): Promise<TaskReward> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException('奖励不存在');
    }
    Object.assign(reward, dto);
    return this.rewardRepository.save(reward);
  }

  async removeReward(id: string): Promise<void> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException('奖励不存在');
    }
    await this.rewardRepository.remove(reward);
  }

  // ==================== 任务完成 ====================

  async completeTask(dto: CompleteTaskDto, memberId: string): Promise<MemberTaskRecord> {
    const task = await this.findOne(dto.taskId);

    if (task.status !== TaskStatus.ACTIVE) {
      throw new BadRequestException('任务未启用');
    }

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 检查任务时间范围
    if (task.startTime && now < task.startTime) {
      throw new BadRequestException('任务尚未开始');
    }
    if (task.endTime && now > task.endTime) {
      throw new BadRequestException('任务已结束');
    }

    // 根据任务类型查找或创建记录
    let record: MemberTaskRecord | null = null;

    switch (task.type) {
      case TaskType.DAILY:
        // 每日任务：查找当天的记录
        record = await this.recordRepository.findOne({
          where: {
            taskId: dto.taskId,
            memberId,
            taskDate: today,
          },
        });
        break;

      case TaskType.WEEKLY:
        // 每周任务：查找本周的记录
        const weekStart = this.getWeekStart(now);
        record = await this.recordRepository.findOne({
          where: {
            taskId: dto.taskId,
            memberId,
            startTime: MoreThan(weekStart),
          },
        });
        break;

      case TaskType.MONTHLY:
        // 每月任务：查找本月的记录
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        record = await this.recordRepository.findOne({
          where: {
            taskId: dto.taskId,
            memberId,
            startTime: MoreThan(monthStart),
          },
        });
        break;

      case TaskType.NEWBIE:
      case TaskType.ACHIEVEMENT:
      case TaskType.SPECIAL:
        // 一次性任务：查找是否有记录
        record = await this.recordRepository.findOne({
          where: { taskId: dto.taskId, memberId },
        });
        break;
    }

    const progress = dto.progress || 1;

    if (record) {
      // 更新进度
      if (record.status === TaskRecordStatus.COMPLETED || record.status === TaskRecordStatus.CLAIMED) {
        throw new BadRequestException('任务已完成');
      }

      record.currentProgress += progress;
      if (record.currentProgress >= record.targetProgress) {
        record.currentProgress = record.targetProgress;
        record.status = TaskRecordStatus.COMPLETED;
        record.completeTime = now;
      }

      await this.recordRepository.save(record);
    } else {
      // 创建新记录
      const newRecord = this.recordRepository.create({
        taskId: dto.taskId,
        memberId,
        currentProgress: progress,
        targetProgress: task.maxProgress,
        status: progress >= task.maxProgress ? TaskRecordStatus.COMPLETED : TaskRecordStatus.PENDING,
        taskDate: today,
        startTime: now,
        completeTime: progress >= task.maxProgress ? now : undefined,
        extraInfo: dto.extraInfo,
      });

      record = await this.recordRepository.save(newRecord);
    }

    // 更新统计
    await this.updateTaskStatistics(dto.taskId, today, {
      participateCount: record.currentProgress === progress ? 1 : 0,
      completeCount: record.status === TaskRecordStatus.COMPLETED ? 1 : 0,
    });

    return record;
  }

  // 领取奖励
  async claimReward(dto: ClaimRewardDto, memberId: string): Promise<MemberTaskRecord> {
    const record = await this.recordRepository.findOne({
      where: { id: dto.recordId, memberId },
      relations: ['task', 'task.rewards'],
    });

    if (!record) {
      throw new NotFoundException('任务记录不存在');
    }

    if (record.status === TaskRecordStatus.CLAIMED) {
      throw new BadRequestException('奖励已领取');
    }

    if (record.status !== TaskRecordStatus.COMPLETED) {
      throw new BadRequestException('任务未完成，无法领取奖励');
    }

    // 计算奖励
    const rewards = await this.calculateRewards(record.task.rewards);

    const now = new Date();
    record.status = TaskRecordStatus.CLAIMED;
    record.claimTime = now;
    record.rewardDetails = rewards;

    // 更新奖励发放统计
    for (const reward of rewards) {
      if (reward.type === RewardType.POINTS) {
        await this.statisticsRepository.increment(
          { taskId: record.taskId },
          'pointsGiven',
          reward.value,
        );
      } else if (reward.type === RewardType.COUPON) {
        await this.statisticsRepository.increment(
          { taskId: record.taskId },
          'couponsGiven',
          1,
        );
      }
    }

    await this.statisticsRepository.increment(
      { taskId: record.taskId },
      'claimCount',
      1,
    );

    return this.recordRepository.save(record);
  }

  // 计算奖励（支持概率）
  private async calculateRewards(rewards: TaskReward[]): Promise<any[]> {
    const result: any[] = [];

    for (const reward of rewards) {
      if (!reward.enabled) continue;

      // 检查发放数量限制
      if (reward.maxCount > 0 && reward.givenCount >= reward.maxCount) {
        continue;
      }

      // 概率判断
      if (reward.probability < 100) {
        const random = Math.random() * 100;
        if (random > reward.probability) {
          continue;
        }
      }

      result.push({
        type: reward.type,
        value: reward.rewardValue,
        name: reward.rewardName,
        id: reward.rewardId,
        quantity: reward.rewardQuantity,
      });

      // 更新发放数量
      await this.rewardRepository.increment({ id: reward.id }, 'givenCount', 1);
    }

    return result;
  }

  // ==================== 任务记录查询 ====================

  async getMemberTasks(memberId: string, type?: TaskType): Promise<any[]> {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 获取所有活跃任务
    const tasksQuery = this.taskRepository
      .createQueryBuilder('t')
      .where('t.status = :status', { status: TaskStatus.ACTIVE });

    if (type) {
      tasksQuery.andWhere('t.type = :type', { type });
    }

    const tasks = await tasksQuery.getMany();
    const result: any[] = [];

    for (const task of tasks) {
      // 查找会员的任务记录
      let record: MemberTaskRecord | null = null;

      if (task.type === TaskType.DAILY) {
        record = await this.recordRepository.findOne({
          where: { taskId: task.id, memberId, taskDate: today },
        });
      } else {
        record = await this.recordRepository.findOne({
          where: { taskId: task.id, memberId },
        });
      }

      result.push({
        task,
        record: record,
        progress: record?.currentProgress || 0,
        target: task.maxProgress,
        completed: record?.status === TaskRecordStatus.COMPLETED || record?.status === TaskRecordStatus.CLAIMED,
        claimed: record?.status === TaskRecordStatus.CLAIMED,
      });
    }

    return result;
  }

  async getMemberRecords(memberId: string): Promise<MemberTaskRecord[]> {
    return this.recordRepository.find({
      where: { memberId },
      relations: ['task'],
      order: { createdAt: 'DESC' },
    });
  }

  // ==================== 任务统计 ====================

  async getStatistics(dto: TaskStatisticsQueryDto): Promise<any> {
    const task = await this.findOne(dto.taskId);

    const queryBuilder = this.statisticsRepository
      .createQueryBuilder('s')
      .where('s.taskId = :taskId', { taskId: dto.taskId });

    if (dto.startDate) {
      queryBuilder.andWhere('s.statDate >= :startDate', { startDate: dto.startDate });
    }
    if (dto.endDate) {
      queryBuilder.andWhere('s.statDate <= :endDate', { endDate: dto.endDate });
    }

    const stats = await queryBuilder.orderBy('s.statDate', 'ASC').getMany();

    const summary = {
      totalParticipate: stats.reduce((sum, s) => sum + s.participateCount, 0),
      totalComplete: stats.reduce((sum, s) => sum + s.completeCount, 0),
      totalClaim: stats.reduce((sum, s) => sum + s.claimCount, 0),
      totalPointsGiven: stats.reduce((sum, s) => sum + s.pointsGiven, 0),
      totalCouponsGiven: stats.reduce((sum, s) => sum + s.couponsGiven, 0),
      avgCompletionRate: stats.length > 0
        ? (stats.reduce((sum, s) => sum + Number(s.completionRate), 0) / stats.length).toFixed(2)
        : 0,
    };

    return {
      task: {
        id: task.id,
        name: task.name,
        type: task.type,
        action: task.action,
        status: task.status,
      },
      summary,
      dailyStats: stats,
    };
  }

  // 更新任务统计
  private async updateTaskStatistics(
    taskId: string,
    date: Date,
    data: {
      participateCount?: number;
      completeCount?: number;
      claimCount?: number;
    },
  ): Promise<void> {
    const statDate = new Date(date);
    statDate.setHours(0, 0, 0, 0);

    let stat = await this.statisticsRepository.findOne({
      where: { taskId, statDate },
    });

    if (!stat) {
      stat = this.statisticsRepository.create({
        taskId,
        statDate,
        participateCount: 0,
        completeCount: 0,
        claimCount: 0,
        completionRate: 0,
        pointsGiven: 0,
        couponsGiven: 0,
      });
    }

    if (data.participateCount) stat.participateCount += data.participateCount;
    if (data.completeCount) stat.completeCount += data.completeCount;
    if (data.claimCount) stat.claimCount += data.claimCount;

    // 计算完成率
    if (stat.participateCount > 0) {
      stat.completionRate = (stat.completeCount / stat.participateCount) * 100;
    }

    await this.statisticsRepository.save(stat);
  }

  // 获取周开始时间
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }
}
