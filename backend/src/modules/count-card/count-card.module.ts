import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountCardController } from './count-card.controller';
import { CountCardService } from './count-card.service';
import { CountCardPackage } from './count-card-package.entity';
import { MemberCountCard } from './member-count-card.entity';
import { Consumption } from '../cashier/consumption.entity';
import { MemberModule } from '../member/member.module';
import { ServiceModule } from '../service/service.module';
import { EmployeeModule } from '../employee/employee.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CountCardPackage, MemberCountCard, Consumption]),
    MemberModule,
    ServiceModule,
    EmployeeModule,
  ],
  controllers: [CountCardController],
  providers: [CountCardService],
  exports: [CountCardService],
})
export class CountCardModule {}
