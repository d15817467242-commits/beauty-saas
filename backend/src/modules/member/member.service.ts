import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member, MemberLevel } from './member.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Consumption } from '../cashier/consumption.entity';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(Consumption)
    private consumptionRepository: Repository<Consumption>,
  ) {}

  async create(createMemberDto: CreateMemberDto): Promise<Member> {
    // 如果提供了手机号，检查是否已存在
    if (createMemberDto.phone) {
      const existingMember = await this.memberRepository.findOne({
        where: { phone: createMemberDto.phone },
      });
      
      if (existingMember) {
        throw new ConflictException('该手机号已注册会员');
      }
    }
    
    const member = this.memberRepository.create(createMemberDto);
    return this.memberRepository.save(member);
  }

  async findAll(query: { keyword?: string; level?: MemberLevel; storeId?: string }): Promise<Member[]> {
    const qb = this.memberRepository.createQueryBuilder('member');

    if (query.storeId) {
      qb.andWhere('member.store_id = :storeId', { storeId: query.storeId });
    }

    if (query.keyword) {
      qb.andWhere('(member.name LIKE :keyword OR member.phone LIKE :keyword)', {
        keyword: `%${query.keyword}%`,
      });
    }

    if (query.level) {
      qb.andWhere('member.level = :level', { level: query.level });
    }

    return qb.orderBy('member.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.memberRepository.findOne({ where: { id } });
    
    if (!member) {
      throw new NotFoundException('会员不存在');
    }
    
    return member;
  }

  async findByPhone(phone: string): Promise<Member | null> {
    return this.memberRepository.findOne({ where: { phone } });
  }

  async update(id: string, updateMemberDto: UpdateMemberDto): Promise<Member> {
    const member = await this.findOne(id);
    Object.assign(member, updateMemberDto);
    return this.memberRepository.save(member);
  }

  async recharge(id: string, amount: number): Promise<Member> {
    const member = await this.findOne(id);
    member.balance = Number(member.balance) + amount;
    return this.memberRepository.save(member);
  }

  async consume(id: string, amount: number): Promise<Member> {
    const member = await this.findOne(id);
    
    if (Number(member.balance) < amount) {
      throw new Error('余额不足');
    }
    
    member.balance = Number(member.balance) - amount;
    member.totalSpent = Number(member.totalSpent) + amount;
    member.visitCount += 1;
    member.lastVisitAt = new Date();
    
    return this.memberRepository.save(member);
  }

  async addPoints(id: string, points: number): Promise<Member> {
    const member = await this.findOne(id);
    member.points += points;
    return this.memberRepository.save(member);
  }

  async updateStats(id: string, amount: number): Promise<Member> {
    const member = await this.findOne(id);
    member.totalSpent = Number(member.totalSpent) + amount;
    member.visitCount += 1;
    member.lastVisitAt = new Date();
    return this.memberRepository.save(member);
  }

  // 获取会员消费记录
  async getConsumptions(id: string): Promise<Consumption[]> {
    const member = await this.findOne(id);
    return this.consumptionRepository.find({
      where: { memberId: id },
      relations: ['employee'],
      order: { createdAt: 'DESC' },
    });
  }

  // 获取会员详情（包含消费记录和次卡）
  async getDetail(id: string): Promise<any> {
    const member = await this.findOne(id);
    const consumptions = await this.getConsumptions(id);
    
    return {
      ...member,
      consumptions,
      totalConsumptions: consumptions.length,
      totalSpent: consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0),
    };
  }

  async remove(id: string): Promise<void> {
    const member = await this.findOne(id);
    await this.memberRepository.remove(member);
  }
}
