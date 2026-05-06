import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room, RoomBed, RoomUsage } from './entities/room.entity';
import { RoomService } from './services/room.service';
import { RoomController } from './controllers/room.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Room,
      RoomBed,
      RoomUsage,
    ]),
  ],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
})
export class OtherModule {}
