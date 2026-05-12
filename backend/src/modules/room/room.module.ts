import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomController } from './controllers/room.controller';
import { RoomBedController } from './controllers/room-bed.controller';
import { RoomUsageController } from './controllers/room-usage.controller';
import { RoomService } from './services/room.service';
import { RoomBedService } from './services/room-bed.service';
import { RoomUsageService } from './services/room-usage.service';
import { Room } from './entities/room.entity';
import { RoomBed } from './entities/room-bed.entity';
import { RoomUsage } from './entities/room-usage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, RoomBed, RoomUsage])],
  controllers: [RoomController, RoomBedController, RoomUsageController],
  providers: [RoomService, RoomBedService, RoomUsageService],
  exports: [RoomService, RoomBedService, RoomUsageService],
})
export class RoomModule {}
