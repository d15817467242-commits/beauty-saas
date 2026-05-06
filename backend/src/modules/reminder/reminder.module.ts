import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReminderController } from './reminder.controller';
import { ReminderService } from './reminder.service';
import { Member } from '../member/member.entity';
import { Consumption } from '../cashier/consumption.entity';
import { MemberCountCard } from '../count-card/member-count-card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Member, Consumption, MemberCountCard])],
  controllers: [ReminderController],
  providers: [ReminderService],
  exports: [ReminderService],
})
export class ReminderModule {}
