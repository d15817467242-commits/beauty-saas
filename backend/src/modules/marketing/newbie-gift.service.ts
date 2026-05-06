import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewbieGift, NewbieGiftRecord } from './newbie-gift.entity';
import { CreateNewbieGiftDto, UpdateNewbieGiftDto } from './dto/newbie-gift.dto';

@Injectable()
export class NewbieGiftService {
  constructor(
    @InjectRepository(NewbieGift)
    private newbieGiftRepository: Repository<NewbieGift>,
    @InjectRepository(NewbieGiftRecord)
    private newbieGiftRecordRepository: Repository<NewbieGiftRecord>,
  ) {}

  // 创建新人礼包
  async create(dto: CreateNewbieGiftDto, userId: string): Promise<NewbieGift> {
    const newbieGift = this.newbieGiftRepository.create({
      ...dto,
      createdBy: userId,
    });
    return this.newbieGiftRepository.save(newbieGift);
  }

  // 获取新人礼包列表
  async findAll(): Promise<NewbieGift[]> {
    return this.newbieGiftRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // 获取当前生效的新人礼包
  async findActive(): Promise<NewbieGift | null> {
    return this.newbieGiftRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  // 获取单个新人礼包
  async findOne(id: string): Promise<NewbieGift> {
    const newbieGift = await this.newbieGiftRepository.findOne({ where: { id } });
    if (!newbieGift) {
      throw new NotFoundException('新人礼包不存在');
    }
    return newbieGift;
  }

  // 更新新人礼包
  async update(id: string, dto: UpdateNewbieGiftDto): Promise<NewbieGift> {
    const newbieGift = await this.findOne(id);
    Object.assign(newbieGift, dto);
    return this.newbieGiftRepository.save(newbieGift);
  }

  // 删除新人礼包
  async remove(id: string): Promise<void> {
    const newbieGift = await this.findOne(id);
    await this.newbieGiftRepository.remove(newbieGift);
  }

  // 会员领取新人礼包
  async receive(memberId: string): Promise<NewbieGiftRecord> {
    const newbieGift = await this.findActive();
    if (!newbieGift) {
      throw new BadRequestException('暂无生效的新人礼包');
    }
    
    // 检查是否已领取
    const existingRecord = await this.newbieGiftRecordRepository.findOne({
      where: { memberId, newbieGiftId: newbieGift.id },
    });
    if (existingRecord) {
      throw new BadRequestException('已领取过新人礼包');
    }
    
    const now = new Date();
    const expireTime = new Date(now.getTime() + newbieGift.validDays * 24 * 60 * 60 * 1000);
    
    const record = this.newbieGiftRecordRepository.create({
      memberId,
      newbieGiftId: newbieGift.id,
      receiveTime: now,
      expireTime,
      pointsReceived: newbieGift.pointsReward,
      balanceReceived: newbieGift.balanceReward,
    });
    
    return this.newbieGiftRecordRepository.save(record);
  }

  // 获取会员新人礼包记录
  async getMemberRecords(memberId: string): Promise<NewbieGiftRecord[]> {
    return this.newbieGiftRecordRepository.find({
      where: { memberId },
      relations: ['newbieGift'],
      order: { createdAt: 'DESC' },
    });
  }

  // 检查会员是否可领取新人礼包
  async canReceive(memberId: string): Promise<boolean> {
    const newbieGift = await this.findActive();
    if (!newbieGift) {
      return false;
    }
    
    const existingRecord = await this.newbieGiftRecordRepository.findOne({
      where: { memberId, newbieGiftId: newbieGift.id },
    });
    
    return !existingRecord;
  }
}
