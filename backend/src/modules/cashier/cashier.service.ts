import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { Consumption, PaymentMethod, ConsumptionType, ConsumptionItem } from './consumption.entity';
import { MemberService } from '../member/member.service';
import { EmployeeService } from '../employee/employee.service';
import { ServiceService } from '../service/service.service';
import { CreateConsumptionDto, ConsumptionItemDto } from './dto/create-consumption.dto';
import { MergeOrdersDto, DocumentQueryDto, OpenCardDto } from './dto/cashier.dto';
import { DiscountService } from './services/discount.service';

@Injectable()
export class CashierService {
  constructor(
    @InjectRepository(Consumption)
    private consumptionRepository: Repository<Consumption>,
    private memberService: MemberService,
    private employeeService: EmployeeService,
    private serviceService: ServiceService,
    private discountService: DiscountService,
  ) {}

  private generateOrderNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ME${year}${month}${day}${random}`;
  }

  async create(dto: CreateConsumptionDto, userId: string): Promise<Consumption> {
    const orderNo = this.generateOrderNo();
    
    let member = null;
    if (dto.memberId) {
      member = await this.memberService.findOne(dto.memberId);
    }

    // 计算消费金额
    let totalAmount = 0;
    let totalCommission = 0;
    const processedItems: ConsumptionItem[] = [];
    
    for (const item of dto.items) {
      const service = await this.serviceService.findOne(item.serviceId);
      const price = member ? (service.memberPrice || service.price) : service.price;
      const amount = price * item.quantity;
      totalAmount += amount;
      
      let employeeName: string | undefined;
      // 计算提成
      if (item.employeeId) {
        const commission = service.fixedCommission || (amount * (service.commissionRate || 0) / 100);
        totalCommission += commission;
        employeeName = (await this.employeeService.findOne(item.employeeId)).name;
      }
      
      processedItems.push({
        serviceId: item.serviceId,
        serviceName: service.name,
        price: price,
        quantity: item.quantity,
        amount: amount,
        employeeId: item.employeeId,
        employeeName: employeeName,
      });
    }

    // 会员卡支付处理
    if (dto.paymentMethod === PaymentMethod.CARD && member && dto.memberId) {
      if (Number(member.balance) < totalAmount) {
        throw new BadRequestException('会员余额不足');
      }
      await this.memberService.consume(dto.memberId, totalAmount);
    }

    // 更新员工业绩
    for (const item of processedItems) {
      if (item.employeeId && item.amount) {
        const service = await this.serviceService.findOne(item.serviceId);
        const commission = service.fixedCommission || (item.amount * (service.commissionRate || 0) / 100);
        await this.employeeService.updateStats(item.employeeId, item.amount, commission);
      }
    }

    const consumption = this.consumptionRepository.create({
      orderNo,
      memberId: dto.memberId || undefined,
      member: member || undefined,
      consumptionType: dto.consumptionType || ConsumptionType.SERVICE,
      amount: totalAmount,
      actualAmount: dto.actualAmount || totalAmount,
      discountAmount: totalAmount - (dto.actualAmount || totalAmount),
      paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
      paymentDetail: dto.paymentDetail,
      items: processedItems,
      employeeId: dto.employeeId,
      remark: dto.remark,
      createdBy: userId,
      commission: totalCommission,
    });

    return this.consumptionRepository.save(consumption);
  }

  async findByDate(startDate: Date, endDate: Date): Promise<Consumption[]> {
    return this.consumptionRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ['member', 'employee'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDailySummary(date: Date): Promise<any> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const consumptions = await this.findByDate(start, end);

    const totalAmount = consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);
    const totalCommission = consumptions.reduce((sum, c) => sum + Number(c.commission || 0), 0);
    const totalCount = consumptions.length;

    return {
      date: start.toISOString().split('T')[0],
      totalAmount,
      totalCommission,
      totalCount,
      consumptions,
    };
  }

  // 合单功能
  async mergeOrders(dto: MergeOrdersDto, userId: string): Promise<Consumption> {
    if (!dto.orderIds || dto.orderIds.length < 2) {
      throw new BadRequestException('至少需要选择2个订单进行合并');
    }

    // 查询所有待合并的订单
    const orders = await this.consumptionRepository.find({
      where: { id: In(dto.orderIds) },
      relations: ['member'],
    });

    if (orders.length !== dto.orderIds.length) {
      throw new BadRequestException('部分订单不存在');
    }

    // 检查订单状态
    for (const order of orders) {
      if (order.paymentMethod === PaymentMethod.CARD) {
        throw new BadRequestException(`订单 ${order.orderNo} 已使用会员卡支付，不能合并`);
      }
    }

    // 合并订单数据
    const mergedOrderNo = this.generateOrderNo();
    let totalAmount = 0;
    let totalActualAmount = 0;
    let totalDiscountAmount = 0;
    let totalCommission = 0;
    const allItems: ConsumptionItem[] = [];
    const employeeIds = new Set<string>();

    for (const order of orders) {
      totalAmount += Number(order.amount);
      totalActualAmount += Number(order.actualAmount);
      totalDiscountAmount += Number(order.discountAmount);
      totalCommission += Number(order.commission || 0);
      
      if (order.items) {
        allItems.push(...order.items);
      }
      
      if (order.employeeId) {
        employeeIds.add(order.employeeId);
      }
    }

    // 创建合并后的新订单
    const mergedOrder = this.consumptionRepository.create({
      orderNo: mergedOrderNo,
      memberId: dto.memberId || orders[0].memberId,
      consumptionType: ConsumptionType.SERVICE,
      amount: totalAmount,
      actualAmount: totalActualAmount,
      discountAmount: totalDiscountAmount,
      paymentMethod: dto.paymentMethod || PaymentMethod.MIXED,
      items: allItems,
      employeeId: employeeIds.size === 1 ? Array.from(employeeIds)[0] : undefined,
      remark: dto.remark || `合并订单: ${orders.map(o => o.orderNo).join(', ')}`,
      createdBy: userId,
      commission: totalCommission,
    });

    const savedOrder = await this.consumptionRepository.save(mergedOrder);

    // 标记原订单为已合并（删除或标记）
    await this.consumptionRepository.update(
      { id: In(dto.orderIds) },
      { remark: `已合并到订单: ${mergedOrderNo}` }
    );

    return savedOrder;
  }

  // 单据查询
  async queryDocuments(dto: DocumentQueryDto): Promise<{ data: Consumption[]; total: number; page: number; pageSize: number }> {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.consumptionRepository.createQueryBuilder('consumption')
      .leftJoinAndSelect('consumption.member', 'member')
      .leftJoinAndSelect('consumption.employee', 'employee');

    // 按类型筛选
    if (dto.type) {
      queryBuilder.andWhere('consumption.consumptionType = :type', { type: dto.type });
    }

    // 按日期范围筛选
    if (dto.startDate) {
      queryBuilder.andWhere('consumption.createdAt >= :startDate', { 
        startDate: new Date(dto.startDate) 
      });
    }
    if (dto.endDate) {
      const endDate = new Date(dto.endDate);
      endDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('consumption.createdAt <= :endDate', { endDate });
    }

    // 按会员筛选
    if (dto.memberId) {
      queryBuilder.andWhere('consumption.memberId = :memberId', { memberId: dto.memberId });
    }

    // 关键词搜索
    if (dto.keyword) {
      queryBuilder.andWhere(
        '(consumption.orderNo LIKE :keyword OR member.name LIKE :keyword OR member.phone LIKE :keyword)',
        { keyword: `%${dto.keyword}%` }
      );
    }

    queryBuilder
      .orderBy('consumption.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, pageSize };
  }

  // 开卡入口
  async openCard(dto: OpenCardDto, userId: string): Promise<{ member: any; consumption: Consumption | null }> {
    // 检查手机号是否已存在
    if (dto.phone) {
      try {
        const existingMember = await this.memberService.findByPhone(dto.phone);
        if (existingMember) {
          throw new BadRequestException('该手机号已注册会员');
        }
      } catch (e) {
        // 如果是找不到会员的错误，继续执行
        if (!(e instanceof NotFoundException)) {
          throw e;
        }
      }
    }

    // 创建会员
    const member = await this.memberService.create({
      name: dto.name,
      phone: dto.phone,
      balance: dto.initialBalance || 0,
    });

    let consumption: Consumption | null = null;

    // 如果有充值，创建充值消费记录
    if (dto.rechargeAmount && dto.rechargeAmount > 0) {
      const orderNo = this.generateOrderNo();
      
      consumption = this.consumptionRepository.create({
        orderNo,
        memberId: member.id,
        member: member,
        consumptionType: ConsumptionType.RECHARGE,
        amount: dto.rechargeAmount,
        actualAmount: dto.rechargeAmount,
        discountAmount: 0,
        paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
        items: [],
        employeeId: dto.employeeId,
        remark: dto.remark || '开卡充值',
        createdBy: userId,
      });

      await this.consumptionRepository.save(consumption);

      // 更新会员余额
      await this.memberService.recharge(member.id, dto.rechargeAmount);
    }

    return { member, consumption };
  }

  // 获取订单详情
  async getOrderDetail(orderNo: string): Promise<Consumption> {
    const order = await this.consumptionRepository.findOne({
      where: { orderNo },
      relations: ['member', 'employee'],
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return order;
  }

  // 取消订单
  async cancelOrder(orderNo: string, userId: string): Promise<Consumption> {
    const order = await this.getOrderDetail(orderNo);

    // 检查是否可以取消
    if (order.paymentMethod === PaymentMethod.CARD && order.memberId) {
      // 退款到会员卡
      await this.memberService.recharge(order.memberId, Number(order.actualAmount));
    }

    // 软删除或标记
    order.remark = `${order.remark || ''} [已取消 by ${userId}]`;
    
    return this.consumptionRepository.save(order);
  }

  // 获取商品列表
  async getProducts(categoryId?: string, keyword?: string): Promise<any[]> {
    // 获取服务项目作为商品
    const { data: services } = await this.serviceService.findAll();
    
    let result = services.map((s: any) => ({
      id: s.id,
      name: s.name,
      type: 'service',
      categoryId: s.categoryId,
      price: s.price,
      memberPrice: s.memberPrice,
      unit: '次',
      spec: s.duration ? `${s.duration}分钟` : '',
    }));

    // 按分类筛选
    if (categoryId) {
      result = result.filter((s: any) => s.categoryId === categoryId);
    }

    // 关键词搜索
    if (keyword) {
      result = result.filter((s: any) => s.name.includes(keyword));
    }

    return result;
  }
}
