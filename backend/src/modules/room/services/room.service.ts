import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  async getRooms(query: {
    type?: 'room' | 'bed' | 'chair';
    status?: 'available' | 'occupied' | 'maintenance' | 'reserved';
    storeId?: string;
  }): Promise<Room[]> {
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.storeId) where.storeId = query.storeId;
    
    return this.roomRepository.find({
      where,
      order: { sort: 'ASC', createdAt: 'ASC' }
    });
  }

  async getRoomTree(storeId?: string): Promise<any[]> {
    const rooms = await this.getRooms({ storeId });
    
    // 构建树形结构
    const rootRooms = rooms.filter(r => !r.parentId && r.type === 'room');
    
    return rootRooms.map(room => ({
      ...room,
      children: rooms.filter(r => r.parentId === room.id)
    }));
  }

  async getRoom(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({ where: { id } });
    if (!room) throw new NotFoundException('房间不存在');
    return room;
  }

  async createRoom(data: Partial<Room>): Promise<Room> {
    // 检查编码是否重复
    const existing = await this.roomRepository.findOne({ where: { code: data.code } });
    if (existing) {
      throw new BadRequestException('房间编码已存在');
    }
    
    const room = this.roomRepository.create(data);
    return this.roomRepository.save(room);
  }

  async updateRoom(id: string, data: Partial<Room>): Promise<Room> {
    const room = await this.getRoom(id);
    
    // 如果修改编码，检查是否重复
    if (data.code && data.code !== room.code) {
      const existing = await this.roomRepository.findOne({ where: { code: data.code } });
      if (existing) {
        throw new BadRequestException('房间编码已存在');
      }
    }
    
    Object.assign(room, data);
    return this.roomRepository.save(room);
  }

  async deleteRoom(id: string): Promise<void> {
    const room = await this.getRoom(id);
    
    // 检查是否有子房间
    const children = await this.roomRepository.count({ where: { parentId: id } });
    if (children > 0) {
      throw new BadRequestException('该房间下有床位/座位，不能删除');
    }
    
    await this.roomRepository.remove(room);
  }

  // 更新房间状态
  async updateStatus(id: string, status: 'available' | 'occupied' | 'maintenance' | 'reserved'): Promise<Room> {
    const room = await this.getRoom(id);
    room.status = status;
    return this.roomRepository.save(room);
  }

  // 批量创建床位/座位
  async batchCreateBeds(roomId: string, count: number, prefix: string): Promise<Room[]> {
    const parent = await this.getRoom(roomId);
    
    if (parent.type !== 'room') {
      throw new BadRequestException('只能在房间下创建床位/座位');
    }
    
    const beds: Room[] = [];
    for (let i = 1; i <= count; i++) {
      const bed = this.roomRepository.create({
        name: `${prefix}${i}`,
        code: `${parent.code}-${i}`,
        type: 'bed',
        parentId: roomId,
        storeId: parent.storeId,
        capacity: 1,
        status: 'available',
      });
      beds.push(bed);
    }
    
    return this.roomRepository.save(beds);
  }

  // 获取可用房间
  async getAvailableRooms(storeId?: string): Promise<Room[]> {
    return this.getRooms({ status: 'available', storeId, type: 'room' });
  }
}
