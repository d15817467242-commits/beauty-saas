import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomBed } from '../entities/room-bed.entity';

@Injectable()
export class RoomBedService {
  constructor(
    @InjectRepository(RoomBed)
    private readonly repo: Repository<RoomBed>,
  ) {}

  async create(roomId: string, data: Partial<RoomBed>) {
    const bed = this.repo.create({ ...data, roomId });
    return this.repo.save(bed);
  }

  async findByRoom(roomId: string) {
    return this.repo.find({ where: { roomId } });
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<RoomBed>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}
