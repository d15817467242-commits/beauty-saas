import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { RoomService } from '../services/room.service';
import { Room } from '../entities/room.entity';

@Controller('rooms')
export class RoomController {
  constructor(private readonly service: RoomService) {}

  @Get()
  getRooms(@Query() query: {
    type?: 'room' | 'bed' | 'chair';
    status?: 'available' | 'occupied' | 'maintenance' | 'reserved';
    storeId?: string;
  }): Promise<Room[]> {
    return this.service.getRooms(query);
  }

  @Get('tree')
  getRoomTree(@Query('storeId') storeId?: string): Promise<any[]> {
    return this.service.getRoomTree(storeId);
  }

  @Get('available')
  getAvailableRooms(@Query('storeId') storeId?: string): Promise<Room[]> {
    return this.service.getAvailableRooms(storeId);
  }

  @Get(':id')
  getRoom(@Param('id', ParseUUIDPipe) id: string): Promise<Room> {
    return this.service.getRoom(id);
  }

  @Post()
  createRoom(@Body() data: Partial<Room>): Promise<Room> {
    return this.service.createRoom(data);
  }

  @Put(':id')
  updateRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<Room>
  ): Promise<Room> {
    return this.service.updateRoom(id, data);
  }

  @Delete(':id')
  deleteRoom(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.deleteRoom(id);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  ): Promise<Room> {
    return this.service.updateStatus(id, status);
  }

  @Post(':id/beds')
  batchCreateBeds(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('count') count: number,
    @Body('prefix') prefix: string
  ): Promise<Room[]> {
    return this.service.batchCreateBeds(id, count, prefix);
  }
}
