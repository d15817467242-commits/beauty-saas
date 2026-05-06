import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThan } from 'typeorm';
import { MiniappUser, MiniappUserStatus } from './entities/miniapp-user.entity';
import { Member } from '../member/member.entity';
import { Employee, EmployeeStatus } from '../employee/entities/employee.entity';
import { Service } from '../service/service.entity';
import { Consumption } from '../cashier/consumption.entity';
import { Appointment, AppointmentStatus } from '../appointment/appointment.entity';
import { CountCardPackage } from '../count-card/count-card-package.entity';
import { MemberCountCard, MemberCountCardStatus } from '../count-card/member-count-card.entity';
import { Credit, CreditStatus } from '../cashier/credit.entity';
import { Coupon, MemberCoupon, CouponStatus } from '../marketing/coupon.entity';
import { PointsMallGoods, PointsExchange, ExchangeStatus, PointsMallStatus } from '../marketing/points-mall.entity';

// 微信小程序用户会话
interface WxSession {
  openid: string;
  session_key: string;
  memberId?: string;
  phone?: string;
}

@Injectable()
export class MiniappService {
  // 内存存储会话（生产环境应使用Redis）
  private sessions: Map<string, WxSession> = new Map();

  constructor(
    @InjectRepository(MiniappUser)
    private miniappUserRepository: Repository<MiniappUser>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(Consumption)
    private consumptionRepository: Repository<Consumption>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(CountCardPackage)
    private countCardPackageRepository: Repository<CountCardPackage>,
    @InjectRepository(MemberCountCard)
    private memberCountCardRepository: Repository<MemberCountCard>,
    @InjectRepository(Credit)
    private creditRepository: Repository<Credit>,
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(MemberCoupon)
    private memberCouponRepository: Repository<MemberCoupon>,
    @InjectRepository(PointsMallGoods)
    private pointsMallGoodsRepository: Repository<PointsMallGoods>,
    @InjectRepository(PointsExchange)
    private pointsExchangeRepository: Repository<PointsExchange>,
  ) {}

  // ========== 微信登录 ==========

