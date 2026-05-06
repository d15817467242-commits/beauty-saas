import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, IsNull, MoreThan, LessThan } from 'typeorm';
import { Member } from '../member/member.entity';
import { Consumption } from '../cashier/consumption.entity';
import { MemberCountCard } from '../count-card/member-count-card.entity';

export interface BirthdayReminder {
  memberId: string;
  memberName: string;
  memberPhone: string;
  memberLevel: string;
  birthday: Date;
  daysUntilBirthday: number;
  totalSpent: number;
  lastVisitAt: Date | null;
}

export interface InactiveReminder {
  memberId: string;
  memberName: string;
  memberPhone: string;
  memberLevel: string;
  lastVisitAt: Date | null;
  daysSinceLastVisit: number;
  totalSpent: number;
  visitCount: number;
}

export interface ConsumptionCycleReminder {
  memberId: string;
  memberName: string;
  memberPhone: string;
  memberLevel: string;
  avgDaysBetweenVisits: number;
  daysSinceLastVisit: number;
  expectedVisitDate: Date;
  totalSpent: number;
}

export interface CardUpgradeReminder {
  memberId: string;
  memberName: string;
  memberPhone: string;
  currentLevel: string;
  nextLevel: string;
  currentSpent: number;
  requiredSpent: number;
  remainingAmount: number;
  progress: number;
}

export interface VisitFollowUpReminder {
  memberId: string;
  memberName: string;
  memberPhone: string;
  lastVisitAt: Date;
  daysSinceLastVisit: number;
  lastService: string;
  lastEmployee: string;
  totalSpent: number;
}

export interface PointsExpiryReminder {
  memberId: string;
  memberName: string;
  memberPhone: string;
  currentPoints: number;
  expiringPoints: number;
  expiryDate: Date;
  daysUntilExpiry: number;
}

export interface CountCardExpiryReminder {
  memberId: string;
  memberName: string;
  memberPhone: string;
  countCardName: string;
  remainingCount: number;
  expiryDate: Date;
  daysUntilExpiry: number;
}

