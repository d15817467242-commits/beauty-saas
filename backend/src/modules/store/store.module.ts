import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './store.entity';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { UserStore } from '../user/entities/user-store.entity';
import { User } from '../user/user.entity';
import { Member } from '../member/member.entity';
import { Employee } from '../employee/entities/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Store, UserStore, User, Member, Employee])],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
