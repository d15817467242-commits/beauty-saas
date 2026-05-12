import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// 现有实体
import { Coupon, MemberCoupon } from './coupon.entity';
import { GroupBuy, Group, GroupParticipant } from './group-buy.entity';
import { FlashSale, FlashSaleOrder } from './flash-sale.entity';
import { NewbieGift, NewbieGiftRecord } from './newbie-gift.entity';
import { Referral, ReferralConfig } from './referral.entity';

// 新增实体
import { MarketingCampaign, CampaignRule, CampaignParticipation } from './marketing-campaign.entity';
import { CouponUsage, CouponStatistics } from './coupon-usage.entity';
import { PointsMallGoods, PointsExchange, PointsExchangeStatistics } from './points-mall.entity';
import { MemberTask, TaskReward, MemberTaskRecord, TaskStatistics } from './member-task.entity';

// 现有服务
import { CouponService } from './coupon.service';
import { GroupBuyService } from './group-buy.service';
import { FlashSaleService } from './flash-sale.service';
import { NewbieGiftService } from './newbie-gift.service';
import { ReferralService } from './referral.service';

// 新增服务
import { MarketingCampaignService } from './marketing-campaign.service';
import { CouponUsageService } from './coupon-usage.service';
import { PointsMallService } from './points-mall.service';
import { MemberTaskService } from './member-task.service';
import { MarketingAnalysisService } from './marketing-analysis.service';

import { MarketingController } from './marketing.controller';
import { MarketingAnalysisController } from './marketing-analysis.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // 现有实体
      Coupon,
      MemberCoupon,
      GroupBuy,
      Group,
      GroupParticipant,
      FlashSale,
      FlashSaleOrder,
      NewbieGift,
      NewbieGiftRecord,
      Referral,
      ReferralConfig,
      // 新增实体 - 营销活动
      MarketingCampaign,
      CampaignRule,
      CampaignParticipation,
      // 新增实体 - 优惠券使用
      CouponUsage,
      CouponStatistics,
      // 新增实体 - 积分商城
      PointsMallGoods,
      PointsExchange,
      PointsExchangeStatistics,
      // 新增实体 - 会员任务
      MemberTask,
      TaskReward,
      MemberTaskRecord,
      TaskStatistics,
    ]),
  ],
  controllers: [MarketingController, MarketingAnalysisController],
  providers: [
    // 现有服务
    CouponService,
    GroupBuyService,
    FlashSaleService,
    NewbieGiftService,
    ReferralService,
    // 新增服务
    MarketingCampaignService,
    CouponUsageService,
    PointsMallService,
    MemberTaskService,
    MarketingAnalysisService,
  ],
  exports: [
    // 现有服务
    CouponService,
    GroupBuyService,
    FlashSaleService,
    NewbieGiftService,
    ReferralService,
    // 新增服务
    MarketingCampaignService,
    CouponUsageService,
    PointsMallService,
    MemberTaskService,
    MarketingAnalysisService,
  ],
})
export class MarketingModule {}
