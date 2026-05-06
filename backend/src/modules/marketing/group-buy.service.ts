import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { GroupBuy, Group, GroupParticipant, GroupBuyStatus, GroupStatus } from './group-buy.entity';
import { CreateGroupBuyDto, UpdateGroupBuyDto, JoinGroupBuyDto } from './dto/group-buy.dto';

@Injectable()
export class GroupBuyService {
  constructor(
    @InjectRepository(GroupBuy)
    private groupBuyRepository: Repository<GroupBuy>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupParticipant)
    private groupParticipantRepository: Repository<GroupParticipant>,
  ) {}

  // 创建拼团活动
  async create(dto: CreateGroupBuyDto, userId: string): Promise<GroupBuy> {
    const groupBuy = this.groupBuyRepository.create({
      ...dto,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      createdBy: userId,
    });
    return this.groupBuyRepository.save(groupBuy);
  }

  // 获取拼团活动列表
  async findAll(): Promise<GroupBuy[]> {
    return this.groupBuyRepository.find({
      relations: ['service'],
      order: { createdAt: 'DESC' },
    });
  }

  // 获取进行中的拼团活动
  async findActive(): Promise<GroupBuy[]> {
    const now = new Date();
    return this.groupBuyRepository.find({
      where: {
        status: GroupBuyStatus.ACTIVE,
        startTime: LessThan(now),
        endTime: MoreThan(now),
      },
      relations: ['service'],
      order: { createdAt: 'DESC' },
    });
  }

  // 获取单个拼团活动
  async findOne(id: string): Promise<GroupBuy> {
    const groupBuy = await this.groupBuyRepository.findOne({
      where: { id },
      relations: ['service'],
    });
    if (!groupBuy) {
      throw new NotFoundException('拼团活动不存在');
    }
    return groupBuy;
  }

  // 更新拼团活动
  async update(id: string, dto: UpdateGroupBuyDto): Promise<GroupBuy> {
    const groupBuy = await this.findOne(id);
    Object.assign(groupBuy, dto);
    return this.groupBuyRepository.save(groupBuy);
  }

  // 删除拼团活动
  async remove(id: string): Promise<void> {
    const groupBuy = await this.findOne(id);
    await this.groupBuyRepository.remove(groupBuy);
  }

  // 参与拼团
  async join(dto: JoinGroupBuyDto, memberId: string): Promise<{ group: Group; participant: GroupParticipant }> {
    const groupBuy = await this.findOne(dto.groupBuyId);
    
    // 检查活动状态
    if (groupBuy.status !== GroupBuyStatus.ACTIVE) {
      throw new BadRequestException('拼团活动未开始或已结束');
    }
    
    const now = new Date();
    if (now < groupBuy.startTime || now > groupBuy.endTime) {
      throw new BadRequestException('不在活动时间范围内');
    }
    
    // 检查库存
    if (groupBuy.totalStock > 0 && groupBuy.soldCount + dto.quantity > groupBuy.totalStock) {
      throw new BadRequestException('库存不足');
    }
    
    // 检查限购
    const purchasedCount = await this.groupParticipantRepository
      .createQueryBuilder('gp')
      .innerJoin('gp.group', 'g')
      .where('g.groupBuyId = :groupBuyId', { groupBuyId: dto.groupBuyId })
      .andWhere('gp.memberId = :memberId', { memberId })
      .getCount();
    
    if (purchasedCount >= groupBuy.perLimit) {
      throw new BadRequestException('已达到购买上限');
    }
    
    let group: Group | null = null;
    
    if (dto.groupId) {
      // 加入已有团
      group = await this.groupRepository.findOne({
        where: { id: dto.groupId },
      });
      if (!group) {
        throw new NotFoundException('拼团不存在');
      }
      if (group.status !== GroupStatus.PENDING) {
        throw new BadRequestException('该团已成团或已失败');
      }
      if (now > group.expireTime) {
        throw new BadRequestException('该团已过期');
      }
      if (groupBuy.maxPeople > 0 && group.currentPeople + dto.quantity > groupBuy.maxPeople) {
        throw new BadRequestException('该团人数已满');
      }
    } else {
      // 开新团
      const expireTime = new Date(now.getTime() + groupBuy.timeLimit * 60 * 60 * 1000);
      const newGroup = this.groupRepository.create({
        groupBuyId: dto.groupBuyId,
        leaderId: memberId,
        currentPeople: 0,
        status: GroupStatus.PENDING,
        expireTime,
      });
      group = await this.groupRepository.save(newGroup);
    }
    
    // 确保group存在
    if (!group) {
      throw new NotFoundException('拼团创建失败');
    }
    
    // 创建参团记录
    const participant = this.groupParticipantRepository.create({
      groupId: group.id,
      memberId,
      paidAmount: groupBuy.groupPrice * dto.quantity,
      joinTime: now,
      isLeader: group.currentPeople === 0,
    });
    await this.groupParticipantRepository.save(participant);
    
    // 更新团人数
    group.currentPeople += dto.quantity;
    
    // 检查是否成团
    if (group.currentPeople >= groupBuy.minPeople) {
      group.status = GroupStatus.SUCCESS;
      group.completeTime = now;
    }
    
    await this.groupRepository.save(group);
    
    // 更新销量
    groupBuy.soldCount += dto.quantity;
    await this.groupBuyRepository.save(groupBuy);
    
    return { group, participant };
  }

  // 获取拼团详情（包含所有团）
  async getGroups(groupBuyId: string): Promise<Group[]> {
    return this.groupRepository.find({
      where: { groupBuyId },
      relations: ['participants'],
      order: { createdAt: 'DESC' },
    });
  }

  // 获取会员参与的拼团
  async getMemberGroups(memberId: string): Promise<GroupParticipant[]> {
    return this.groupParticipantRepository.find({
      where: { memberId },
      relations: ['group', 'group.groupBuy'],
      order: { createdAt: 'DESC' },
    });
  }

  // 处理过期拼团
  async handleExpiredGroups(): Promise<void> {
    const now = new Date();
    const expiredGroups = await this.groupRepository.find({
      where: {
        status: GroupStatus.PENDING,
        expireTime: LessThan(now),
      },
    });
    
    for (const group of expiredGroups) {
      group.status = GroupStatus.FAILED;
      await this.groupRepository.save(group);
    }
  }
}
