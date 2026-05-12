import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { RoomUsageService } from '../services/room-usage.service';
import { RoomUsage } from '../entities/room-usage.entity';

@Controller('room/usage')
export class RoomUsageController {
  constructor(private readonly service: RoomUsageService) {}

  @Post()
  create(@Body() data: Partial<RoomUsage>) {
    return this.service.create(data);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string) {
    return this.service.complete(id);
  }
}
