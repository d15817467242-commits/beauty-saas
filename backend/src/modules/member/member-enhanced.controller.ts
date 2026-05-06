import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { 
  MemberTagService, 
  PointExchangeService, 
  MemberRankingService, 
  StoreService,
  MemberLevelService,
  MemberPointsService,
  MemberReferralService,
  MemberPortraitService,
} from './member-enhanced.service';
import {
  CreateMemberTagDto,
  UpdateMemberTagDto,
  TagMemberDto,
  BatchTagMembersDto,
  CreatePointExchangeRuleDto,
  ExchangePointsDto,
  CreateStoreDto,
  CreateMemberLevelDto,
  UpdateMemberLevelDto,
  CreateLevelBenefitDto,
  EarnPointsDto,
  ConsumePointsDto,
  QueryPointsRecordsDto,
  CreateReferralDto,
  QueryReferralsDto,
  ConsumptionAnalysisQueryDto,
} from './dto/member-enhanced.dto';

@Controller('member-tags')
export class MemberTagController {
  constructor(private tagService: MemberTagService) {}

  @Post()
  async create(@Body() dto: CreateMemberTagDto, @Request() req: any) {
    return this.tagService.create(dto, req.user.userId);
  }

  @Get()
  async findAll() {
    return this.tagService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tagService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMemberTagDto) {
    return this.tagService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.tagService.remove(id);
    return { success: true };
  }

  @Post('tag-member')
  async tagMember(@Body() dto: TagMemberDto, @Request() req: any) {
    return this.tagService.tagMember(dto, req.user.userId);
  }

  @Post('untag-member')
  async untagMember(@Body() dto: TagMemberDto) {
    await this.tagService.untagMember(dto.memberId, dto.tagId);
    return { success: true };
  }

  @Post('batch-tag')
  async batchTagMembers(@Body() dto: BatchTagMembersDto, @Request() req: any) {
    const count = await this.tagService.batchTagMembers(dto, req.user.userId);
    return { success: true, count };
  }

  @Get('member/:memberId')
  async getMemberTags(@Param('memberId') memberId: string) {
    return this.tagService.getMemberTags(memberId);
  }

  @Get(':id/members')
  async getTagMembers(@Param('id') id: string) {
    return this.tagService.getTagMembers(id);
  }
}

@Controller('point-exchange')
export class PointExchangeController {
  constructor(private exchangeService: PointExchangeService) {}

  @Post('rules')
  async createRule(@Body() dto: CreatePointExchangeRuleDto, @Request() req: any) {
    return this.exchangeService.createRule(dto, req.user.userId);
  }

  @Get('rules')
  async findRules() {
    return this.exchangeService.findRules();
  }

  @Post('exchange')
  async exchange(@Body() dto: ExchangePointsDto, @Request() req: any) {
    return this.exchangeService.exchange(dto, req.user.memberId, req.user.userId);
  }

  @Get('records/:memberId')
  async getMemberRecords(@Param('memberId') memberId: string) {
    return this.exchangeService.getMemberRecords(memberId);
  }
}

@Controller('member-rankings')
export class MemberRankingController {
  constructor(private rankingService: MemberRankingService) {}

  @Get()
  async getRanking(
    @Query('yearMonth') yearMonth?: string,
    @Query('limit') limit?: string,
  ) {
    return this.rankingService.getRanking(
      yearMonth ? parseInt(yearMonth) : undefined,
      limit ? parseInt(limit) : 10,
    );
  }

  @Post('calculate')
  async calculateRanking(@Query('yearMonth') yearMonth?: string) {
    await this.rankingService.calculateRanking(
      yearMonth ? parseInt(yearMonth) : undefined,
    );
    return { success: true };
  }
}

@Controller('stores')
export class StoreController {
  constructor(private storeService: StoreService) {}

  @Post()
  async create(@Body() dto: CreateStoreDto) {
    return this.storeService.create(dto);
  }

  @Get()
  async findAll() {
    return this.storeService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.storeService.findOne(id);
  }
}

// ==================== 会员等级控制器 ====================

@Controller('member-levels')
export class MemberLevelController {
  constructor(private levelService: MemberLevelService) {}

  @Post()
  async createLevel(@Body() dto: CreateMemberLevelDto) {
    return this.levelService.createLevel(dto);
  }

