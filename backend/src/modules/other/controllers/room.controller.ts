import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { RoomService } from '../services/room.service';
import { Room, RoomBed, RoomUsage } from '../entities/room.entity';
import { CreateRoomDto, UpdateRoomDto, RoomQueryDto, UseRoomDto, ReleaseRoomDto } from '../dto/room.dto';
import { RoomStatus } from '../entities/room.entity';

@Controller('room')
export class RoomController {
  constructor(private readonly service: RoomService) {}

  // ========== 房间管理 ==========

  @Get()
  findAll(@Query() query: RoomQueryDto): Promise<Room[]> {
    return this.service.findAll(query);
  }

  @Get('statistics')
  getStatistics(): Promise<any> {
    return this.service.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Room> {
    return this.service.findOne(id);
  }

  @Get(':id/beds')
  getBeds(@Param('id', ParseUUIDPipe) id: string): Promise<RoomBed[]> {
    return this.service.getBeds(id);
  }

  @Post()
  create(@Body() dto: CreateRoomDto): Promise<Room> {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoomDto
  ): Promise<Room> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
    await this.service.remove(id);
    return { success: true };
  }

  @Put(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: RoomStatus
  ): Promise<Room> {
    return this.service.updateStatus(id, status);
  }

  // ========== 床位管理 ==========

  @Put('bed/:bedId/status')
  updateBedStatus(
    @Param('bedId', ParseUUIDPipe) bedId: string,
    @Body('status') status: RoomStatus
  ): Promise<RoomBed> {
    return this.service.updateBedStatus(bedId, status);
  }

  // ========== 房间使用 ==========

  @Post('use')
  useRoom(@Body() dto: UseRoomDto): Promise<RoomUsage> {
    return this.service.useRoom(dto);
  }

  @Post('release/:usageId')
  releaseRoom(
    @Param('usageId', ParseUUIDPipe) usageId: string,
    @Body() dto: ReleaseRoomDto
  ): Promise<RoomUsage> {
    return this.service.releaseRoom(usageId, dto);
  }

  @Get('usage/history')
  getUsageHistory(@Query() query: {
    roomId?: string;
    memberId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<RoomUsage[]> {
    return this.service.getUsageHistory(query);
  }
}
