import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CountCardPackage } from './count-card-package.entity';
import { MemberCountCard, MemberCountCardStatus, CountCardUsageRecord } from './member-count-card.entity';
import { CreateCountCardPackageDto } from './dto/create-count-card-package.dto';
import { UpdateCountCardPackageDto } from './dto/update-count-card-package.dto';
import { PurchaseCountCardDto } from './dto/purchase-count-card.dto';
import { UseCountCardDto } from './dto/use-count-card.dto';
import { MemberService } from '../member/member.service';
import { ServiceService } from '../service/service.service';
import { EmployeeService } from '../employee/employee.service';
import { Consumption, ConsumptionType, PaymentMethod } from '../cashier/consumption.entity';

@Injectable()
export class CountCardService {
  constructor(
    @InjectRepository(CountCardPackage)
    private packageRepository: Repository<CountCardPackage>,
    @InjectRepository(MemberCountCard)
    private memberCountCardRepository: Repository<MemberCountCard>,
    @InjectRepository(Consumption)
    private consumptionRepository: Repository<Consumption>,
    private memberService: MemberService,
    private serviceService: ServiceService,
    private employeeService: EmployeeService,
    private dataSource: DataSource,
  ) {}

  // ========== 次卡套餐管理 ==========

  async createPackage(dto: CreateCountCardPackageDto): Promise<CountCardPackage> {
    const pkg = this.packageRepository.create(dto);
    return this.packageRepository.save(pkg);
  }

