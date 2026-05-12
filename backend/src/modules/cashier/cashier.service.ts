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

  async create(dto: CreateConsumptionDto, userId: string, storeId?: string): Promise<Consumption> {
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
      // 优先使用前端传来的价格（已含会员价），否则用会员价或原价
      const price = item.price || (member ? (service.memberPrice || service.price) : service.price);
      const amount = item.amount || (price * item.quantity);
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

    // 前端传来的 actualAmount 已含折扣计算
    const actualAmount = dto.actualAmount || totalAmount;
    const discountAmount = totalAmount - actualAmount;

    // 会员卡支付处理
    if (dto.paymentMethod === PaymentMethod.CARD && member && dto.memberId) {
      if (Number(member.balance) < actualAmount) {
        throw new BadRequestException('会员余额不足');
      }
      await this.memberService.consume(dto.memberId, actualAmount);
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
      storeId: storeId || null,
      memberId: dto.memberId || null,
      consumptionType: dto.consumptionType || ConsumptionType.SERVICE,
      amount: totalAmount,
      actualAmount: actualAmount,
      discountAmount: discountAmount,
      paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
      paymentDetail: dto.paymentDetail || null,
      items: processedItems,
      employeeId: dto.employeeId || null,
      remark: dto.remark || null,
      createdBy: userId,
      commission: totalCommission,
      mergedTo: null,
      cancelledAt: null,
    } as Partial<Consumption>);

    // SQLite: 对象/数组字段必须序列化为JSON字符串
    const toSave = { ...consumption };
    if (toSave.items && typeof toSave.items !== 'string') {
      (toSave as any).items = JSON.stringify(toSave.items);
    }
    if (toSave.paymentDetail && typeof toSave.paymentDetail !== 'string') {
      (toSave as any).paymentDetail = JSON.stringify(toSave.paymentDetail);
    }

    const saved = await this.consumptionRepository.save(toSave as Consumption);
    // 返回时解析回对象
    if (typeof saved.items === 'string') {
      saved.items = JSON.parse(saved.items);
    }
    if (typeof saved.paymentDetail === 'string') {
      saved.paymentDetail = JSON.parse(saved.paymentDetail);
    }
    return saved;
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
      if (order.mergedTo) {
        throw new BadRequestException(`订单 ${order.orderNo} 已合并到 ${order.mergedTo}，不能再次合并`);
      }
      if (order.cancelledAt) {
        throw new BadRequestException(`订单 ${order.orderNo} 已取消，不能合并`);
      }
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
        const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        allItems.push(...orderItems);
      }

      if (order.employeeId) {
        employeeIds.add(order.employeeId);
      }
    }

    // 创建合并后的新订单
    const mergedOrder = this.consumptionRepository.create({
      orderNo: mergedOrderNo,
      memberId: dto.memberId || orders[0].memberId || null,
      consumptionType: ConsumptionType.SERVICE,
      amount: totalAmount,
      actualAmount: totalActualAmount,
      discountAmount: totalDiscountAmount,
      paymentMethod: dto.paymentMethod || PaymentMethod.MIXED,
      items: allItems,
      employeeId: employeeIds.size === 1 ? Array.from(employeeIds)[0] : null,
      remark: dto.remark || `合并订单: ${orders.map(o => o.orderNo).join(', ')}`,
      createdBy: userId,
      commission: totalCommission,
      mergedTo: null,
      cancelledAt: null,
    } as Partial<Consumption>);

    // SQLite: 序列化对象字段
    const toSave = { ...mergedOrder };
    if (toSave.items && typeof toSave.items !== 'string') {
      (toSave as any).items = JSON.stringify(toSave.items);
    }

    const savedOrder = await this.consumptionRepository.save(toSave as Consumption);

    // 标记原订单为已合并
    await this.consumptionRepository.update(
      { id: In(dto.orderIds) },
      { mergedTo: mergedOrderNo }
    );

    return savedOrder;
  }

  // 单据查询
  async queryDocuments(dto: DocumentQueryDto, storeId?: string): Promise<{ data: Consumption[]; total: number }> {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;

    // 先查总数
    const countBuilder = this.consumptionRepository.createQueryBuilder('c')
      .leftJoin('c.member', 'member')
      .where('c.merged_to IS NULL')
      .andWhere('c.cancelled_at IS NULL');

    if (storeId) {
      countBuilder.andWhere('c.store_id = :storeId', { storeId });
    }

    if (dto.startDate) {
      countBuilder.andWhere('date(c.created_at) >= date(:sd)', { sd: dto.startDate });
    }
    if (dto.endDate) {
      countBuilder.andWhere('date(c.created_at) <= date(:ed)', { ed: dto.endDate });
    }
    if (dto.keyword) {
      countBuilder.andWhere('(c.order_no LIKE :kw OR member.name LIKE :kw OR member.phone LIKE :kw)', { kw: `%${dto.keyword}%` });
    }
    if (dto.orderNo) {
      countBuilder.andWhere('c.order_no LIKE :on', { on: `%${dto.orderNo}%` });
    }
    if (dto.memberKeyword) {
      countBuilder.andWhere('(member.name LIKE :mk OR member.phone LIKE :mk)', { mk: `%${dto.memberKeyword}%` });
    }
    if (dto.paymentMethod) {
      countBuilder.andWhere('c.payment_method = :pm', { pm: dto.paymentMethod });
    }
    if (dto.status) {
      countBuilder.andWhere('c.review_status = :rs', { rs: dto.status });
    }

    const total = await countBuilder.getCount();

    // 再查数据
    const dataBuilder = this.consumptionRepository.createQueryBuilder('c')
      .leftJoinAndSelect('c.member', 'member')
      .leftJoinAndSelect('c.employee', 'employee')
      .where('c.merged_to IS NULL')
      .andWhere('c.cancelled_at IS NULL');

    if (storeId) {
      dataBuilder.andWhere('c.store_id = :storeId2', { storeId2: storeId });
    }

    if (dto.startDate) {
      dataBuilder.andWhere('date(c.created_at) >= date(:sd)', { sd: dto.startDate });
    }
    if (dto.endDate) {
      dataBuilder.andWhere('date(c.created_at) <= date(:ed)', { ed: dto.endDate });
    }
    if (dto.keyword) {
      dataBuilder.andWhere('(c.order_no LIKE :kw OR member.name LIKE :kw OR member.phone LIKE :kw)', { kw: `%${dto.keyword}%` });
    }
    if (dto.orderNo) {
      dataBuilder.andWhere('c.order_no LIKE :on', { on: `%${dto.orderNo}%` });
    }
    if (dto.memberKeyword) {
      dataBuilder.andWhere('(member.name LIKE :mk OR member.phone LIKE :mk)', { mk: `%${dto.memberKeyword}%` });
    }
    if (dto.paymentMethod) {
      dataBuilder.andWhere('c.payment_method = :pm', { pm: dto.paymentMethod });
    }
    if (dto.status) {
      dataBuilder.andWhere('c.review_status = :rs', { rs: dto.status });
    }

    const data = await dataBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // 解析items和paymentDetail JSON字符串
    for (const item of data) {
      if (typeof item.items === 'string') {
        try { item.items = JSON.parse(item.items); } catch { item.items = []; }
      }
      if (typeof item.paymentDetail === 'string') {
        try { item.paymentDetail = JSON.parse(item.paymentDetail); } catch { item.paymentDetail = {} as any; }
      }
    }

    return { data, total };
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
        consumptionType: ConsumptionType.RECHARGE,
        amount: dto.rechargeAmount,
        actualAmount: dto.rechargeAmount,
        discountAmount: 0,
        paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
        items: [],
        employeeId: dto.employeeId || null,
        remark: dto.remark || '开卡充值',
        createdBy: userId,
        mergedTo: null,
        cancelledAt: null,
      } as Partial<Consumption>);

      // SQLite: 序列化对象字段
      const toSave = { ...consumption };
      if (toSave.items && typeof toSave.items !== 'string') {
        (toSave as any).items = JSON.stringify(toSave.items);
      }

      await this.consumptionRepository.save(toSave as Consumption);

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
    if (order.mergedTo) {
      throw new BadRequestException('已合并的订单不能取消');
    }
    if (order.cancelledAt) {
      throw new BadRequestException('订单已取消');
    }

    // 会员卡支付退款到会员卡
    if (order.paymentMethod === PaymentMethod.CARD && order.memberId) {
      await this.memberService.recharge(order.memberId, Number(order.actualAmount));
    }

    order.cancelledAt = new Date().toISOString();
    order.remark = `${order.remark || ''} [已取消 by ${userId}]`;

    const saved = await this.consumptionRepository.save(order);
    if (typeof saved.items === 'string') {
      try { saved.items = JSON.parse(saved.items); } catch { saved.items = []; }
    }
    if (typeof saved.paymentDetail === 'string') {
      try { saved.paymentDetail = JSON.parse(saved.paymentDetail); } catch { saved.paymentDetail = {} as any; }
    }
    return saved;
  }

  // 审核订单
  async reviewOrder(orderNo: string, userId: string, userRole: string): Promise<Consumption> {
    const order = await this.getOrderDetail(orderNo);

    if (order.cancelledAt) {
      throw new BadRequestException('已取消的订单不能审核');
    }
    if (order.mergedTo) {
      throw new BadRequestException('已合并的订单不能审核');
    }
    if (order.reviewStatus === 'reviewed') {
      throw new BadRequestException('订单已审核，不能重复审核');
    }

    // 只有店长或管理员可以审核
    if (userRole !== 'admin' && userRole !== 'manager') {
      throw new BadRequestException('只有店长或管理员可以审核订单');
    }

    order.reviewStatus = 'reviewed';
    order.reviewedBy = userId;
    order.reviewedAt = new Date().toISOString();

    const saved = await this.consumptionRepository.save(order);
    if (typeof saved.items === 'string') {
      try { saved.items = JSON.parse(saved.items); } catch { saved.items = []; }
    }
    if (typeof saved.paymentDetail === 'string') {
      try { saved.paymentDetail = JSON.parse(saved.paymentDetail); } catch { saved.paymentDetail = {} as any; }
    }
    return saved;
  }

  // 修改订单
  async updateOrder(orderNo: string, dto: any, userId: string, userRole: string): Promise<Consumption> {
    const order = await this.getOrderDetail(orderNo);

    if (order.cancelledAt) {
      throw new BadRequestException('已取消的订单不能修改');
    }
    if (order.mergedTo) {
      throw new BadRequestException('已合并的订单不能修改');
    }

    // 收银员只能修改未审核的订单，店长/管理员可以修改任何订单
    if (order.reviewStatus === 'reviewed' && userRole !== 'admin' && userRole !== 'manager') {
      throw new BadRequestException('已审核的订单只有店长或管理员可以修改');
    }

    // 允许修改的字段
    const allowedFields = ['remark', 'manualOrderNo', 'employeeId', 'items', 'actualAmount', 'discountAmount', 'discountType', 'paymentMethod', 'paymentDetail'];
    const updateData: Partial<Consumption> = {};

    for (const field of allowedFields) {
      if (dto[field] !== undefined) {
        (updateData as any)[field] = dto[field];
      }
    }

    // SQLite: 序列化对象字段
    if (updateData.items && typeof updateData.items !== 'string') {
      (updateData as any).items = JSON.stringify(updateData.items);
    }
    if (updateData.paymentDetail && typeof updateData.paymentDetail !== 'string') {
      (updateData as any).paymentDetail = JSON.stringify(updateData.paymentDetail);
    }

    // 如果修改了金额相关字段，重新计算
    if (dto.items) {
      const processedItems: ConsumptionItem[] = [];
      let totalAmount = 0;

      for (const item of dto.items) {
        const service = await this.serviceService.findOne(item.serviceId);
        const price = item.price || service.price;
        const amount = item.amount || (price * item.quantity);
        totalAmount += amount;

        let employeeName: string | undefined;
        if (item.employeeId) {
          employeeName = (await this.employeeService.findOne(item.employeeId)).name;
        }

        processedItems.push({
          serviceId: item.serviceId,
          serviceName: service.name,
          price,
          quantity: item.quantity,
          amount,
          employeeId: item.employeeId,
          employeeName,
        });
      }

      (updateData as any).items = JSON.stringify(processedItems);
      (updateData as any).amount = totalAmount;

      if (dto.actualAmount !== undefined) {
        (updateData as any).discountAmount = totalAmount - dto.actualAmount;
      }
    }

    await this.consumptionRepository.update(order.id, updateData);

    const updated = await this.getOrderDetail(orderNo);
    // 解析JSON字段
    if (typeof updated.items === 'string') {
      try { updated.items = JSON.parse(updated.items); } catch { updated.items = []; }
    }
    if (typeof updated.paymentDetail === 'string') {
      try { updated.paymentDetail = JSON.parse(updated.paymentDetail); } catch { updated.paymentDetail = {} as any; }
    }
    return updated;
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
