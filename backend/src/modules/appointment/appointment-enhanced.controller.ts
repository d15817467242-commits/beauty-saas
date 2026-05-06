import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { AppointmentEnhancedService } from './appointment-enhanced.service';
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentEnhancedController {
  constructor(private readonly enhancedService: AppointmentEnhancedService) {}

  // ========== 预约提醒 ==========

  @Post('reminders')
  createReminder(@Body() dto: CreateReminderDto, @Request() req: any) {
    return this.enhancedService.createReminder(dto, req.user.userId);
  }

  @Get('reminders')
  findReminders(@Query() query: QueryReminderDto) {
    return this.enhancedService.findReminders(query);
  }

  @Get('reminders/pending')
  getPendingReminders() {
    return this.enhancedService.getPendingReminders();
  }

  @Post('reminders/send')
  sendReminder(@Body() dto: SendReminderDto) {
    return this.enhancedService.sendReminder(dto);
  }

  // ========== 排队管理 ==========

  @Post('queues')
  createQueue(@Body() dto: CreateQueueDto, @Request() req: any) {
    return this.enhancedService.createQueue(dto, req.user.userId);
  }

  @Get('queues')
  findQueues(@Query() query: QueryQueueDto) {
    return this.enhancedService.findQueues(query);
  }

  @Get('queues/:id')
  findQueue(@Param('id') id: string) {
    return this.enhancedService.findQueue(id);
  }

  @Patch('queues/:id')
  updateQueue(@Param('id') id: string, @Body() dto: UpdateQueueDto) {
    return this.enhancedService.updateQueue(id, dto);
  }

  @Get('queues/:id/status')
  getQueueStatus(@Param('id') id: string) {
    return this.enhancedService.getQueueStatus(id);
  }

  // 排队取号
  @Post('queues/take-number')
  takeQueueNumber(@Body() dto: TakeQueueNumberDto, @Request() req: any) {
    return this.enhancedService.takeQueueNumber(dto, req.user.userId);
  }

  // 排队叫号
  @Post('queues/call-number')
  callQueueNumber(@Body() dto: CallQueueNumberDto) {
    return this.enhancedService.callQueueNumber(dto);
  }

  // 排队项管理
  @Get('queue-items')
  findQueueItems(@Query() query: QueryQueueItemDto) {
    return this.enhancedService.findQueueItems(query);
  }

  @Patch('queue-items/:id')
  updateQueueItem(@Param('id') id: string, @Body() dto: UpdateQueueItemDto) {
    return this.enhancedService.updateQueueItem(id, dto);
  }

  // ========== 评价管理 ==========

  @Post('reviews')
  createReview(@Body() dto: CreateReviewDto, @Request() req: any) {
    return this.enhancedService.createReview(dto, req.user.userId);
  }

  @Get('reviews')
  findReviews(@Query() query: QueryReviewDto) {
    return this.enhancedService.findReviews(query);
  }

  @Get('reviews/statistics')
  getReviewStatistics(@Query('employeeId') employeeId?: string) {
    return this.enhancedService.getReviewStatistics(employeeId);
  }

  @Get('reviews/:id')
  findReview(@Param('id') id: string) {
    return this.enhancedService.findReview(id);
  }

  @Patch('reviews/:id')
  updateReview(@Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.enhancedService.updateReview(id, dto);
  }

  @Post('reviews/:id/reply')
  replyReview(@Param('id') id: string, @Body() dto: ReplyReviewDto, @Request() req: any) {
    return this.enhancedService.replyReview(id, dto, req.user.userId);
  }

  // ========== 日历视图 ==========

  @Get('calendar')
  getCalendarView(@Query() query: CalendarQueryDto) {
    return this.enhancedService.getCalendarView(query);
  }

  // ========== 冲突检测 ==========

  @Post('check-conflict')
  checkConflict(@Body() dto: CheckConflictDto) {
    return this.enhancedService.checkConflict(dto);
  }
}