  async findAllPackages(): Promise<CountCardPackage[]> {
    return this.packageRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findPackage(id: string): Promise<CountCardPackage> {
    const pkg = await this.packageRepository.findOne({ where: { id } });
    if (!pkg) {
      throw new NotFoundException('次卡套餐不存在');
    }
    return pkg;
  }

  async updatePackage(id: string, dto: UpdateCountCardPackageDto): Promise<CountCardPackage> {
    const pkg = await this.findPackage(id);
    Object.assign(pkg, dto);
    return this.packageRepository.save(pkg);
  }

  async removePackage(id: string): Promise<void> {
    const pkg = await this.findPackage(id);
    pkg.isActive = false;
    await this.packageRepository.save(pkg);
  }

  // ========== 会员次卡购买 ==========

  private generateOrderNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CC${year}${month}${day}${random}`;
  }

  async purchase(dto: PurchaseCountCardDto, userId: string): Promise<MemberCountCard> {
    const member = await this.memberService.findOne(dto.memberId);
    if (!member) {
      throw new NotFoundException('会员不存在');
    }

    const pkg = await this.findPackage(dto.packageId);
    const orderNo = this.generateOrderNo();
    const totalCount = pkg.count + (pkg.giftCount || 0);
    const purchasePrice = dto.actualAmount ?? pkg.price;

    // 计算过期日期
    let expireDate: Date | null = null;
    if (pkg.validDays && pkg.validDays > 0) {
      expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + pkg.validDays);
    }

    // 使用事务
    return this.dataSource.transaction(async (manager) => {
      // 创建会员次卡
      const memberCountCard = manager.create(MemberCountCard, {
        memberId: dto.memberId,
        packageId: dto.packageId,
        orderNo,
        totalCount,
        remainingCount: totalCount,
        purchasePrice,
        expireDate: expireDate || undefined,
        status: MemberCountCardStatus.ACTIVE,
        usageRecords: [],
        createdBy: userId,
      });
      await manager.save(memberCountCard);

      // 创建消费记录
      const consumption = manager.create(Consumption, {
        orderNo,
        memberId: dto.memberId,
        consumptionType: ConsumptionType.RECHARGE,
        amount: pkg.price,
        actualAmount: purchasePrice,
        discountAmount: pkg.price - purchasePrice,
        paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
        items: [{
          serviceId: pkg.id,
          serviceName: `购买次卡: ${pkg.name}`,
          price: pkg.price,
          quantity: 1,
          amount: pkg.price,
        }],
        remark: dto.remark || `购买次卡套餐: ${pkg.name} (${totalCount}次)`,
        createdBy: userId,
      });
      await manager.save(consumption);

      // 更新会员累计消费
      await this.memberService.updateStats(dto.memberId, purchasePrice);

      return memberCountCard;
    });
  }

  // ========== 会员次卡查询 ==========

  async findByMember(memberId: string): Promise<MemberCountCard[]> {
    const cards = await this.memberCountCardRepository.find({
      where: { memberId },
      relations: ['package'],
      order: { createdAt: 'DESC' },
    });

    // 检查并更新过期状态
    const now = new Date();
    for (const card of cards) {
      if (card.status === MemberCountCardStatus.ACTIVE) {
        if (card.remainingCount <= 0) {
          card.status = MemberCountCardStatus.USED_UP;
          await this.memberCountCardRepository.save(card);
        } else if (card.expireDate && new Date(card.expireDate) < now) {
          card.status = MemberCountCardStatus.EXPIRED;
          await this.memberCountCardRepository.save(card);
        }
      }
    }

    return cards;
  }

  async findOneMemberCard(id: string): Promise<MemberCountCard> {
    const card = await this.memberCountCardRepository.findOne({
      where: { id },
      relations: ['package', 'member'],
    });
    if (!card) {
      throw new NotFoundException('会员次卡不存在');
    }
    return card;
  }

  // ========== 次卡消费扣次 ==========

  async useCountCard(dto: UseCountCardDto, userId: string): Promise<MemberCountCard> {
    const card = await this.findOneMemberCard(dto.memberCountCardId);

    // 检查状态
    if (card.status !== MemberCountCardStatus.ACTIVE) {
      throw new BadRequestException('次卡已失效');
    }

    // 检查过期
    if (card.expireDate && new Date(card.expireDate) < new Date()) {
      card.status = MemberCountCardStatus.EXPIRED;
      await this.memberCountCardRepository.save(card);
      throw new BadRequestException('次卡已过期');
    }

    // 检查剩余次数
    if (card.remainingCount < dto.count) {
      throw new BadRequestException('剩余次数不足');
    }

    // 检查服务是否适用
    const pkg = card.package;
    if (pkg.applicableServices && pkg.applicableServices.length > 0) {
      if (!pkg.applicableServices.includes(dto.serviceId)) {
        throw new BadRequestException('该服务不适用于此次卡');
      }
    }

    // 获取服务信息
    const service = await this.serviceService.findOne(dto.serviceId);
    let employeeName: string | undefined;
    if (dto.employeeId) {
      const employee = await this.employeeService.findOne(dto.employeeId);
      employeeName = employee.name;
    }

    // 记录使用
    const usageRecord: CountCardUsageRecord = {
      date: new Date().toISOString(),
      consumptionId: dto.consumptionId || '',
      serviceId: dto.serviceId,
      serviceName: service.name,
      employeeId: dto.employeeId,
      employeeName,
      count: dto.count,
    };

    card.remainingCount -= dto.count;
    card.usageRecords = [...(card.usageRecords || []), usageRecord];

    // 更新状态
    if (card.remainingCount <= 0) {
      card.status = MemberCountCardStatus.USED_UP;
    }

    return this.memberCountCardRepository.save(card);
  }

  // ========== 获取会员可用的次卡列表 ==========

  async getAvailableCards(memberId: string, serviceId?: string): Promise<MemberCountCard[]> {
    const cards = await this.findByMember(memberId);
    const now = new Date();

    return cards.filter(card => {
      if (card.status !== MemberCountCardStatus.ACTIVE) return false;
      if (card.remainingCount <= 0) return false;
      if (card.expireDate && new Date(card.expireDate) < now) return false;

      // 检查服务适用性
      if (serviceId && card.package?.applicableServices?.length) {
        return card.package.applicableServices.includes(serviceId);
      }

      return true;
    });
  }
}