  @Get()
  async findAllLevels() {
    return this.levelService.findAllLevels();
  }

  @Get(':id')
  async findOneLevel(@Param('id') id: string) {
    return this.levelService.findOneLevel(id);
  }

  @Put(':id')
  async updateLevel(@Param('id') id: string, @Body() dto: UpdateMemberLevelDto) {
    return this.levelService.updateLevel(id, dto);
  }

  @Delete(':id')
  async removeLevel(@Param('id') id: string) {
    await this.levelService.removeLevel(id);
    return { success: true };
  }

  @Post('benefits')
  async createBenefit(@Body() dto: CreateLevelBenefitDto) {
    return this.levelService.createBenefit(dto);
  }

  @Get(':id/benefits')
  async getLevelBenefits(@Param('id') id: string) {
    return this.levelService.getLevelBenefits(id);
  }

  @Delete('benefits/:benefitId')
  async removeBenefit(@Param('benefitId') benefitId: string) {
    await this.levelService.removeBenefit(benefitId);
    return { success: true };
  }

  @Post('check-upgrade/:memberId')
  async checkUpgrade(@Param('memberId') memberId: string) {
    const newLevel = await this.levelService.checkAndUpgrade(memberId);
    return { upgraded: !!newLevel, newLevel };
  }

  @Get('member/:memberId/level-info')
  async getMemberLevelInfo(@Param('memberId') memberId: string) {
    return this.levelService.getMemberLevelInfo(memberId);
  }
}

// ==================== 会员积分控制器 ====================

@Controller('member-points')
export class MemberPointsController {
  constructor(private pointsService: MemberPointsService) {}

  @Get(':memberId')
  async getMemberPoints(@Param('memberId') memberId: string) {
    return this.pointsService.getMemberPoints(memberId);
  }

  @Post('earn')
  async earnPoints(@Body() dto: EarnPointsDto, @Request() req: any) {
    return this.pointsService.earnPoints(dto, req.user?.userId);
  }

  @Post('consume')
  async consumePoints(@Body() dto: ConsumePointsDto, @Request() req: any) {
    return this.pointsService.consumePoints(dto, req.user?.userId);
  }

  @Get('records')
  async getPointsRecords(@Query() dto: QueryPointsRecordsDto) {
    return this.pointsService.getPointsRecords(dto);
  }

  @Post('expire/:memberId')
  async expirePoints(@Param('memberId') memberId: string) {
    const expired = await this.pointsService.expirePoints(memberId);
    return { success: true, expiredPoints: expired };
  }
}

// ==================== 会员推荐控制器 ====================

@Controller('member-referrals')
export class MemberReferralController {
  constructor(private referralService: MemberReferralService) {}

  @Post()
  async createReferral(@Body() dto: CreateReferralDto) {
    return this.referralService.createReferral(dto);
  }

  @Get('stats/:memberId')
  async getReferralStats(@Param('memberId') memberId: string) {
    return this.referralService.getReferralStats(memberId);
  }

  @Get('list')
  async queryReferrals(@Query() dto: QueryReferralsDto) {
    return this.referralService.queryReferrals(dto);
  }

  @Post('confirm')
  async confirmReferral(
    @Body('refereeId') refereeId: string,
    @Body('consumptionId') consumptionId: string,
    @Body('amount') amount: number,
  ) {
    return this.referralService.confirmReferral(refereeId, consumptionId, amount);
  }

  @Post('grant-reward/:referralId')
  async grantReward(
    @Param('referralId') referralId: string,
    @Body('rewardAmount') rewardAmount: number,
    @Body('rewardPoints') rewardPoints: number,
  ) {
    return this.referralService.grantReward(referralId, rewardAmount, rewardPoints);
  }
}

// ==================== 会员画像控制器 ====================

@Controller('member-portrait')
export class MemberPortraitController {
  constructor(private portraitService: MemberPortraitService) {}

  @Get(':memberId')
  async getPortrait(@Param('memberId') memberId: string) {
    return this.portraitService.getPortrait(memberId);
  }

  @Get(':memberId/consumption-analysis')
  async getConsumptionAnalysis(
    @Param('memberId') memberId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.portraitService.getConsumptionAnalysis({
      memberId,
      startDate,
      endDate,
    });
  }
}
