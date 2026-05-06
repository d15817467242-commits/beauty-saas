import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { FlashSale, FlashSaleOrder, FlashSaleStatus } from './flash-sale.entity';
import { CreateFlashSaleDto, UpdateFlashSaleDto, BuyFlashSaleDto } from './dto/flash-sale.dto';

@Injectable()
export class FlashSaleService {
  constructor(
    @InjectRepository(FlashSale)
    private flashSaleRepository: Repository<FlashSale>,
    @InjectRepository(FlashSaleOrder)
    private flashSaleOrderRepository: Repository<FlashSaleOrder>,
  ) {}

  // 创建秒杀活动
  async create(dto: CreateFlashSaleDto, userId: string): Promise<FlashSale> {
    const flashSale = this.flashSaleRepository.create({
      ...dto,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      createdBy: userId,
    });
    return this.flashSaleRepository.save(flashSale);
  }

  // 获取秒杀活动列表
  async findAll(): Promise<FlashSale[]> {
    return this.flashSaleRepository.find({
      relations: ['service'],
      order: { createdAt: 'DESC' },
    });
  }

  // 获取进行中的秒杀活动
  async findActive(): Promise<FlashSale[]> {
    const now = new Date();
    return this.flashSaleRepository.find({
      where: {
        status: FlashSaleStatus.ACTIVE,
        startTime: LessThan(now),
        endTime: MoreThan(now),
      },
      relations: ['service'],
      order: { startTime: 'ASC' },
    });
  }

  // 获取即将开始的秒杀活动
  async findUpcoming(): Promise<FlashSale[]> {
    const now = new Date();
    return this.flashSaleRepository.find({
      where: {
        status: FlashSaleStatus.UPCOMING,
        startTime: MoreThan(now),
      },
      relations: ['service'],
      order: { startTime: 'ASC' },
    });
  }

  // 获取单个秒杀活动
  async findOne(id: string): Promise<FlashSale> {
    const flashSale = await this.flashSaleRepository.findOne({
      where: { id },
      relations: ['service'],
    });
    if (!flashSale) {
      throw new NotFoundException('秒杀活动不存在');
    }
    return flashSale;
  }

  // 更新秒杀活动
  async update(id: string, dto: UpdateFlashSaleDto): Promise<FlashSale> {
    const flashSale = await this.findOne(id);
    Object.assign(flashSale, dto);
    return this.flashSaleRepository.save(flashSale);
  }

  // 删除秒杀活动
  async remove(id: string): Promise<void> {
    const flashSale = await this.findOne(id);
    await this.flashSaleRepository.remove(flashSale);
  }

  // 秒杀下单
  async buy(dto: BuyFlashSaleDto, memberId: string): Promise<FlashSaleOrder> {
    const flashSale = await this.findOne(dto.flashSaleId);
    
    // 检查活动状态
    if (flashSale.status !== FlashSaleStatus.ACTIVE) {
      throw new BadRequestException('秒杀活动未开始或已结束');
    }
    
    const now = new Date();
    if (now < flashSale.startTime || now > flashSale.endTime) {
      throw new BadRequestException('不在活动时间范围内');
    }
    
    // 检查库存
    if (flashSale.soldCount + dto.quantity > flashSale.totalStock) {
      throw new BadRequestException('库存不足');
    }
    
    // 检查限购
    const purchasedCount = await this.flashSaleOrderRepository.count({
      where: { flashSaleId: dto.flashSaleId, memberId },
    });
    if (purchasedCount >= flashSale.perLimit) {
      throw new BadRequestException('已达到购买上限');
    }
    
    // 创建秒杀订单
    const order = this.flashSaleOrderRepository.create({
      flashSaleId: dto.flashSaleId,
      memberId,
      paidAmount: flashSale.flashPrice * dto.quantity,
      quantity: dto.quantity,
      orderTime: now,
    });
    await this.flashSaleOrderRepository.save(order);
    
    // 更新销量
    flashSale.soldCount += dto.quantity;
    await this.flashSaleRepository.save(flashSale);
    
    return order;
  }

  // 获取会员秒杀订单
  async getMemberOrders(memberId: string): Promise<FlashSaleOrder[]> {
    return this.flashSaleOrderRepository.find({
      where: { memberId },
      relations: ['flashSale', 'flashSale.service'],
      order: { createdAt: 'DESC' },
    });
  }

  // 更新活动状态（定时任务调用）
  async updateStatus(): Promise<void> {
    const now = new Date();
    
    // 更新即将开始的活动
    const upcomingSales = await this.flashSaleRepository.find({
      where: {
        status: FlashSaleStatus.DRAFT,
        startTime: LessThan(new Date(now.getTime() + 30 * 60 * 1000)), // 30分钟内开始
      },
    });
    for (const sale of upcomingSales) {
      sale.status = FlashSaleStatus.UPCOMING;
      await this.flashSaleRepository.save(sale);
    }
    
    // 更新进行中的活动
    const activeSales = await this.flashSaleRepository.find({
      where: {
        status: FlashSaleStatus.UPCOMING,
        startTime: LessThan(now),
      },
    });
    for (const sale of activeSales) {
      sale.status = FlashSaleStatus.ACTIVE;
      await this.flashSaleRepository.save(sale);
    }
    
    // 更新已结束的活动
    const endedSales = await this.flashSaleRepository.find({
      where: {
        status: FlashSaleStatus.ACTIVE,
        endTime: LessThan(now),
      },
    });
    for (const sale of endedSales) {
      sale.status = FlashSaleStatus.ENDED;
      await this.flashSaleRepository.save(sale);
    }
  }
}
