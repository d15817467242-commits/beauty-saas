import { Module } from '@nestjs/common';
import {
  PointsAliasController,
  PointsMallAliasController,
  QueueAliasController,
  GiftsAliasController,
  MemberDetailAliasController,
} from './route-alias.controller';
import { MemberModule } from '../member/member.module';
import { MarketingModule } from '../marketing/marketing.module';

@Module({
  imports: [
    MemberModule,
    MarketingModule,
  ],
  controllers: [
    PointsAliasController,
    PointsMallAliasController,
    QueueAliasController,
    GiftsAliasController,
    MemberDetailAliasController,
  ],
})
export class RouteAliasNewModule {}