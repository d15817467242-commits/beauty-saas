import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Room, RoomBed, RoomUsage, RoomStatus, RoomType } from '../entities/room.entity';
import { CreateRoomDto, UpdateRoomDto, RoomQueryDto, UseRoomDto, ReleaseRoomDto } from '../dto/room.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(RoomBed)
    private bedRepository: Repository<RoomBed>,
    @InjectRepository(RoomUsage)
    private usageRepository: Repository<RoomUsage>,
  ) {}

  // ========== 房间管理 ==========

  async findAll(query: RoomQueryDto): Promise<Room[]> {
    const { keyword, type, status, floor } = query;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (floor) where.floor = floor;
    if (keyword) where.name = Like(`%${keyword}%`);

    return this.roomRepository.find({
      where,
      order: { sort: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['beds'],
    });
    if (!room) {
      throw new NotFoundException('房间不存在');
    }
    return room;
  }

  async create(dto: CreateRoomDto): Promise<Room> {
    const room = this.roomRepository.create(dto);
    const savedRoom = await this.roomRepository.save(room);

    // 创建床位
    if (dto.bedCount && dto.bedCount > 1) {
      const beds: RoomBed[] = [];
      for (let i = 1; i <= dto.bedCount; i++) {
        beds.push(this.bedRepository.create({
          roomId: savedRoom.id,
          bedNumber: i,
          name: `${savedRoom.name}-${i}号床`,
          status: RoomStatus.AVAILABLE,
        }));
      }
      await this.bedRepository.save(beds);
    }

    return savedRoom;
  }

  async update(id: string, dto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);
    Object.assign(room, dto);
    return this.roomRepository.save(room);
  }

  async remove(id: string): Promise<void> {
    const room = await this.findOne(id);
    await this.roomRepository.remove(room);
  }

  async updateStatus(id: string, status: RoomStatus): Promise<Room> {
    const room = await this.findOne(id);
    room.status = status;
    return this.roomRepository.save(room);
  }

  // ========== 床位管理 ==========

  async getBeds(roomId: string): Promise<RoomBed[]> {
    return this.bedRepository.find({
      where: { roomId },
      order: { bedNumber: 'ASC' },
    });
  }

  async updateBedStatus(bedId: string, status: RoomStatus): Promise<RoomBed> {
    const bed = await this.bedRepository.findOne({ where: { id: bedId } });
    if (!bed) {
      throw new NotFoundException('床位不存在');
    }
    bed.status = status;
    return this.bedRepository.save(bed);
  }

  // ========== 房间使用 ==========

  async useRoom(dto: UseRoomDto): Promise<RoomUsage> {
    const room = await this.findOne(dto.roomId);

    // 检查房间状态
    if (room.status !== RoomStatus.AVAILABLE) {
      throw new BadRequestException('房间不可用');
    }

    // 如果指定了床位
    if (dto.bedId) {
      const bed = await this.bedRepository.findOne({ where: { id: dto.bedId } });
      if (!bed || bed.roomId !== dto.roomId) {
        throw new NotFoundException('床位不存在');
      }
      if (bed.status !== RoomStatus.AVAILABLE) {
        throw new BadRequestException('床位不可用');
      }

      // 更新床位状态
      bed.status = RoomStatus.OCCUPIED;
      bed.currentMemberId = dto.memberId;
      bed.startTime = new Date();
      await this.bedRepository.save(bed);
    } else {
      // 更新房间状态
      room.status = RoomStatus.OCCUPIED;
      await this.roomRepository.save(room);
    }

    // 创建使用记录
    const usage = this.usageRepository.create({
      roomId: dto.roomId,
      bedId: dto.bedId,
      memberId: dto.memberId,
      orderId: dto.orderId,
      serviceName: dto.serviceName,
      employeeId: dto.employeeId,
      startTime: new Date(),
      remark: dto.remark,
    });

    return this.usageRepository.save(usage);
  }

  async releaseRoom(usageId: string, dto: ReleaseRoomDto): Promise<RoomUsage> {
    const usage = await this.usageRepository.findOne({
      where: { id: usageId },
      relations: ['room', 'bed'],
    });
    if (!usage) {
      throw new NotFoundException('使用记录不存在');
    }

    const now = new Date();
    usage.endTime = now;
    usage.duration = Math.floor((now.getTime() - usage.startTime.getTime()) / 60000);
    if (dto.remark) usage.remark = dto.remark;

    // 更新床位或房间状态
    if (usage.bed) {
      usage.bed.status = RoomStatus.AVAILABLE;
      usage.bed.currentMemberId = undefined;
      usage.bed.startTime = undefined;
      await this.bedRepository.save(usage.bed);
    } else {
      usage.room.status = RoomStatus.AVAILABLE;
      await this.roomRepository.save(usage.room);
    }

    return this.usageRepository.save(usage);
  }

  async getUsageHistory(query: {
    roomId?: string;
    memberId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<RoomUsage[]> {
    const where: any = {};
    if (query.roomId) where.roomId = query.roomId;
    if (query.memberId) where.memberId = query.memberId;

    return this.usageRepository.find({
      where,
      relations: ['room', 'bed'],
      order: { startTime: 'DESC' },
    });
  }

  // ========== 统计 ==========

  async getStatistics(): Promise<any> {
    const total = await this.roomRepository.count();
    const available = await this.roomRepository.count({ where: { status: RoomStatus.AVAILABLE } });
    const occupied = await this.roomRepository.count({ where: { status: RoomStatus.OCCUPIED } });
    const maintenance = await this.roomRepository.count({ where: { status: RoomStatus.MAINTENANCE } });

    const totalBeds = await this.bedRepository.count();
    const availableBeds = await this.bedRepository.count({ where: { status: RoomStatus.AVAILABLE } });

    return {
      rooms: { total, available, occupied, maintenance },
      beds: { total: totalBeds, available: availableBeds },
    };
  }
}
