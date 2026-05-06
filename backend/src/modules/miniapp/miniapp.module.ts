import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MiniappController } from './miniapp.controller';
import { MiniappService } from './miniapp.service';
import { MiniappUser } from './entities/miniapp-user.entity';
import { Member } from '../member/member.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Service } from '../service/service.entity';
import { Consumption } from '../cashier/consumption.entity';
import { Appointment } from '../appointment/appointment.entity';
import { CountCardPackage } from '../count-card/count-card-package.entity';
import { MemberCountCard } from '../count-card/member-count-card.entity';
import { Credit } from '../cashier/credit.entity';
import { Coupon, MemberCoupon } from '../marketing/coupon.entity';
import { PointsMallGoods, PointsExchange } from '../marketing/points-mall.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MiniappUser,
      Member,
      Employee,
      Service,
      Consumption,
      Appointment,
      CountCardPackage,
      MemberCountCard,
      Credit,
      Coupon,
      MemberCoupon,
      PointsMallGoods,
      PointsExchange,
    ]),
  ],
  controllers: [MiniappController],
  providers: [MiniappService],
  exports: [MiniappService],
})
export class MiniappModule {}
