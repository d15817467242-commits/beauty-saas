import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../../room/entities/room.entity';
import { RoomBed, RoomUsage, RoomStatus } from '../entities/room.entity';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(RoomBed)
    private roomBedRepository: Repository<RoomBed>,
    @InjectRepository(RoomUsage)
    private roomUsageRepository: Repository<RoomUsage>,
  ) {}

  // ========== 房间管理 ==========

  async createRoom(data: Partial<Room>): Promise<Room> {
    const room = this.roomRepository.create(data);
    return this.roomRepository.save(room);
  }

  async findAllRooms(storeId?: string): Promise<Room[]> {
    const where: any = {};
    if (storeId) where.storeId = storeId;
    return this.roomRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOneRoom(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({ where: { id } });
    if (!room) throw new NotFoundException('房间不存在');
    return room;
  }

  async updateRoom(id: string, data: Partial<Room>): Promise<Room> {
    const room = await this.findOneRoom(id);
    Object.assign(room, data);
    return this.roomRepository.save(room);
  }

  async deleteRoom(id: string): Promise<void> {
    const room = await this.findOneRoom(id);
    await this.roomRepository.remove(room);
  }

  // ========== 床位管理 ==========

  async createBed(data: Partial<RoomBed>): Promise<RoomBed> {
    const bed = this.roomBedRepository.create(data);
    return this.roomBedRepository.save(bed);
  }

  async findBedsByRoom(roomId: string): Promise<RoomBed[]> {
    return this.roomBedRepository.find({ where: { roomId } });
  }

  // ========== 使用记录 ==========

  async useRoom(data: Partial<RoomUsage>): Promise<RoomUsage> {
    const usage = this.roomUsageRepository.create(data);
    usage.startTime = new Date();
    return this.roomUsageRepository.save(usage);
  }

  async releaseRoom(id: string): Promise<RoomUsage> {
    const usage = await this.roomUsageRepository.findOne({ where: { id } });
    if (!usage) throw new NotFoundException('使用记录不存在');
    usage.endTime = new Date();
    usage.status = 'completed';
    return this.roomUsageRepository.save(usage);
  }

  async getRoomUsages(roomId?: string): Promise<RoomUsage[]> {
    const where: any = {};
    if (roomId) where.roomId = roomId;
    return this.roomUsageRepository.find({ where, order: { startTime: 'DESC' } });
  }
}