  // 微信授权登录
  async wxLogin(code: string): Promise<{ token: string; openid: string; isNew: boolean; userInfo?: MiniappUser }> {
    // 实际项目中应该调用微信API获取openid和session_key
    // const wxResponse = await axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=...&secret=...&js_code=${code}&grant_type=authorization_code`);
    
    // 模拟openid生成（实际需要调用微信API）
    const openid = `wx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session_key = `sk_${Math.random().toString(36).substr(2, 32)}`;
    
    // 查找或创建小程序用户
    let miniappUser = await this.miniappUserRepository.findOne({ where: { openid } });
    let isNew = false;
    
    if (!miniappUser) {
      miniappUser = this.miniappUserRepository.create({
        openid,
        status: MiniappUserStatus.ACTIVE,
        loginCount: 1,
        lastLoginAt: new Date(),
      });
      await this.miniappUserRepository.save(miniappUser);
      isNew = true;
    } else {
      // 更新登录信息
      miniappUser.loginCount += 1;
      miniappUser.lastLoginAt = new Date();
      await this.miniappUserRepository.save(miniappUser);
    }
    
    // 存储会话
    this.sessions.set(openid, { openid, session_key, memberId: miniappUser.memberId });
    
    // 生成token
    const token = Buffer.from(`${openid}:${Date.now()}`).toString('base64');
    
    return { token, openid, isNew, userInfo: miniappUser };
  }

  // 绑定手机号（会员绑定）
  async bindPhone(openid: string, phone: string, name?: string): Promise<{ miniappUser: MiniappUser; member: Member }> {
    // 查找小程序用户
    let miniappUser = await this.miniappUserRepository.findOne({ where: { openid } });
    if (!miniappUser) {
      throw new UnauthorizedException('请先登录');
    }
    
    // 查找是否已有会员
    let member = await this.memberRepository.findOne({ where: { phone } });
    
    if (!member) {
      // 创建新会员
      member = this.memberRepository.create({
        name: name || `微信用户${phone.slice(-4)}`,
        phone,
        level: 'normal' as any,
        points: 0,
        balance: 0,
        totalSpent: 0,
        visitCount: 0,
      });
      await this.memberRepository.save(member);
    }
    
    // 更新小程序用户
    miniappUser.phone = phone;
    miniappUser.memberId = member.id;
    await this.miniappUserRepository.save(miniappUser);
    
    // 更新会话
    const session = this.sessions.get(openid);
    if (session) {
      session.memberId = member.id;
      session.phone = phone;
    }
    
    return { miniappUser, member };
  }

  // 更新用户信息
  async updateUserInfo(openid: string, data: { nickname?: string; avatar?: string; gender?: number }): Promise<MiniappUser> {
    const miniappUser = await this.miniappUserRepository.findOne({ where: { openid } });
    if (!miniappUser) {
      throw new UnauthorizedException('用户不存在');
    }
    
    if (data.nickname) miniappUser.nickname = data.nickname;
    if (data.avatar) miniappUser.avatar = data.avatar;
    if (data.gender !== undefined) miniappUser.gender = data.gender;
    
    return this.miniappUserRepository.save(miniappUser);
  }

  // 获取当前登录用户
  async getCurrentUser(openid: string): Promise<{ miniappUser: MiniappUser; member?: Member }> {
    const miniappUser = await this.miniappUserRepository.findOne({ where: { openid } });
    if (!miniappUser) {
      throw new UnauthorizedException('用户不存在');
    }
    
    let member: Member | undefined;
    if (miniappUser.memberId) {
      const found = await this.memberRepository.findOne({ where: { id: miniappUser.memberId } });
      member = found || undefined;
    }
    
    return { miniappUser, member };
  }

  // ========== 会员信息查询 ==========

  async getMemberInfo(memberId: string): Promise<any> {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) {
      throw new UnauthorizedException('会员不存在');
    }
    
    // 获取会员的次卡
    const countCards = await this.memberCountCardRepository.find({
      where: { memberId },
      relations: ['package'],
    });
    
    // 获取会员的储值卡充值记录
    const credits = await this.creditRepository.find({
      where: { memberId },
      order: { createdAt: 'DESC' },
      take: 5,
    });
    
    return {
      member,
      countCards,
      recentCredits: credits,
    };
  }

  // ========== 余额/余次查询 ==========

  async getBalanceAndCount(memberId: string): Promise<any> {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) {
      throw new UnauthorizedException('会员不存在');
    }
    
    // 获取次卡余额
    const countCards = await this.memberCountCardRepository.find({
      where: { memberId, status: MemberCountCardStatus.ACTIVE },
      relations: ['package'],
    });
    
    const countCardInfo = countCards.map(cc => ({
      id: cc.id,
      packageName: cc.package?.name || '次卡',
      totalCount: cc.totalCount,
      usedCount: cc.totalCount - cc.remainingCount,
      remainingCount: cc.remainingCount,
      expireDate: cc.expireDate,
      status: cc.status,
    }));
    
    return {
      balance: member.balance,  // 储值余额
      points: member.points,    // 积分
      countCards: countCardInfo, // 次卡信息
    };
  }

  // ========== 消费历史查询 ==========

  async getConsumptionHistory(memberId: string, page: number = 1, limit: number = 20): Promise<any> {
    const [consumptions, total] = await this.consumptionRepository.findAndCount({
      where: { memberId },
      relations: ['employee'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return {
      list: consumptions,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ========== 预约接口 ==========

  // 创建预约
  async createAppointment(memberId: string, data: any): Promise<Appointment> {
    // 检查时段是否可预约
    const existingAppointment = await this.appointmentRepository.findOne({
      where: {
        employeeId: data.employeeId,
        appointmentDate: data.appointmentDate,
        startTime: data.startTime,
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
    });
    
    if (existingAppointment) {
      throw new BadRequestException('该时段已被预约');
    }
    
    const appointment = this.appointmentRepository.create({
      memberId,
      serviceId: data.serviceId,
      employeeId: data.employeeId,
      appointmentDate: data.appointmentDate,
      startTime: data.startTime,
      endTime: data.endTime,
      status: AppointmentStatus.PENDING,
      remark: data.remark,
      createdBy: memberId,
    });
    
    return this.appointmentRepository.save(appointment);
  }

  // 获取预约列表
  async getAppointments(memberId: string, status?: string): Promise<any[]> {
    const where: any = { memberId };
    if (status) {
      where.status = status;
    }
    
    const appointments = await this.appointmentRepository.find({
      where,
      relations: ['employee', 'service'],
      order: { appointmentDate: 'DESC', startTime: 'DESC' },
    });
    
    return appointments.map(a => ({
      id: a.id,
      serviceId: a.serviceId,
      serviceName: a.service?.name,
      servicePrice: a.service?.price,
      employeeId: a.employeeId,
      employeeName: a.employee?.name,
      employeeAvatar: a.employee?.avatar,
      appointmentDate: a.appointmentDate,
      startTime: a.startTime,
      endTime: a.endTime,
      status: a.status,
      remark: a.remark,
      createdAt: a.createdAt,
    }));
  }

  // 取消预约
  async cancelAppointment(memberId: string, appointmentId: string, reason?: string): Promise<void> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId, memberId },
    });
    
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }
    
    if (appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('该预约无法取消');
    }
    
    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancelReason = reason || '用户取消';
    await this.appointmentRepository.save(appointment);
  }

  // ========== 会员卡接口 ==========

  // 获取会员卡信息
  async getMemberCard(memberId: string): Promise<any> {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) {
      throw new UnauthorizedException('会员不存在');
    }
    
    return {
      id: member.id,
      name: member.name,
      phone: member.phone,
      level: member.level,
      balance: member.balance,
      points: member.points,
      totalSpent: member.totalSpent,
      visitCount: member.visitCount,
      lastVisitAt: member.lastVisitAt,
    };
  }

  // 获取次卡列表
  async getCountCards(memberId: string): Promise<any[]> {
    const countCards = await this.memberCountCardRepository.find({
      where: { memberId },
      relations: ['package'],
      order: { createdAt: 'DESC' },
    });
    
    return countCards.map(cc => ({
      id: cc.id,
      packageId: cc.packageId,
      packageName: cc.package?.name,
      packageImage: cc.package?.image,
      totalCount: cc.totalCount,
      remainingCount: cc.remainingCount,
      usedCount: cc.totalCount - cc.remainingCount,
      purchasePrice: cc.purchasePrice,
      expireDate: cc.expireDate,
      status: cc.status,
      createdAt: cc.createdAt,
    }));
  }

  // ========== 优惠券接口 ==========

  // 获取我的优惠券
  async getCoupons(memberId: string, status?: 'available' | 'used' | 'expired'): Promise<any[]> {
    const now = new Date();
    
    let query = this.memberCouponRepository
      .createQueryBuilder('mc')
      .leftJoinAndSelect('mc.coupon', 'coupon')
      .where('mc.memberId = :memberId', { memberId });
    
    if (status === 'available') {
      query = query.andWhere('mc.used = false').andWhere('mc.expireTime > :now', { now });
    } else if (status === 'used') {
      query = query.andWhere('mc.used = true');
    } else if (status === 'expired') {
      query = query.andWhere('mc.expireTime <= :now');
    }
    
    const memberCoupons = await query.orderBy('mc.createdAt', 'DESC').getMany();
    
    return memberCoupons.map(mc => ({
      id: mc.id,
      couponId: mc.couponId,
      couponName: mc.coupon?.name,
      couponType: mc.coupon?.type,
      discount: mc.coupon?.discount,
      minAmount: mc.coupon?.minAmount,
      maxDiscount: mc.coupon?.maxDiscount,
      description: mc.coupon?.description,
      applicableServices: mc.coupon?.applicableServices,
      receiveTime: mc.receiveTime,
      expireTime: mc.expireTime,
      used: mc.used,
      useTime: mc.useTime,
    }));
  }

  // 领取优惠券
  async receiveCoupon(memberId: string, couponId: string): Promise<MemberCoupon> {
    const coupon = await this.couponRepository.findOne({ where: { id: couponId } });
    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }
    
    if (coupon.status !== CouponStatus.ACTIVE) {
      throw new BadRequestException('优惠券已下架');
    }
    
    const now = new Date();
    if (now < coupon.startTime || now > coupon.endTime) {
      throw new BadRequestException('优惠券不在领取时间内');
    }
    
    // 检查库存
    if (coupon.totalCount > 0 && coupon.usedCount >= coupon.totalCount) {
      throw new BadRequestException('优惠券已领完');
    }
    
    // 检查是否已领取
    const existing = await this.memberCouponRepository.findOne({
      where: { memberId, couponId },
    });
    if (existing) {
      throw new BadRequestException('您已领取过该优惠券');
    }
    
    // 检查领取限制
    const receivedCount = await this.memberCouponRepository.count({
      where: { memberId, couponId },
    });
    if (coupon.perLimit > 0 && receivedCount >= coupon.perLimit) {
      throw new BadRequestException(`每人最多领取${coupon.perLimit}张`);
    }
    
    // 创建会员优惠券
    const memberCoupon = this.memberCouponRepository.create({
      memberId,
      couponId,
      receiveTime: now,
      expireTime: coupon.endTime,
      used: false,
    });
    
    await this.memberCouponRepository.save(memberCoupon);
    
    // 更新优惠券已领数量
    coupon.usedCount += 1;
    await this.couponRepository.save(coupon);
    
    return memberCoupon;
  }

  // 获取可领取的优惠券列表
  async getAvailableCoupons(): Promise<any[]> {
    const now = new Date();
    
    const coupons = await this.couponRepository.find({
      where: {
        status: CouponStatus.ACTIVE,
        startTime: MoreThan(now),
      },
      order: { createdAt: 'DESC' },
    });
    
    return coupons.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      discount: c.discount,
      minAmount: c.minAmount,
      maxDiscount: c.maxDiscount,
      totalCount: c.totalCount,
      usedCount: c.usedCount,
      remainingCount: c.totalCount > 0 ? c.totalCount - c.usedCount : -1,
      perLimit: c.perLimit,
      startTime: c.startTime,
      endTime: c.endTime,
      description: c.description,
    }));
  }

  // ========== 积分接口 ==========

  // 获取我的积分
  async getPoints(memberId: string): Promise<any> {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) {
      throw new UnauthorizedException('会员不存在');
    }
    
    // 获取积分兑换记录
    const exchanges = await this.pointsExchangeRepository.find({
      where: { memberId },
      relations: ['goods'],
      order: { exchangeTime: 'DESC' },
      take: 10,
    });
    
    return {
      points: member.points,
      recentExchanges: exchanges.map(e => ({
        id: e.id,
        goodsName: e.goods?.name,
        pointsUsed: e.pointsUsed,
        quantity: e.quantity,
        status: e.status,
        exchangeTime: e.exchangeTime,
      })),
    };
  }

  // 获取积分商品列表
  async getPointsProducts(category?: string): Promise<any[]> {
    const where: any = { status: PointsMallStatus.ACTIVE };
    
    const goods = await this.pointsMallGoodsRepository.find({
      where,
      order: { sortOrder: 'DESC', createdAt: 'DESC' },
    });
    
    return goods.map(g => ({
      id: g.id,
      name: g.name,
      subtitle: g.subtitle,
      type: g.type,
      pointsRequired: g.pointsRequired,
      cashPrice: g.cashPrice,
      originalPrice: g.originalPrice,
      stockCount: g.stockCount,
      soldCount: g.soldCount,
      exchangeLimit: g.exchangeLimit,
      mainImage: g.mainImage,
      category: g.category,
    }));
  }

  // 积分兑换
  async pointsExchange(memberId: string, goodsId: string, quantity: number, deliveryInfo?: any): Promise<PointsExchange> {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) {
      throw new UnauthorizedException('会员不存在');
    }
    
    const goods = await this.pointsMallGoodsRepository.findOne({ where: { id: goodsId } });
    if (!goods) {
      throw new NotFoundException('商品不存在');
    }
    
    if (goods.status !== PointsMallStatus.ACTIVE) {
      throw new BadRequestException('商品已下架');
    }
    
    // 检查库存
    if (goods.stockCount < quantity) {
      throw new BadRequestException('库存不足');
    }
    
    // 检查积分
    const pointsNeeded = goods.pointsRequired * quantity;
    if (member.points < pointsNeeded) {
      throw new BadRequestException('积分不足');
    }
    
    // 检查兑换限制
    if (goods.exchangeLimit > 0) {
      const exchangedCount = await this.pointsExchangeRepository.count({
        where: { memberId, goodsId, status: In([ExchangeStatus.PENDING, ExchangeStatus.CONFIRMED, ExchangeStatus.SHIPPED, ExchangeStatus.COMPLETED]) },
      });
      if (exchangedCount + quantity > goods.exchangeLimit) {
        throw new BadRequestException(`每人最多兑换${goods.exchangeLimit}件`);
      }
    }
    
    // 创建兑换记录
    const exchange = this.pointsExchangeRepository.create({
      memberId,
      goodsId,
      pointsUsed: pointsNeeded,
      cashPaid: goods.cashPrice * quantity,
      quantity,
      status: ExchangeStatus.PENDING,
      exchangeTime: new Date(),
      deliveryInfo,
    });
    
    await this.pointsExchangeRepository.save(exchange);
    
    // 扣减积分
    member.points -= pointsNeeded;
    await this.memberRepository.save(member);
    
    // 扣减库存
    goods.stockCount -= quantity;
    goods.soldCount += quantity;
    await this.pointsMallGoodsRepository.save(goods);
    
    return exchange;
  }

  // ========== 订单接口 ==========

  // 获取我的订单
  async getOrders(memberId: string, page: number = 1, limit: number = 20): Promise<any> {
    const [consumptions, total] = await this.consumptionRepository.findAndCount({
      where: { memberId },
      relations: ['employee'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return {
      list: consumptions.map(c => ({
        id: c.id,
        orderNo: c.orderNo,
        consumptionType: c.consumptionType,
        amount: c.amount,
        actualAmount: c.actualAmount,
        discountAmount: c.discountAmount,
        paymentMethod: c.paymentMethod,
        items: c.items,
        employeeName: c.employee?.name,
        remark: c.remark,
        createdAt: c.createdAt,
      })),
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 获取订单详情
  async getOrderDetail(memberId: string, orderId: string): Promise<any> {
    const consumption = await this.consumptionRepository.findOne({
      where: { id: orderId, memberId },
      relations: ['employee', 'member'],
    });
    
    if (!consumption) {
      throw new NotFoundException('订单不存在');
    }
    
    return {
      id: consumption.id,
      orderNo: consumption.orderNo,
      manualOrderNo: consumption.manualOrderNo,
      consumptionType: consumption.consumptionType,
      amount: consumption.amount,
      actualAmount: consumption.actualAmount,
      discountAmount: consumption.discountAmount,
      paymentMethod: consumption.paymentMethod,
      paymentDetail: consumption.paymentDetail,
      items: consumption.items,
      employeeId: consumption.employeeId,
      employeeName: consumption.employee?.name,
      commission: consumption.commission,
      remark: consumption.remark,
      createdAt: consumption.createdAt,
    };
  }

  // ========== 服务接口 ==========

  // 获取服务列表
  async getServices(category?: string): Promise<any[]> {
    const where: any = { isActive: true };
    
    const services = await this.serviceRepository.find({
      where,
      order: { createdAt: 'ASC' },
    });
    
    return services.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      category: s.category,
      price: s.price,
      memberPrice: s.memberPrice,
      duration: s.duration,
      description: s.description,
    }));
  }

  // 获取员工列表
  async getEmployees(): Promise<any[]> {
    const employees = await this.employeeRepository.find({
      where: { status: EmployeeStatus.ACTIVE },
      order: { createdAt: 'ASC' },
    });
    
    return employees.map(e => ({
      id: e.id,
      name: e.name,
      employeeNo: e.employeeNo,
      phone: e.phone,
      position: e.position,
      avatar: e.avatar,
      hireDate: e.hireDate,
    }));
  }

  // ========== 可预约时段 ==========

  async getAvailableSlots(employeeId: string, date: string): Promise<any[]> {
    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(21, 0, 0, 0);
    
    const appointments = await this.appointmentRepository.find({
      where: {
        employeeId,
        appointmentDate: Between(dayStart, dayEnd),
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
    });
    
    // 生成时段（每30分钟一个时段）
    const slots = [];
    for (let hour = 9; hour < 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
        // 检查是否已被预约
        const isBooked = appointments.some(a => {
          const aTime = new Date(a.appointmentDate);
          aTime.setHours(parseInt(a.startTime.split(':')[0]), parseInt(a.startTime.split(':')[1]), 0, 0);
          return Math.abs(aTime.getTime() - slotTime.getTime()) < 30 * 60 * 1000;
        });
        
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          available: !isBooked && slotTime > new Date(),
        });
      }
    }
    
    return slots;
  }

  // ========== 商家信息 ==========

  async getShopInfo(): Promise<any> {
    // 返回商家基本信息（实际应该从配置表读取）
    return {
      name: '美业SaaS示范店',
      logo: '/images/logo.png',
      address: '示范路123号',
      phone: '400-123-4567',
      businessHours: '09:00-21:00',
      description: '专业美容美发服务',
      images: [
        '/images/shop1.jpg',
        '/images/shop2.jpg',
        '/images/shop3.jpg',
      ],
    };
  }

  // ========== 团队展示 ==========

  async getTeam(): Promise<any[]> {
    const employees = await this.employeeRepository.find({
      where: { status: EmployeeStatus.ACTIVE },
      order: { createdAt: 'ASC' },
    });
    
    return employees.map(e => ({
      id: e.id,
      name: e.name,
      position: e.position,
      avatar: e.avatar,
      intro: e.position, // 可以后续添加intro字段
    }));
  }

  // ========== 优惠活动 ==========

  async getPromotions(): Promise<any[]> {
    // 获取优惠券活动
    const coupons = await this.couponRepository.find({
      where: { status: CouponStatus.ACTIVE },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    
    // 获取限时特惠服务
    const services = await this.serviceRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    
    return [
      ...coupons.map(c => ({
        type: 'coupon',
        id: c.id,
        name: c.name,
        discount: c.discount,
        minAmount: c.minAmount,
        startTime: c.startTime,
        endTime: c.endTime,
      })),
      ...services.map(s => ({
        type: 'service',
        id: s.id,
        name: s.name,
        price: s.price,
        duration: s.duration,
        description: s.description,
      })),
    ];
  }

  // ========== 在线充值 ==========

  async recharge(memberId: string, amount: number, paymentMethod: string): Promise<Credit> {
    // 创建充值记录
    const credit = this.creditRepository.create({
      memberId,
      totalAmount: amount,
      paidAmount: 0,
      remainingAmount: amount,
      status: CreditStatus.PENDING,
      creditTime: new Date(),
      orderId: `RECHARGE_${Date.now()}`,
      orderNo: `R${Date.now()}`,
      createdBy: memberId,
    });
    
    await this.creditRepository.save(credit);
    
    // 模拟支付成功后更新余额
    // 实际项目中应该通过支付回调处理
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (member) {
      member.balance = Number(member.balance) + amount;
      await this.memberRepository.save(member);
      credit.status = CreditStatus.SETTLED;
      credit.settleTime = new Date();
      await this.creditRepository.save(credit);
    }
    
    return credit;
  }

  // ========== 在线办卡 ==========

  async purchaseCountCard(memberId: string, packageId: string, paymentMethod: string): Promise<MemberCountCard> {
    const pkg = await this.countCardPackageRepository.findOne({ where: { id: packageId } });
    if (!pkg) {
      throw new NotFoundException('次卡套餐不存在');
    }
    
    // 创建会员次卡
    const expireDate = new Date();
    expireDate.setMonth(expireDate.getMonth() + (pkg.validityMonths || 12));
    
    const memberCountCard = this.memberCountCardRepository.create({
      memberId,
      packageId,
      totalCount: pkg.count + (pkg.giftCount || 0),
      remainingCount: pkg.count + (pkg.giftCount || 0),
      purchasePrice: pkg.price,
      expireDate,
      status: MemberCountCardStatus.ACTIVE,
      orderNo: `CC${Date.now()}`,
      createdBy: memberId,
    });
    
    await this.memberCountCardRepository.save(memberCountCard);
    
    return memberCountCard;
  }
}
