import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { RoomService } from '../services/room.service';
import { Room } from '../../room/entities/room.entity';
import { RoomBed, RoomUsage } from '../entities/room.entity';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  // ========== 房间管理 ==========

  @Post()
  async createRoom(@Body() body: Partial<Room>) {
    return this.roomService.createRoom(body);
  }

  @Get()
  async findAllRooms(@Query('storeId') storeId?: string) {
    return this.roomService.findAllRooms(storeId);
  }

  @Get(':id')
  async findOneRoom(@Param('id') id: string) {
    return this.roomService.findOneRoom(id);
  }

  @Put(':id')
  async updateRoom(@Param('id') id: string, @Body() body: Partial<Room>) {
    return this.roomService.updateRoom(id, body);
  }

  @Delete(':id')
  async deleteRoom(@Param('id') id: string) {
    return this.roomService.deleteRoom(id);
  }

  // ========== 床位管理 ==========

  @Post(':roomId/beds')
  async createBed(@Param('roomId') roomId: string, @Body() body: Partial<RoomBed>) {
    return this.roomService.createBed({ ...body, roomId });
  }

  @Get(':roomId/beds')
  async findBedsByRoom(@Param('roomId') roomId: string) {
    return this.roomService.findBedsByRoom(roomId);
  }

  // ========== 使用记录 ==========

  @Post('usage')
  async useRoom(@Body() body: Partial<RoomUsage>) {
    return this.roomService.useRoom(body);
  }

  @Put('usage/:id/release')
  async releaseRoom(@Param('id') id: string) {
    return this.roomService.releaseRoom(id);
  }

  @Get('usage')
  async getRoomUsages(@Query('roomId') roomId?: string) {
    return this.roomService.getRoomUsages(roomId);
  }
}