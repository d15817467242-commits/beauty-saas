import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Consumption, ConsumptionType } from '../cashier/consumption.entity';
import { Employee, EmployeeStatus } from '../employee/entities/employee.entity';
import { Service } from '../service/service.entity';
import { Appointment, AppointmentStatus } from '../appointment/appointment.entity';
import { Member, MemberLevel } from '../member/member.entity';
import { 
  OverviewQueryDto, 
  RealtimeQueryDto, 
  TrendQueryDto, 
  RankingQueryDto, 
  MapQueryDto,
  TrendGroupBy,
  RankingType 
} from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Consumption)
    private consumptionRepository: Repository<Consumption>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
  ) {}

  // ========== 大屏概览 ==========
  
  async getOverview(query: OverviewQueryDto): Promise<any> {
    const targetDate = query.date ? new Date(query.date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(23, 59, 59, 999);

    // 本月时间范围
    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

    // 本年时间范围
    const yearStart = new Date(targetDate.getFullYear(), 0, 1);
    const yearEnd = new Date(targetDate.getFullYear(), 11, 31, 23, 59, 59, 999);

    // 今日数据
    const todayConsumptions = await this.consumptionRepository.find({
      where: { createdAt: Between(targetDate, targetDateEnd) },
    });
    const todayRevenue = todayConsumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);
    const todayCustomerCount = todayConsumptions.length;

    // 本月数据
    const monthConsumptions = await this.consumptionRepository.find({
      where: { createdAt: Between(monthStart, monthEnd) },
    });
    const monthRevenue = monthConsumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);
    const monthCustomerCount = monthConsumptions.length;

    // 本年数据
    const yearConsumptions = await this.consumptionRepository.find({
      where: { createdAt: Between(yearStart, yearEnd) },
    });
    const yearRevenue = yearConsumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);
    const yearCustomerCount = yearConsumptions.length;

    // 会员统计
    const totalMembers = await this.memberRepository.count();
    const newMembersToday = await this.memberRepository.count({
      where: { createdAt: Between(targetDate, targetDateEnd) },
    });
    const newMembersThisMonth = await this.memberRepository.count({
      where: { createdAt: Between(monthStart, monthEnd) },
    });

    // 活跃会员（本月有消费）
    const activeMemberIds = new Set(
      monthConsumptions.filter(c => c.memberId).map(c => c.memberId)
    );

    // 员工统计
    const totalEmployees = await this.employeeRepository.count({
      where: { status: EmployeeStatus.ACTIVE },
    });

    // 今日预约统计
    const todayAppointments = await this.appointmentRepository.find({
      where: { appointmentDate: targetDate },
    });
    const pendingAppointments = todayAppointments.filter(a => 
      a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.CONFIRMED
    ).length;

    // 计算同比环比
    // 上月同期
    const lastMonthStart = new Date(monthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthEnd = new Date(monthEnd);
    lastMonthEnd.setMonth(lastMonthEnd.getMonth() - 1);
    const lastMonthConsumptions = await this.consumptionRepository.find({
      where: { createdAt: Between(lastMonthStart, lastMonthEnd) },
    });
    const lastMonthRevenue = lastMonthConsumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);

    // 去年同期
    const lastYearStart = new Date(yearStart);
    lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
    const lastYearEnd = new Date(yearEnd);
    lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);
    const lastYearConsumptions = await this.consumptionRepository.find({
      where: { createdAt: Between(lastYearStart, lastYearEnd) },
    });
    const lastYearRevenue = lastYearConsumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);

    // 计算增长率
    const monthGrowthRate = lastMonthRevenue > 0 
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(2)
      : 0;
    const yearGrowthRate = lastYearRevenue > 0 
      ? ((yearRevenue - lastYearRevenue) / lastYearRevenue * 100).toFixed(2)
      : 0;

    // 平均客单价
    const avgTicketToday = todayCustomerCount > 0 ? (todayRevenue / todayCustomerCount).toFixed(2) : 0;
    const avgTicketMonth = monthCustomerCount > 0 ? (monthRevenue / monthCustomerCount).toFixed(2) : 0;

    // 会员消费占比
    const todayMemberRevenue = todayConsumptions
      .filter(c => c.memberId)
      .reduce((sum, c) => sum + Number(c.actualAmount), 0);
    const monthMemberRevenue = monthConsumptions
      .filter(c => c.memberId)
      .reduce((sum, c) => sum + Number(c.actualAmount), 0);

    const todayMemberRate = todayRevenue > 0 ? (todayMemberRevenue / todayRevenue * 100).toFixed(2) : 0;
    const monthMemberRate = monthRevenue > 0 ? (monthMemberRevenue / monthRevenue * 100).toFixed(2) : 0;

    return {
      date: targetDate.toISOString().split('T')[0],
      today: {
        revenue: Number(todayRevenue.toFixed(2)),
        customerCount: todayCustomerCount,
        avgTicket: Number(avgTicketToday),
        memberRevenue: Number(todayMemberRevenue.toFixed(2)),
        memberRate: Number(todayMemberRate),
        newMembers: newMembersToday,
        pendingAppointments,
      },
      month: {
        revenue: Number(monthRevenue.toFixed(2)),
        customerCount: monthCustomerCount,
        avgTicket: Number(avgTicketMonth),
        memberRevenue: Number(monthMemberRevenue.toFixed(2)),
        memberRate: Number(monthMemberRate),
        growthRate: Number(monthGrowthRate),
        newMembers: newMembersThisMonth,
      },
      year: {
        revenue: Number(yearRevenue.toFixed(2)),
        customerCount: yearCustomerCount,
        growthRate: Number(yearGrowthRate),
      },
      member: {
        total: totalMembers,
        active: activeMemberIds.size,
        activeRate: totalMembers > 0 ? Number(((activeMemberIds.size / totalMembers) * 100).toFixed(2)) : 0,
      },
      employee: {
        total: totalEmployees,
      },
    };
  }

  // ========== 实时数据 ==========

  async getRealtime(query: RealtimeQueryDto): Promise<any> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // 当前小时范围
    const currentHourStart = new Date(now);
    currentHourStart.setMinutes(0, 0, 0);
    const currentHourEnd = new Date(currentHourStart);
    currentHourEnd.setHours(currentHourEnd.getHours() + 1);

    // 今日消费
    const todayConsumptions = await this.consumptionRepository.find({
      where: { createdAt: Between(todayStart, todayEnd) },
      relations: ['member', 'employee'],
    });

    // 当前小时消费
    const currentHourConsumptions = await this.consumptionRepository.find({
      where: { createdAt: Between(currentHourStart, currentHourEnd) },
    });

    // 今日预约
    const todayAppointments = await this.appointmentRepository.find({
      where: { appointmentDate: todayStart },
      relations: ['member', 'employee', 'service'],
    });

    // 当前在店人数（正在服务的预约 + 近期消费但未离开的）
    const inServiceAppointments = todayAppointments.filter(a => 
      a.status === AppointmentStatus.CONFIRMED
    );
    const currentInStore = inServiceAppointments.length;

    // 排队情况
    const pendingAppointments = todayAppointments
      .filter(a => a.status === AppointmentStatus.PENDING)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // 实时营业额
    const realtimeRevenue = todayConsumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);
    const currentHourRevenue = currentHourConsumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);

    // 最近订单（最近10条）
    const recentOrders = todayConsumptions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        orderNo: c.orderNo,
        amount: Number(c.actualAmount),
        memberName: c.member?.name || '散客',
        employeeName: c.employee?.name,
        paymentMethod: c.paymentMethod,
        createdAt: c.createdAt,
      }));

    // 员工工作状态
    const employees = await this.employeeRepository.find({
      where: { status: EmployeeStatus.ACTIVE },
    });
    
    const employeeStatus = employees.map(emp => {
      const empAppointments = todayAppointments.filter(a => a.employeeId === emp.id);
      const inService = empAppointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length;
      const completed = empAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
      const pending = empAppointments.filter(a => a.status === AppointmentStatus.PENDING).length;
      
      return {
        id: emp.id,
        name: emp.name,
        avatar: emp.avatar,
        position: emp.position,
        inService,
        completed,
        pending,
        status: inService > 0 ? 'busy' : 'idle',
      };
    });

    // 高峰时段预测（基于历史数据）
    const hourStats: Record<number, number> = {};
    for (const c of todayConsumptions) {
      const hour = new Date(c.createdAt).getHours();
      hourStats[hour] = (hourStats[hour] || 0) + 1;
    }
    
    const peakHours = Object.entries(hourStats)
      .map(([hour, count]) => ({ hour: Number(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      timestamp: now.toISOString(),
      currentInStore,
      queueLength: pendingAppointments.length,
      queueList: pendingAppointments.slice(0, 5).map(a => ({
        id: a.id,
        memberName: a.member?.name || a.guestName || '散客',
        serviceName: a.service?.name,
        employeeName: a.employee?.name,
        time: a.startTime,
      })),
      revenue: {
        today: Number(realtimeRevenue.toFixed(2)),
        currentHour: Number(currentHourRevenue.toFixed(2)),
      },
      customerCount: todayConsumptions.length,
      recentOrders,
      employeeStatus,
      peakHours,
      appointments: {
        total: todayAppointments.length,
        pending: pendingAppointments.length,
        confirmed: inServiceAppointments.length,
        completed: todayAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length,
        cancelled: todayAppointments.filter(a => a.status === AppointmentStatus.CANCELLED).length,
      },
    };
  }

  // ========== 趋势数据 ==========

  async getTrend(query: TrendQueryDto): Promise<any> {
    const now = new Date();
    const groupBy = query.groupBy || TrendGroupBy.DAY;
    
    let start: Date;
    let end: Date;
    
    if (query.startDate && query.endDate) {
      start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // 默认最近30天
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      start = new Date(now);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    }

    // 获取消费记录
    const consumptions = await this.consumptionRepository.find({
      where: { createdAt: Between(start, end) },
    });

    // 获取会员数据
    const members = await this.memberRepository.find({
      where: { createdAt: Between(start, end) },
    });

    // 按时间段分组
    const groupedData: Record<string, {
      date: string;
      revenue: number;
      customerCount: number;
      memberCount: number;
      newMemberCount: number;
      avgTicket: number;
    }> = {};

    // 初始化时间段
    const current = new Date(start);
    while (current <= end) {
      let key: string;
      
      if (groupBy === TrendGroupBy.MONTH) {
        key = current.toISOString().slice(0, 7);
        current.setMonth(current.getMonth() + 1);
      } else if (groupBy === TrendGroupBy.WEEK) {
        const weekStart = new Date(current);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        key = weekStart.toISOString().split('T')[0];
        current.setDate(current.getDate() + 7);
      } else if (groupBy === TrendGroupBy.HOUR) {
        key = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}-${current.getDate().toString().padStart(2, '0')} ${current.getHours().toString().padStart(2, '0')}:00`;
        current.setHours(current.getHours() + 1);
      } else {
        key = current.toISOString().split('T')[0];
        current.setDate(current.getDate() + 1);
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          revenue: 0,
          customerCount: 0,
          memberCount: 0,
          newMemberCount: 0,
          avgTicket: 0,
        };
      }
    }

    // 统计消费数据
    for (const c of consumptions) {
      const cDate = new Date(c.createdAt);
      let dateKey: string;
      
      if (groupBy === TrendGroupBy.MONTH) {
        dateKey = cDate.toISOString().slice(0, 7);
      } else if (groupBy === TrendGroupBy.WEEK) {
        const weekStart = new Date(cDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        dateKey = weekStart.toISOString().split('T')[0];
      } else if (groupBy === TrendGroupBy.HOUR) {
        dateKey = `${cDate.getFullYear()}-${(cDate.getMonth() + 1).toString().padStart(2, '0')}-${cDate.getDate().toString().padStart(2, '0')} ${cDate.getHours().toString().padStart(2, '0')}:00`;
      } else {
        dateKey = cDate.toISOString().split('T')[0];
      }

      if (groupedData[dateKey]) {
        groupedData[dateKey].revenue += Number(c.actualAmount);
        groupedData[dateKey].customerCount++;
        if (c.memberId) {
          groupedData[dateKey].memberCount++;
        }
      }
    }

    // 统计新会员
    for (const m of members) {
      const mDate = new Date(m.createdAt);
      let dateKey: string;
      
      if (groupBy === TrendGroupBy.MONTH) {
        dateKey = mDate.toISOString().slice(0, 7);
      } else if (groupBy === TrendGroupBy.WEEK) {
        const weekStart = new Date(mDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        dateKey = weekStart.toISOString().split('T')[0];
      } else if (groupBy === TrendGroupBy.HOUR) {
        dateKey = `${mDate.getFullYear()}-${(mDate.getMonth() + 1).toString().padStart(2, '0')}-${mDate.getDate().toString().padStart(2, '0')} ${mDate.getHours().toString().padStart(2, '0')}:00`;
      } else {
        dateKey = mDate.toISOString().split('T')[0];
      }

      if (groupedData[dateKey]) {
        groupedData[dateKey].newMemberCount++;
      }
    }

    // 计算平均客单价
    for (const key of Object.keys(groupedData)) {
      const data = groupedData[key];
      data.avgTicket = data.customerCount > 0 
        ? Number((data.revenue / data.customerCount).toFixed(2))
        : 0;
      data.revenue = Number(data.revenue.toFixed(2));
    }

    // 转换为数组并排序
    const trend = Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date));

    // 计算汇总统计
    const summary = {
      totalRevenue: trend.reduce((sum, d) => sum + d.revenue, 0),
      totalCustomers: trend.reduce((sum, d) => sum + d.customerCount, 0),
      totalMembers: trend.reduce((sum, d) => sum + d.memberCount, 0),
      totalNewMembers: trend.reduce((sum, d) => sum + d.newMemberCount, 0),
      avgRevenue: trend.length > 0 
        ? Number((trend.reduce((sum, d) => sum + d.revenue, 0) / trend.length).toFixed(2))
        : 0,
      avgCustomers: trend.length > 0 
        ? Number((trend.reduce((sum, d) => sum + d.customerCount, 0) / trend.length).toFixed(1))
        : 0,
    };

    // 计算同比环比
    const halfLength = Math.floor(trend.length / 2);
    const firstHalf = trend.slice(0, halfLength);
    const secondHalf = trend.slice(halfLength);

    const firstHalfRevenue = firstHalf.reduce((sum, d) => sum + d.revenue, 0);
    const secondHalfRevenue = secondHalf.reduce((sum, d) => sum + d.revenue, 0);
    const revenueGrowth = firstHalfRevenue > 0 
      ? Number(((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue * 100).toFixed(2))
      : 0;

    return {
      summary,
      trend,
      groupBy,
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
      growth: {
        revenue: revenueGrowth,
      },
    };
  }

  // ========== 排行榜 ==========

  async getRanking(query: RankingQueryDto): Promise<any> {
    const now = new Date();
    const type = query.type || RankingType.SERVICE;
    const limit = query.limit || 10;

    let start: Date;
    let end: Date;
    
    if (query.startDate && query.endDate) {
      start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // 默认本月
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // 获取消费记录
    const consumptions = await this.consumptionRepository.find({
      where: { createdAt: Between(start, end) },
      relations: ['employee'],
    });

    if (type === RankingType.SERVICE) {
      return this.getServiceRanking(consumptions, limit);
    } else if (type === RankingType.EMPLOYEE) {
      return this.getEmployeeRanking(consumptions, limit);
    } else {
      return this.getProductRanking(consumptions, limit);
    }
  }

  private async getServiceRanking(consumptions: Consumption[], limit: number): Promise<any> {
    const serviceStats: Record<string, {
      serviceId: string;
      serviceName: string;
      salesCount: number;
      revenue: number;
    }> = {};

    for (const c of consumptions) {
      const items = c.items || [];
      for (const item of items as any[]) {
        if (!serviceStats[item.serviceId]) {
          serviceStats[item.serviceId] = {
            serviceId: item.serviceId,
            serviceName: item.serviceName,
            salesCount: 0,
            revenue: 0,
          };
        }
        const quantity = item.quantity || 1;
        const amount = item.amount || (item.price * quantity);
        serviceStats[item.serviceId].salesCount += quantity;
        serviceStats[item.serviceId].revenue += amount;
      }
    }

    const ranking = Object.values(serviceStats)
      .map(s => ({
        ...s,
        revenue: Number(s.revenue.toFixed(2)),
        avgPrice: s.salesCount > 0 ? Number((s.revenue / s.salesCount).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    // 添加排名
    const result = ranking.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    return {
      type: 'service',
      ranking: result,
      summary: {
        total: result.length,
        totalRevenue: result.reduce((sum, r) => sum + r.revenue, 0),
        totalSales: result.reduce((sum, r) => sum + r.salesCount, 0),
      },
    };
  }

  private async getEmployeeRanking(consumptions: Consumption[], limit: number): Promise<any> {
    const employees = await this.employeeRepository.find({
      where: { status: EmployeeStatus.ACTIVE },
    });

    const employeeStats: Record<string, {
      employeeId: string;
      employeeName: string;
      avatar?: string;
      position?: string;
      serviceCount: number;
      revenue: number;
      commission: number;
    }> = {};

    // 初始化员工数据
    for (const emp of employees) {
      employeeStats[emp.id] = {
        employeeId: emp.id,
        employeeName: emp.name,
        avatar: emp.avatar,
        position: emp.position,
        serviceCount: 0,
        revenue: 0,
        commission: 0,
      };
    }

    // 统计消费数据
    for (const c of consumptions) {
      const items = c.items || [];
      for (const item of items as any[]) {
        if (item.employeeId && employeeStats[item.employeeId]) {
          const quantity = item.quantity || 1;
          const amount = item.amount || (item.price * quantity);
          employeeStats[item.employeeId].serviceCount += quantity;
          employeeStats[item.employeeId].revenue += amount;
        }
      }
      
      // 统计提成
      if (c.employeeId && employeeStats[c.employeeId]) {
        employeeStats[c.employeeId].commission += Number(c.commission || 0);
      }
    }

    const ranking = Object.values(employeeStats)
      .filter(e => e.serviceCount > 0)
      .map(e => ({
        ...e,
        revenue: Number(e.revenue.toFixed(2)),
        commission: Number(e.commission.toFixed(2)),
        avgTicket: e.serviceCount > 0 ? Number((e.revenue / e.serviceCount).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    // 添加排名
    const result = ranking.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    return {
      type: 'employee',
      ranking: result,
      summary: {
        total: result.length,
        totalRevenue: result.reduce((sum, r) => sum + r.revenue, 0),
        totalServices: result.reduce((sum, r) => sum + r.serviceCount, 0),
        totalCommission: result.reduce((sum, r) => sum + r.commission, 0),
      },
    };
  }

  private async getProductRanking(consumptions: Consumption[], limit: number): Promise<any> {
    // 产品销售排行（从消费类型为product的记录中统计）
    const productStats: Record<string, {
      productId: string;
      productName: string;
      salesCount: number;
      revenue: number;
    }> = {};

    for (const c of consumptions) {
      if (c.consumptionType === ConsumptionType.PRODUCT) {
        const items = c.items || [];
        for (const item of items as any[]) {
          if (!productStats[item.serviceId]) {
            productStats[item.serviceId] = {
              productId: item.serviceId,
              productName: item.serviceName,
              salesCount: 0,
              revenue: 0,
            };
          }
          const quantity = item.quantity || 1;
          const amount = item.amount || (item.price * quantity);
          productStats[item.serviceId].salesCount += quantity;
          productStats[item.serviceId].revenue += amount;
        }
      }
    }

    const ranking = Object.values(productStats)
      .map(p => ({
        ...p,
        revenue: Number(p.revenue.toFixed(2)),
        avgPrice: p.salesCount > 0 ? Number((p.revenue / p.salesCount).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    // 添加排名
    const result = ranking.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    return {
      type: 'product',
      ranking: result,
      summary: {
        total: result.length,
        totalRevenue: result.reduce((sum, r) => sum + r.revenue, 0),
        totalSales: result.reduce((sum, r) => sum + r.salesCount, 0),
      },
    };
  }

  // ========== 地图数据 ==========

  async getMap(query: MapQueryDto): Promise<any> {
    const now = new Date();
    const level = query.level || 1; // 默认省份级别

    let start: Date;
    let end: Date;
    
    if (query.startDate && query.endDate) {
      start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // 默认本年
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    // 获取会员数据
    const members = await this.memberRepository.find();

    // 按地区统计会员分布
    const regionStats: Record<string, {
      regionCode: string;
      regionName: string;
      memberCount: number;
      totalSpent: number;
      level: number;
    }> = {};

    for (const member of members) {
      // 从会员信息中提取地区信息（假设会员有address字段或从phone推断）
      // 这里使用模拟数据，实际应该从会员地址字段获取
      let regionCode = 'unknown';
      let regionName = '未知';
      
      // 简单的手机号归属地推断（前3-4位）
      if (member.phone) {
        const prefix = member.phone.substring(0, 3);
        // 这里可以接入手机号归属地查询API
        // 暂时使用模拟数据
        const provinceMap: Record<string, string> = {
          '130': '北京', '131': '北京', '132': '北京', '133': '北京',
          '134': '北京', '135': '北京', '136': '北京', '137': '北京',
          '138': '北京', '139': '北京',
          '150': '广东', '151': '广东', '152': '广东', '153': '广东',
          '155': '广东', '156': '广东', '157': '广东', '158': '广东',
          '159': '广东',
          '180': '上海', '181': '上海', '182': '上海', '183': '上海',
          '185': '上海', '186': '上海', '187': '上海', '188': '上海',
          '189': '上海',
        };
        
        if (provinceMap[prefix]) {
          regionCode = prefix;
          regionName = provinceMap[prefix];
        }
      }

      if (!regionStats[regionCode]) {
        regionStats[regionCode] = {
          regionCode,
          regionName,
          memberCount: 0,
          totalSpent: 0,
          level,
        };
      }

      regionStats[regionCode].memberCount++;
      regionStats[regionCode].totalSpent += Number(member.totalSpent || 0);
    }

    // 转换为数组
    const mapData = Object.values(regionStats)
      .filter(r => r.regionCode !== 'unknown')
      .map(r => ({
        ...r,
        totalSpent: Number(r.totalSpent.toFixed(2)),
      }))
      .sort((a, b) => b.memberCount - a.memberCount);

    // 计算热力图数据
    const maxCount = Math.max(...mapData.map(d => d.memberCount), 1);
    const heatmapData = mapData.map(d => ({
      regionCode: d.regionCode,
      regionName: d.regionName,
      value: d.memberCount,
      intensity: Number((d.memberCount / maxCount).toFixed(2)),
    }));

    // 汇总统计
    const summary = {
      totalMembers: members.length,
      totalRegions: mapData.length,
      topRegion: mapData[0] || null,
      avgMembersPerRegion: mapData.length > 0 
        ? Number((members.length / mapData.length).toFixed(1))
        : 0,
    };

    return {
      level,
      mapData,
      heatmapData,
      summary,
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
    };
  }
}
