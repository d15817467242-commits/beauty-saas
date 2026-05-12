import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RoomBedService } from '../services/room-bed.service';
import { RoomBed } from '../entities/room-bed.entity';

@Controller('room/:roomId/beds')
export class RoomBedController {
  constructor(private readonly service: RoomBedService) {}

  @Post()
  create(@Param('roomId') roomId: string, @Body() data: Partial<RoomBed>) {
    return this.service.create(roomId, data);
  }

  @Get()
  findByRoom(@Param('roomId') roomId: string) {
    return this.service.findByRoom(roomId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<RoomBed>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
