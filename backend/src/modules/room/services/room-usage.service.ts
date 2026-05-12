import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomUsage } from '../entities/room-usage.entity';

@Injectable()
export class RoomUsageService {
  constructor(
    @InjectRepository(RoomUsage)
    private readonly repo: Repository<RoomUsage>,
  ) {}

  async create(data: Partial<RoomUsage>) {
    const usage = this.repo.create(data);
    return this.repo.save(usage);
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<RoomUsage>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async complete(id: string) {
    await this.repo.update(id, { status: 'completed', endTime: new Date() });
    return this.repo.findOne({ where: { id } });
  }
}