@Injectable()
export class ReminderService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(Consumption)
    private consumptionRepository: Repository<Consumption>,
    @InjectRepository(MemberCountCard)
    private memberCountCardRepository: Repository<MemberCountCard>,
  ) {}

  // ========== 生日提醒 ==========

  async getBirthdayReminders(days: number = 7): Promise<BirthdayReminder[]> {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    // 获取所有会员
    const members = await this.memberRepository
      .createQueryBuilder('member')
      .where('member.birthday IS NOT NULL')
      .getMany();

    const reminders: BirthdayReminder[] = [];

    for (const member of members) {
      if (!member.birthday) continue;

      const birthday = new Date(member.birthday);
      let nextBirthday = new Date(currentYear, birthday.getMonth(), birthday.getDate());
      
      // 如果今年的生日已过，计算明年的生日
      if (nextBirthday < today) {
        nextBirthday = new Date(currentYear + 1, birthday.getMonth(), birthday.getDate());
      }

      const diffTime = nextBirthday.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= days) {
        reminders.push({
          memberId: member.id,
          memberName: member.name,
          memberPhone: member.phone,
          memberLevel: member.level,
          birthday: member.birthday,
          daysUntilBirthday: diffDays,
          totalSpent: Number(member.totalSpent) || 0,
          lastVisitAt: member.lastVisitAt,
        });
      }
    }

    // 按距离生日的天数排序
    return reminders.sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
  }

  // ========== 久未到店提醒 ==========

  async getInactiveReminders(days: number = 30): Promise<InactiveReminder[]> {
    const today = new Date();
    const thresholdDate = new Date(today);
    thresholdDate.setDate(thresholdDate.getDate() - days);

    // 获取所有会员
    const members = await this.memberRepository.find();

    const reminders: InactiveReminder[] = [];

    for (const member of members) {
      const lastVisit = member.lastVisitAt ? new Date(member.lastVisitAt) : null;
      
      // 如果从未到店或最后到店时间超过阈值
      if (!lastVisit || lastVisit < thresholdDate) {
        const daysSinceLastVisit = lastVisit 
          ? Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
          : 999; // 从未到店

        reminders.push({
          memberId: member.id,
          memberName: member.name,
          memberPhone: member.phone,
          memberLevel: member.level,
          lastVisitAt: lastVisit,
          daysSinceLastVisit,
          totalSpent: Number(member.totalSpent) || 0,
          visitCount: member.visitCount || 0,
        });
      }
    }

    // 按最后到店时间排序（最久未到店的排前面）
    return reminders.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);
  }

  // ========== 消费周期提醒 ==========

  async getConsumptionCycleReminders(): Promise<ConsumptionCycleReminder[]> {
    const today = new Date();
    const members = await this.memberRepository.find();
    const reminders: ConsumptionCycleReminder[] = [];

    for (const member of members) {
      // 获取会员的消费记录
      const consumptions = await this.consumptionRepository.find({
        where: { memberId: member.id },
        order: { createdAt: 'ASC' },
      });

      if (consumptions.length < 2) continue; // 至少需要2次消费才能计算周期

      // 计算平均消费周期
      const visitDates = consumptions.map(c => new Date(c.createdAt));
      let totalDays = 0;
      
      for (let i = 1; i < visitDates.length; i++) {
        const diff = Math.abs(visitDates[i].getTime() - visitDates[i-1].getTime());
        totalDays += Math.floor(diff / (1000 * 60 * 60 * 24));
      }

      const avgDaysBetweenVisits = Math.floor(totalDays / (visitDates.length - 1));
      
      // 计算预期下次到店时间
      const lastVisit = member.lastVisitAt ? new Date(member.lastVisitAt) : visitDates[visitDates.length - 1];
      const expectedVisitDate = new Date(lastVisit);
      expectedVisitDate.setDate(expectedVisitDate.getDate() + avgDaysBetweenVisits);

      const daysSinceLastVisit = Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

      // 如果已经超过预期到店时间，添加提醒
      if (today >= expectedVisitDate) {
        reminders.push({
          memberId: member.id,
          memberName: member.name,
          memberPhone: member.phone,
          memberLevel: member.level,
          avgDaysBetweenVisits,
          daysSinceLastVisit,
          expectedVisitDate,
          totalSpent: Number(member.totalSpent) || 0,
        });
      }
    }

    // 按超出预期天数排序
    return reminders.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);
  }

  // ========== 综合提醒概览 ==========

  async getReminderOverview(): Promise<any> {
    const [birthdayReminders, inactiveReminders, cycleReminders, cardUpgradeReminders, visitFollowUpReminders, pointsExpiryReminders, countCardExpiryReminders] = await Promise.all([
      this.getBirthdayReminders(7),
      this.getInactiveReminders(30),
      this.getConsumptionCycleReminders(),
      this.getCardUpgradeReminders(),
      this.getVisitFollowUpReminders(7),
      this.getPointsExpiryReminders(30),
      this.getCountCardExpiryReminders(30),
    ]);

    return {
      birthday: {
        count: birthdayReminders.length,
        items: birthdayReminders.slice(0, 10), // 只返回前10条
      },
      inactive: {
        count: inactiveReminders.length,
        items: inactiveReminders.slice(0, 10),
      },
      cycle: {
        count: cycleReminders.length,
        items: cycleReminders.slice(0, 10),
      },
      cardUpgrade: {
        count: cardUpgradeReminders.length,
        items: cardUpgradeReminders.slice(0, 10),
      },
      visitFollowUp: {
        count: visitFollowUpReminders.length,
        items: visitFollowUpReminders.slice(0, 10),
      },
      pointsExpiry: {
        count: pointsExpiryReminders.length,
        items: pointsExpiryReminders.slice(0, 10),
      },
      countCardExpiry: {
        count: countCardExpiryReminders.length,
        items: countCardExpiryReminders.slice(0, 10),
      },
      total: birthdayReminders.length + inactiveReminders.length + cycleReminders.length + 
             cardUpgradeReminders.length + visitFollowUpReminders.length + 
             pointsExpiryReminders.length + countCardExpiryReminders.length,
    };
  }

  // ========== 卡升级提醒 ==========

  async getCardUpgradeReminders(): Promise<CardUpgradeReminder[]> {
    const members = await this.memberRepository.find();
    const reminders: CardUpgradeReminder[] = [];

    // 等级消费要求
    const levelRequirements: Record<string, { next: string; required: number }> = {
      normal: { next: 'silver', required: 1000 },
      silver: { next: 'gold', required: 5000 },
      gold: { next: 'diamond', required: 20000 },
    };

    for (const member of members) {
      const requirement = levelRequirements[member.level];
      if (!requirement) continue; // 已是最高等级

      const currentSpent = Number(member.totalSpent) || 0;
      const progress = currentSpent / requirement.required;

      // 如果消费进度超过80%，提醒升级
      if (progress >= 0.8 && progress < 1) {
        reminders.push({
          memberId: member.id,
          memberName: member.name,
          memberPhone: member.phone,
          currentLevel: member.level,
          nextLevel: requirement.next,
          currentSpent,
          requiredSpent: requirement.required,
          remainingAmount: requirement.required - currentSpent,
          progress: Math.round(progress * 100),
        });
      }
    }

    return reminders.sort((a, b) => b.progress - a.progress);
  }

  // ========== 消费回访提醒 ==========

  async getVisitFollowUpReminders(days: number = 7): Promise<VisitFollowUpReminder[]> {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const reminders: VisitFollowUpReminder[] = [];

    // 获取指定日期范围内的消费记录
    const consumptions = await this.consumptionRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.member', 'member')
      .leftJoinAndSelect('c.employee', 'employee')
      .where('c.createdAt >= :startDate', { startDate })
      .andWhere('c.createdAt < :endDate', { endDate: new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000) })
      .getMany();

    for (const consumption of consumptions) {
      if (!consumption.member) continue;

      const lastVisit = new Date(consumption.createdAt);
      const daysSinceLastVisit = Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

      // 获取消费的服务名称
      const serviceName = consumption.items?.map((i: any) => i.serviceName).join(', ') || '';

      reminders.push({
        memberId: consumption.member.id,
        memberName: consumption.member.name,
        memberPhone: consumption.member.phone,
        lastVisitAt: lastVisit,
        daysSinceLastVisit,
        lastService: serviceName,
        lastEmployee: consumption.employee?.name || '',
        totalSpent: Number(consumption.member.totalSpent) || 0,
      });
    }

    // 去重（同一会员只保留最近一次）
    const uniqueReminders = new Map<string, VisitFollowUpReminder>();
    for (const r of reminders) {
      if (!uniqueReminders.has(r.memberId) || uniqueReminders.get(r.memberId)!.daysSinceLastVisit > r.daysSinceLastVisit) {
        uniqueReminders.set(r.memberId, r);
      }
    }

    return Array.from(uniqueReminders.values()).sort((a, b) => a.daysSinceLastVisit - b.daysSinceLastVisit);
  }

  // ========== 积分到期提醒 ==========

  async getPointsExpiryReminders(days: number = 30): Promise<PointsExpiryReminder[]> {
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 假设积分1年后过期
    expiryDate.setDate(expiryDate.getDate() + days);

    const members = await this.memberRepository.find({
      where: {
        points: MoreThan(0),
      },
    });

    const reminders: PointsExpiryReminder[] = [];

    for (const member of members) {
      if (member.points <= 0) continue;

      // 这里简化处理，实际应该有积分获取时间记录
      // 假设所有积分在年底过期
      const yearEnd = new Date(today.getFullYear(), 11, 31);
      const daysUntilExpiry = Math.floor((yearEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= days && daysUntilExpiry >= 0) {
        reminders.push({
          memberId: member.id,
          memberName: member.name,
          memberPhone: member.phone,
          currentPoints: member.points,
          expiringPoints: member.points, // 简化处理
          expiryDate: yearEnd,
          daysUntilExpiry,
        });
      }
    }

    return reminders.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }

  // ========== 次卡到期提醒 ==========

  async getCountCardExpiryReminders(days: number = 30): Promise<CountCardExpiryReminder[]> {
    const today = new Date();
    const thresholdDate = new Date(today);
    thresholdDate.setDate(thresholdDate.getDate() + days);

    const memberCountCards = await this.memberCountCardRepository
      .createQueryBuilder('mcc')
      .leftJoinAndSelect('mcc.member', 'member')
      .leftJoinAndSelect('mcc.countCardPackage', 'package')
      .where('mcc.remainingCount > 0')
      .andWhere('mcc.expireTime IS NOT NULL')
      .andWhere('mcc.expireTime <= :thresholdDate', { thresholdDate })
      .andWhere('mcc.expireTime > :today', { today })
      .getMany();

    const reminders: CountCardExpiryReminder[] = [];

    for (const mcc of memberCountCards) {
      if (!mcc.member || !mcc.package) continue;

      const expiryDate = new Date(mcc.expireDate);
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      reminders.push({
        memberId: mcc.member.id,
        memberName: mcc.member.name,
        memberPhone: mcc.member.phone,
        countCardName: mcc.package.name,
        remainingCount: mcc.remainingCount,
        expiryDate,
        daysUntilExpiry,
      });
    }

    return reminders.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }
}
