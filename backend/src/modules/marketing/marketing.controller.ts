import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { GroupBuyService } from './group-buy.service';
import { FlashSaleService } from './flash-sale.service';
import { NewbieGiftService } from './newbie-gift.service';
import { ReferralService } from './referral.service';
import { MarketingCampaignService } from './marketing-campaign.service';
import { CouponUsageService } from './coupon-usage.service';
import { PointsMallService } from './points-mall.service';
import { MemberTaskService } from './member-task.service';
import { MarketingAnalysisService } from './marketing-analysis.service';

// DTOs
import { CreateCouponDto, UpdateCouponDto, ReceiveCouponDto, UseCouponDto } from './dto/coupon.dto';
import { CreateGroupBuyDto, UpdateGroupBuyDto, JoinGroupBuyDto } from './dto/group-buy.dto';
import { CreateFlashSaleDto, UpdateFlashSaleDto, BuyFlashSaleDto } from './dto/flash-sale.dto';
import { CreateNewbieGiftDto, UpdateNewbieGiftDto } from './dto/newbie-gift.dto';
import { CreateReferralConfigDto, CreateReferralDto } from './dto/referral.dto';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CreateCampaignRuleDto,
  UpdateCampaignRuleDto,
  CampaignEffectQueryDto,
} from './dto/marketing-campaign.dto';
import {
  VerifyCouponDto,
  RefundCouponDto,
  CouponStatisticsQueryDto,
  CouponUsageQueryDto,
} from './dto/coupon-usage.dto';
import {
  CreatePointsGoodsDto,
  UpdatePointsGoodsDto,
  ExchangeGoodsDto,
  UpdateExchangeStatusDto,
  PointsMallQueryDto,
  ExchangeQueryDto,
} from './dto/points-mall.dto';
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

@Controller('marketing')
export class MarketingController {
  constructor(
    private couponService: CouponService,
    private groupBuyService: GroupBuyService,
    private flashSaleService: FlashSaleService,
    private newbieGiftService: NewbieGiftService,
    private referralService: ReferralService,
    private campaignService: MarketingCampaignService,
    private couponUsageService: CouponUsageService,
    private pointsMallService: PointsMallService,
    private memberTaskService: MemberTaskService,
    private analysisService: MarketingAnalysisService,
  ) {}

  // ==================== 优惠券管理 ====================
  
  @Post('coupons')
  async createCoupon(@Body() dto: CreateCouponDto, @Request() req: any) {
    return this.couponService.create(dto, req.user.userId);
  }

  @Get('coupons')
  async findAllCoupons(@Query('active') active?: string) {
    if (active === 'true') {
      return this.couponService.findActive();
    }
    return this.couponService.findAll();
  }

  @Get('coupons/:id')
  async findOneCoupon(@Param('id') id: string) {
    return this.couponService.findOne(id);
  }

