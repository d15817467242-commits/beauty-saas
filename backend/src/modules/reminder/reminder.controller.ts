import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  // ========== 生日提醒 ==========

  @Get('birthday')
  getBirthdayReminders(@Query('days') days?: string) {
    const dayCount = days ? parseInt(days, 10) : 7;
    return this.reminderService.getBirthdayReminders(dayCount);
  }

  // ========== 久未到店提醒 ==========

  @Get('inactive')
  getInactiveReminders(@Query('days') days?: string) {
    const dayCount = days ? parseInt(days, 10) : 30;
    return this.reminderService.getInactiveReminders(dayCount);
  }

  // ========== 消费周期提醒 ==========

  @Get('cycle')
  getConsumptionCycleReminders() {
    return this.reminderService.getConsumptionCycleReminders();
  }

  // ========== 卡升级提醒 ==========

  @Get('card-upgrade')
  getCardUpgradeReminders() {
    return this.reminderService.getCardUpgradeReminders();
  }

  // ========== 消费回访提醒 ==========

  @Get('visit-follow-up')
  getVisitFollowUpReminders(@Query('days') days?: string) {
    const dayCount = days ? parseInt(days, 10) : 7;
    return this.reminderService.getVisitFollowUpReminders(dayCount);
  }

  // ========== 积分到期提醒 ==========

  @Get('points-expiry')
  getPointsExpiryReminders(@Query('days') days?: string) {
    const dayCount = days ? parseInt(days, 10) : 30;
    return this.reminderService.getPointsExpiryReminders(dayCount);
  }

  // ========== 次卡到期提醒 ==========

  @Get('count-card-expiry')
  getCountCardExpiryReminders(@Query('days') days?: string) {
    const dayCount = days ? parseInt(days, 10) : 30;
    return this.reminderService.getCountCardExpiryReminders(dayCount);
  }

  // ========== 综合提醒概览 ==========

  @Get('overview')
  getReminderOverview() {
    return this.reminderService.getReminderOverview();
  }
}
