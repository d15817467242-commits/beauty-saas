import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Consumption } from '../cashier/consumption.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Service } from '../service/service.entity';
import { Appointment } from '../appointment/appointment.entity';
import { Member } from '../member/member.entity';
import { User } from '../user/user.entity';
import { Store } from '../store/store.entity';
import { UserStore } from '../user/entities/user-store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Consumption, Employee, Service, Appointment, Member, User, Store, UserStore])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