  @Put('coupons/:id')
  async updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponService.update(id, dto);
  }

  @Delete('coupons/:id')
  async removeCoupon(@Param('id') id: string) {
    await this.couponService.remove(id);
    return { success: true };
  }

  @Post('coupons/receive')
  async receiveCoupon(@Body() dto: ReceiveCouponDto, @Request() req: any) {
    return this.couponService.receive(dto, req.user.memberId);
  }

  @Get('coupons/member/:memberId')
  async findMemberCoupons(
    @Param('memberId') memberId: string,
    @Query('used') used?: string,
  ) {
    return this.couponService.findMemberCoupons(
      memberId,
      used !== undefined ? used === 'true' : undefined,
    );
  }

  @Post('coupons/use')
  async useCoupon(@Body() dto: UseCouponDto, @Request() req: any) {
    return this.couponService.use(dto, req.user.memberId);
  }

  // ==================== 优惠券核销与统计 ====================

  @Post('coupons/verify')
  async verifyCoupon(@Body() dto: VerifyCouponDto, @Request() req: any) {
    return this.couponUsageService.verify(dto, req.user?.staffId);
  }

  @Post('coupons/refund')
  async refundCoupon(@Body() dto: RefundCouponDto) {
    return this.couponUsageService.refund(dto);
  }

  @Get('coupons/usage/list')
  async getCouponUsageList(@Query() dto: CouponUsageQueryDto) {
    return this.couponUsageService.getUsageList(dto);
  }

  @Get('coupons/statistics')
  async getCouponStatistics(@Query() dto: CouponStatisticsQueryDto) {
    return this.couponUsageService.getStatistics(dto);
  }

  // ==================== 营销活动管理 ====================

  @Get('activities')
  async findActivities(@Query('status') status?: string) {
    return this.campaignService.findAll(status as any);
  }

  @Get('campaigns')
  async findCampaigns(@Query('status') status?: string) {
    return this.campaignService.findAll(status as any);
  }

  @Post('campaigns')
  async createCampaign(@Body() dto: CreateCampaignDto, @Request() req: any) {
    return this.campaignService.create(dto, req.user.userId);
  }

  @Get('campaigns')
  async findAllCampaigns(@Query('status') status?: string) {
    return this.campaignService.findAll(status as any);
  }

  @Get('campaigns/active')
  async findActiveCampaigns() {
    return this.campaignService.findActive();
  }

  @Get('campaigns/:id')
  async findOneCampaign(@Param('id') id: string) {
    return this.campaignService.findOne(id);
  }

  @Put('campaigns/:id')
  async updateCampaign(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignService.update(id, dto);
  }

  @Delete('campaigns/:id')
  async removeCampaign(@Param('id') id: string) {
    await this.campaignService.remove(id);
    return { success: true };
  }

  @Post('campaigns/:id/publish')
  async publishCampaign(@Param('id') id: string) {
    return this.campaignService.publish(id);
  }

  @Post('campaigns/:id/pause')
  async pauseCampaign(@Param('id') id: string) {
    return this.campaignService.pause(id);
  }

  @Post('campaigns/:id/resume')
  async resumeCampaign(@Param('id') id: string) {
    return this.campaignService.resume(id);
  }

  @Post('campaigns/:id/cancel')
  async cancelCampaign(@Param('id') id: string) {
    return this.campaignService.cancel(id);
  }

  // 活动规则
  @Post('campaign-rules')
  async createCampaignRule(@Body() dto: CreateCampaignRuleDto) {
    return this.campaignService.createRule(dto);
  }

  @Get('campaign-rules/campaign/:campaignId')
  async findCampaignRules(@Param('campaignId') campaignId: string) {
    return this.campaignService.findRules(campaignId);
  }

  @Put('campaign-rules/:id')
  async updateCampaignRule(@Param('id') id: string, @Body() dto: UpdateCampaignRuleDto) {
    return this.campaignService.updateRule(id, dto);
  }

  @Delete('campaign-rules/:id')
  async removeCampaignRule(@Param('id') id: string) {
    await this.campaignService.removeRule(id);
    return { success: true };
  }

  // 活动参与
  @Post('campaigns/participate')
  async participateCampaign(
    @Body() body: { campaignId: string; orderId: string; orderAmount: number; ruleId?: string },
    @Request() req: any,
  ) {
    return this.campaignService.participate(
      body.campaignId,
      req.user.memberId,
      body.orderId,
      body.orderAmount,
      body.ruleId,
    );
  }

  @Get('campaigns/member/:memberId/participations')
  async getMemberCampaignParticipations(@Param('memberId') memberId: string) {
    return this.campaignService.getMemberParticipations(memberId);
  }

  // 活动效果统计
  @Get('campaigns/effect-analysis')
  async getCampaignEffectAnalysis(@Query() dto: CampaignEffectQueryDto) {
    return this.campaignService.getEffectAnalysis(dto);
  }

  // ==================== 积分商城管理 ====================

  @Post('points-goods')
  async createPointsGoods(@Body() dto: CreatePointsGoodsDto, @Request() req: any) {
    return this.pointsMallService.createGoods(dto, req.user.userId);
  }

  @Get('points-goods')
  async findAllPointsGoods(@Query() dto: PointsMallQueryDto) {
    return this.pointsMallService.findAllGoods(dto);
  }

  @Get('points-goods/active')
  async findActivePointsGoods() {
    return this.pointsMallService.findActiveGoods();
  }

  @Get('points-goods/:id')
  async findOnePointsGoods(@Param('id') id: string) {
    return this.pointsMallService.findOneGoods(id);
  }

  @Put('points-goods/:id')
  async updatePointsGoods(@Param('id') id: string, @Body() dto: UpdatePointsGoodsDto) {
    return this.pointsMallService.updateGoods(id, dto);
  }

  @Delete('points-goods/:id')
  async removePointsGoods(@Param('id') id: string) {
    await this.pointsMallService.removeGoods(id);
    return { success: true };
  }

  @Post('points-goods/:id/stock')
  async updatePointsGoodsStock(
    @Param('id') id: string,
    @Body() body: { quantity: number },
  ) {
    return this.pointsMallService.updateStock(id, body.quantity);
  }

  // 积分兑换
  @Post('points-exchange')
  async exchangePointsGoods(
    @Body() dto: ExchangeGoodsDto,
    @Request() req: any,
  ) {
    // 需要从会员服务获取会员积分
    const memberPoints = req.user?.points || 0;
    return this.pointsMallService.exchange(dto, req.user.memberId, memberPoints);
  }

  @Get('points-exchange')
  async getExchangeList(@Query() dto: ExchangeQueryDto) {
    return this.pointsMallService.getExchangeList(dto);
  }

  @Get('points-exchange/member/:memberId')
  async getMemberExchanges(@Param('memberId') memberId: string) {
    return this.pointsMallService.getMemberExchanges(memberId);
  }

  @Put('points-exchange/status')
  async updateExchangeStatus(
    @Body() dto: UpdateExchangeStatusDto,
    @Request() req: any,
  ) {
    return this.pointsMallService.updateExchangeStatus(dto, req.user.userId);
  }

  @Get('points-goods/:id/statistics')
  async getPointsGoodsStatistics(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.pointsMallService.getGoodsStatistics(id, startDate, endDate);
  }

  // ==================== 会员任务管理 ====================

  @Post('tasks')
  async createTask(@Body() dto: CreateMemberTaskDto, @Request() req: any) {
    return this.memberTaskService.create(dto, req.user.userId);
  }

  @Get('tasks')
  async findAllTasks(@Query() dto: TaskQueryDto) {
    return this.memberTaskService.findAll(dto);
  }

  @Get('tasks/active')
  async findActiveTasks() {
    return this.memberTaskService.findActiveTasks();
  }

  @Get('tasks/:id')
  async findOneTask(@Param('id') id: string) {
    return this.memberTaskService.findOne(id);
  }

  @Put('tasks/:id')
  async updateTask(@Param('id') id: string, @Body() dto: UpdateMemberTaskDto) {
    return this.memberTaskService.update(id, dto);
  }

  @Delete('tasks/:id')
  async removeTask(@Param('id') id: string) {
    await this.memberTaskService.remove(id);
    return { success: true };
  }

  // 任务奖励
  @Post('task-rewards')
  async createTaskReward(@Body() dto: CreateTaskRewardDto) {
    return this.memberTaskService.createReward(dto);
  }

  @Get('task-rewards/task/:taskId')
  async findTaskRewards(@Param('taskId') taskId: string) {
    return this.memberTaskService.findRewards(taskId);
  }

  @Put('task-rewards/:id')
  async updateTaskReward(@Param('id') id: string, @Body() dto: UpdateTaskRewardDto) {
    return this.memberTaskService.updateReward(id, dto);
  }

  @Delete('task-rewards/:id')
  async removeTaskReward(@Param('id') id: string) {
    await this.memberTaskService.removeReward(id);
    return { success: true };
  }

  // 任务完成
  @Post('tasks/complete')
  async completeTask(@Body() dto: CompleteTaskDto, @Request() req: any) {
    return this.memberTaskService.completeTask(dto, req.user.memberId);
  }

  @Post('tasks/claim-reward')
  async claimTaskReward(@Body() dto: ClaimRewardDto, @Request() req: any) {
    return this.memberTaskService.claimReward(dto, req.user.memberId);
  }

  @Get('tasks/member/:memberId')
  async getMemberTasks(
    @Param('memberId') memberId: string,
    @Query('type') type?: string,
  ) {
    return this.memberTaskService.getMemberTasks(memberId, type as any);
  }

  @Get('tasks/member/:memberId/records')
  async getMemberTaskRecords(@Param('memberId') memberId: string) {
    return this.memberTaskService.getMemberRecords(memberId);
  }

  @Get('tasks/statistics')
  async getTaskStatistics(@Query() dto: TaskStatisticsQueryDto) {
    return this.memberTaskService.getStatistics(dto);
  }

  // ==================== 营销效果分析 ====================

  @Get('effect-analysis')
  async getMarketingEffectAnalysis(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analysisService.getEffectAnalysis(startDate, endDate);
  }

  @Get('campaigns/:id/roi')
  async getCampaignROI(@Param('id') id: string) {
    return this.analysisService.calculateCampaignROI(id);
  }

  @Get('conversion-stats')
  async getConversionStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analysisService.getConversionStats(startDate, endDate);
  }

  // ==================== 拼团管理 ====================
  
  @Post('group-buys')
  async createGroupBuy(@Body() dto: CreateGroupBuyDto, @Request() req: any) {
    return this.groupBuyService.create(dto, req.user.userId);
  }

  @Get('group-buys')
  async findAllGroupBuys(@Query('active') active?: string) {
    if (active === 'true') {
      return this.groupBuyService.findActive();
    }
    return this.groupBuyService.findAll();
  }

  @Get('group-buys/:id')
  async findOneGroupBuy(@Param('id') id: string) {
    return this.groupBuyService.findOne(id);
  }

  @Put('group-buys/:id')
  async updateGroupBuy(@Param('id') id: string, @Body() dto: UpdateGroupBuyDto) {
    return this.groupBuyService.update(id, dto);
  }

  @Delete('group-buys/:id')
  async removeGroupBuy(@Param('id') id: string) {
    await this.groupBuyService.remove(id);
    return { success: true };
  }

  @Post('group-buys/join')
  async joinGroupBuy(@Body() dto: JoinGroupBuyDto, @Request() req: any) {
    return this.groupBuyService.join(dto, req.user.memberId);
  }

  @Get('group-buys/:id/groups')
  async getGroups(@Param('id') id: string) {
    return this.groupBuyService.getGroups(id);
  }

  @Get('group-buys/member/:memberId')
  async getMemberGroups(@Param('memberId') memberId: string) {
    return this.groupBuyService.getMemberGroups(memberId);
  }

  // ==================== 秒杀管理 ====================
  
  @Post('flash-sales')
  async createFlashSale(@Body() dto: CreateFlashSaleDto, @Request() req: any) {
    return this.flashSaleService.create(dto, req.user.userId);
  }

  @Get('flash-sales')
  async findAllFlashSales(@Query('active') active?: string, @Query('upcoming') upcoming?: string) {
    if (active === 'true') {
      return this.flashSaleService.findActive();
    }
    if (upcoming === 'true') {
      return this.flashSaleService.findUpcoming();
    }
    return this.flashSaleService.findAll();
  }

  @Get('flash-sales/:id')
  async findOneFlashSale(@Param('id') id: string) {
    return this.flashSaleService.findOne(id);
  }

  @Put('flash-sales/:id')
  async updateFlashSale(@Param('id') id: string, @Body() dto: UpdateFlashSaleDto) {
    return this.flashSaleService.update(id, dto);
  }

  @Delete('flash-sales/:id')
  async removeFlashSale(@Param('id') id: string) {
    await this.flashSaleService.remove(id);
    return { success: true };
  }

  @Post('flash-sales/buy')
  async buyFlashSale(@Body() dto: BuyFlashSaleDto, @Request() req: any) {
    return this.flashSaleService.buy(dto, req.user.memberId);
  }

  @Get('flash-sales/member/:memberId')
  async getMemberFlashSaleOrders(@Param('memberId') memberId: string) {
    return this.flashSaleService.getMemberOrders(memberId);
  }

  // ==================== 新人礼包管理 ====================
  
  @Post('newbie-gifts')
  async createNewbieGift(@Body() dto: CreateNewbieGiftDto, @Request() req: any) {
    return this.newbieGiftService.create(dto, req.user.userId);
  }

  @Get('newbie-gifts')
  async findAllNewbieGifts() {
    return this.newbieGiftService.findAll();
  }

  @Get('newbie-gifts/active')
  async findActiveNewbieGift() {
    return this.newbieGiftService.findActive();
  }

  @Get('newbie-gifts/:id')
  async findOneNewbieGift(@Param('id') id: string) {
    return this.newbieGiftService.findOne(id);
  }

  @Put('newbie-gifts/:id')
  async updateNewbieGift(@Param('id') id: string, @Body() dto: UpdateNewbieGiftDto) {
    return this.newbieGiftService.update(id, dto);
  }

  @Delete('newbie-gifts/:id')
  async removeNewbieGift(@Param('id') id: string) {
    await this.newbieGiftService.remove(id);
    return { success: true };
  }

  @Post('newbie-gifts/receive')
  async receiveNewbieGift(@Request() req: any) {
    return this.newbieGiftService.receive(req.user.memberId);
  }

  @Get('newbie-gifts/member/:memberId')
  async getMemberNewbieGiftRecords(@Param('memberId') memberId: string) {
    return this.newbieGiftService.getMemberRecords(memberId);
  }

  // ==================== 转介绍管理 ====================
  
  @Post('referrals/config')
  async createReferralConfig(@Body() dto: CreateReferralConfigDto, @Request() req: any) {
    return this.referralService.createConfig(dto, req.user.userId);
  }

  @Get('referrals/config')
  async getReferralConfig() {
    return this.referralService.getConfig();
  }

  @Put('referrals/config/:id')
  async updateReferralConfig(@Param('id') id: string, @Body() dto: Partial<CreateReferralConfigDto>) {
    return this.referralService.updateConfig(id, dto);
  }

  @Post('referrals')
  async createReferral(@Body() dto: CreateReferralDto) {
    return this.referralService.create(dto);
  }

  @Get('referrals')
  async findAllReferrals(@Query('referrerId') referrerId?: string) {
    if (referrerId) {
      return this.referralService.findByReferrer(referrerId);
    }
    return this.referralService.findAll();
  }

  @Get('referrals/statistics')
  async getReferralStatistics(@Query('referrerId') referrerId?: string) {
    return this.referralService.getStatistics(referrerId);
  }

  @Post('referrals/:id/grant')
  async grantReferralReward(@Param('id') id: string) {
    return this.referralService.grantReward(id);
  }
}
