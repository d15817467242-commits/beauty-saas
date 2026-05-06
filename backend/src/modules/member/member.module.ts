import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { Member } from './member.entity';
import { Consumption } from '../cashier/consumption.entity';
import {
  MemberTag,
  MemberTagRelation,
  PointExchangeRule,
  PointExchangeRecord,
  MemberRanking,
  Store,
  CrossStoreConsumption,
  MemberLevelConfig,
  MemberLevelBenefit,
  MemberPoints,
  PointsRecord,
  MemberReferral,
} from './member-enhanced.entity';
import { Gift, GiftExchange } from './entities/gift.entity';
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
import { GiftService } from './services/gift.service';
import {
  MemberTagController,
  PointExchangeController,
  MemberRankingController,
  StoreController,
  MemberLevelController,
  MemberPointsController,
  MemberReferralController,
  MemberPortraitController,
} from './member-enhanced.controller';
import { GiftController } from './controllers/gift.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Member,
      Consumption,
      MemberTag,
      MemberTagRelation,
      PointExchangeRule,
      PointExchangeRecord,
      MemberRanking,
      Store,
      CrossStoreConsumption,
      MemberLevelConfig,
      MemberLevelBenefit,
      MemberPoints,
      PointsRecord,
      MemberReferral,
      Gift,
      GiftExchange,
    ]),
  ],
  controllers: [
    MemberController,
    MemberTagController,
    PointExchangeController,
    MemberRankingController,
    StoreController,
    MemberLevelController,
    MemberPointsController,
    MemberReferralController,
    MemberPortraitController,
    GiftController,
  ],
  providers: [
    MemberService,
    MemberTagService,
    PointExchangeService,
    MemberRankingService,
    StoreService,
    MemberLevelService,
    MemberPointsService,
    MemberReferralService,
    MemberPortraitService,
    GiftService,
  ],
  exports: [
    MemberService,
    MemberTagService,
    PointExchangeService,
    MemberRankingService,
    StoreService,
    MemberLevelService,
    MemberPointsService,
    MemberReferralService,
    MemberPortraitService,
    GiftService,
  ],
})
export class MemberModule {}
