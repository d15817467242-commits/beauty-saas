import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In, SelectQueryBuilder } from 'typeorm';
import { Consumption, ConsumptionType } from '../cashier/consumption.entity';
import { Employee, EmployeeStatus } from '../employee/entities/employee.entity';
import { Service } from '../service/service.entity';
import { Appointment } from '../appointment/appointment.entity';
import { Member } from '../member/member.entity';
import { SalesTarget, TargetPeriod } from './entities/sales-target.entity';
import { Target } from './entities/target.entity';
import { DailyReport } from './entities/daily-report.entity';
import { MonthlyReport } from './entities/monthly-report.entity';
import { EmployeePerformance } from './entities/employee-performance.entity';
import { CustomerAnalysis } from './entities/customer-analysis.entity';

@Injectable()
export class ReportService {
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
    @InjectRepository(SalesTarget)
    private salesTargetRepository: Repository<SalesTarget>,
    @InjectRepository(Target)
    private targetRepository: Repository<Target>,
    @InjectRepository(DailyReport)
    private dailyReportRepository: Repository<DailyReport>,
    @InjectRepository(MonthlyReport)
    private monthlyReportRepository: Repository<MonthlyReport>,
    @InjectRepository(EmployeePerformance)
    private employeePerformanceRepository: Repository<EmployeePerformance>,
    @InjectRepository(CustomerAnalysis)
    private customerAnalysisRepository: Repository<CustomerAnalysis>,
  ) {}

  // ========== 工具方法 ==========

  private getDateRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : now;
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private getDateKey(date: Date, groupBy: 'day' | 'week' | 'month' | 'hour'): string {
    if (groupBy === 'month') {
      return date.toISOString().slice(0, 7);
    } else if (groupBy === 'week') {
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay());
      return d.toISOString().split('T')[0];
    } else if (groupBy === 'hour') {
      return `${date.getHours().toString().padStart(2, '0')}:00`;
    }
    return date.toISOString().split('T')[0];
  }

  // ========== 1. 目标概览 ==========
  async getTargetOverview(query: { type?: string; month?: string; storeId?: string }) {
    const now = new Date();
    const currentMonth = query.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const qb = this.targetRepository.createQueryBuilder('target')
      .where('target.month = :month', { month: currentMonth });

    if (query.type) {
      qb.andWhere('target.type = :type', { type: query.type });
    }
    if (query.storeId) {
      qb.andWhere('target.storeId = :storeId', { storeId: query.storeId });
    }

    const targets = await qb.getMany();

    // 计算完成情况
    const results = targets.map(t => ({
      ...t,
      completionRate: t.targetAmount > 0 ? Math.min(100, Number(t.actualAmount) / Number(t.targetAmount) * 100) : 0,
      gap: Number(t.targetAmount) - Number(t.actualAmount),
      status: t.targetAmount > 0 && Number(t.actualAmount) >= Number(t.targetAmount) ? 'completed' : 'in_progress'
    }));

    return {
      month: currentMonth,
      summary: {
        totalTargets: results.length,
        completedCount: results.filter(r => r.status === 'completed').length,
        totalTargetAmount: results.reduce((sum, r) => sum + Number(r.targetAmount), 0),
        totalActualAmount: results.reduce((sum, r) => sum + Number(r.actualAmount), 0),
        avgCompletionRate: results.length > 0 ? results.reduce((sum, r) => sum + r.completionRate, 0) / results.length : 0
      },
      targets: results
    };
  }

  // ========== 2. 营收汇总 ==========
  async getSummary(query: { startDate?: string; endDate?: string; storeId?: string; groupBy?: 'day' | 'week' | 'month' }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const groupBy = query.groupBy || 'day';

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end });

    if (query.storeId) {
      qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });
    }

    const consumptions = await qb.getMany();

    // 按时间分组
    const grouped: Record<string, { revenue: number; count: number; recharge: number; consumption: number }> = {};

    for (const c of consumptions) {
      const key = this.getDateKey(new Date(c.createdAt), groupBy);
      if (!grouped[key]) {
        grouped[key] = { revenue: 0, count: 0, recharge: 0, consumption: 0 };
      }
      grouped[key].revenue += Number(c.actualAmount);
      grouped[key].count++;
      if (c.consumptionType === 'recharge') {
        grouped[key].recharge += Number(c.actualAmount);
      } else {
        grouped[key].consumption += Number(c.actualAmount);
      }
    }

    const trend = Object.entries(grouped).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary: {
        totalRevenue: consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0),
        totalCount: consumptions.length,
        totalRecharge: consumptions.filter(c => c.consumptionType === 'recharge').reduce((sum, c) => sum + Number(c.actualAmount), 0),
        totalConsumption: consumptions.filter(c => c.consumptionType !== 'recharge').reduce((sum, c) => sum + Number(c.actualAmount), 0),
        avgRevenue: trend.length > 0 ? consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0) / trend.length : 0
      },
      trend,
      groupBy
    };
  }

  // ========== 3. 经营总览 ==========
  async getOverview(query: { date?: string; storeId?: string }) {
    const targetDate = query.date ? new Date(query.date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

    // 今日数据
    const todayQb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start: targetDate, end: targetDateEnd });
    if (query.storeId) todayQb.andWhere('c.storeId = :storeId', { storeId: query.storeId });
    const todayConsumptions = await todayQb.getMany();

    // 本月数据
    const monthQb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start: monthStart, end: monthEnd });
    if (query.storeId) monthQb.andWhere('c.storeId = :storeId', { storeId: query.storeId });
    const monthConsumptions = await monthQb.getMany();

    const todayRevenue = todayConsumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);
    const monthRevenue = monthConsumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);

    // 会员统计
    const memberQb = this.memberRepository.createQueryBuilder('m');
    if (query.storeId) memberQb.where('m.storeId = :storeId', { storeId: query.storeId });
    const totalMembers = await memberQb.getCount();

    const newMembersQb = this.memberRepository.createQueryBuilder('m')
      .where('m.createdAt BETWEEN :start AND :end', { start: monthStart, end: monthEnd });
    if (query.storeId) newMembersQb.andWhere('m.storeId = :storeId', { storeId: query.storeId });
    const newMembers = await newMembersQb.getCount();

    // 员工统计
    const employeeQb = this.employeeRepository.createQueryBuilder('e')
      .where('e.status = :status', { status: EmployeeStatus.ACTIVE });
    if (query.storeId) employeeQb.andWhere('e.storeId = :storeId', { storeId: query.storeId });
    const totalEmployees = await employeeQb.getCount();

    return {
      date: targetDate.toISOString().split('T')[0],
      today: {
        revenue: todayRevenue,
        count: todayConsumptions.length,
        avgTicket: todayConsumptions.length > 0 ? todayRevenue / todayConsumptions.length : 0
      },
      month: {
        revenue: monthRevenue,
        count: monthConsumptions.length,
        avgTicket: monthConsumptions.length > 0 ? monthRevenue / monthConsumptions.length : 0
      },
      member: {
        total: totalMembers,
        newThisMonth: newMembers
      },
      employee: {
        total: totalEmployees
      }
    };
  }

  // ========== 4. 劳动业绩 ==========
  async getLabor(query: { startDate?: string; endDate?: string; storeId?: string; employeeId?: string; groupBy?: 'day' | 'week' | 'month' }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const groupBy = query.groupBy || 'day';

    let employees = await this.employeeRepository.find({
      where: { status: EmployeeStatus.ACTIVE }
    });
    if (query.employeeId) {
      employees = employees.filter(e => e.id === query.employeeId);
    }

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });

    const consumptions = await qb.getMany();

    const results = employees.map(emp => {
      const empConsumptions = consumptions.filter(c => c.employeeId === emp.id);
      const totalSales = empConsumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);
      const totalCommission = empConsumptions.reduce((sum, c) => sum + Number(c.commission || 0), 0);

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        position: emp.position,
        serviceCount: empConsumptions.length,
        totalSales,
        totalCommission,
        avgTicket: empConsumptions.length > 0 ? totalSales / empConsumptions.length : 0
      };
    }).sort((a, b) => b.totalSales - a.totalSales);

    return {
      summary: {
        totalEmployees: results.length,
        totalSales: results.reduce((sum, r) => sum + r.totalSales, 0),
        totalCommission: results.reduce((sum, r) => sum + r.totalCommission, 0)
      },
      employees: results
    };
  }

  // ========== 5. 资产报表 ==========
  async getAsset(query: { startDate?: string; endDate?: string; storeId?: string; assetType?: string }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);

    // 会员卡余额统计
    const members = await this.memberRepository.find();
    const totalBalance = members.reduce((sum, m) => sum + Number(m.balance || 0), 0);
    const totalPoints = members.reduce((sum, m) => sum + Number(m.points || 0), 0);

    // 充值统计
    const rechargeQb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('c.consumptionType = :type', { type: 'recharge' });
    if (query.storeId) rechargeQb.andWhere('c.storeId = :storeId', { storeId: query.storeId });
    const recharges = await rechargeQb.getMany();
    const totalRecharge = recharges.reduce((sum, c) => sum + Number(c.actualAmount), 0);

    // 消费统计
    const consumptionQb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('c.consumptionType != :type', { type: 'recharge' });
    if (query.storeId) consumptionQb.andWhere('c.storeId = :storeId', { storeId: query.storeId });
    const consumptions = await consumptionQb.getMany();
    const totalConsumption = consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);

    return {
      balance: {
        total: totalBalance,
        memberCount: members.length,
        avgBalance: members.length > 0 ? totalBalance / members.length : 0
      },
      points: {
        total: totalPoints,
        memberCount: members.length,
        avgPoints: members.length > 0 ? totalPoints / members.length : 0
      },
      recharge: {
        total: totalRecharge,
        count: recharges.length
      },
      consumption: {
        total: totalConsumption,
        count: consumptions.length
      }
    };
  }

  // ========== 6. 优惠统计 ==========
  async getDiscount(query: { startDate?: string; endDate?: string; storeId?: string; discountType?: string }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });

    const consumptions = await qb.getMany();

    // 统计优惠金额
    const totalOriginal = consumptions.reduce((sum, c) => sum + Number(c.totalAmount || c.actualAmount), 0);
    const totalActual = consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);
    const totalDiscount = totalOriginal - totalActual;

    // 按优惠类型分组
    const byType: Record<string, { count: number; amount: number }> = {};
    for (const c of consumptions) {
      const discountType = c.discountType || 'none';
      if (!byType[discountType]) {
        byType[discountType] = { count: 0, amount: 0 };
      }
      byType[discountType].count++;
      byType[discountType].amount += Number(c.totalAmount || c.actualAmount) - Number(c.actualAmount);
    }

    return {
      summary: {
        totalOriginal,
        totalActual,
        totalDiscount,
        discountRate: totalOriginal > 0 ? (totalDiscount / totalOriginal * 100) : 0
      },
      byType
    };
  }

  // ========== 7. 客情分析 ==========
  async getCustomer(query: { startDate?: string; endDate?: string; storeId?: string; customerType?: string; limit?: number }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const limit = query.limit || 20;

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('c.memberId IS NOT NULL')
      .leftJoinAndSelect('c.member', 'member');
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });

    const consumptions = await qb.getMany();

    // 按会员分组统计
    const memberStats: Record<string, {
      memberId: string;
      memberName: string;
      phone: string;
      level: string;
      visitCount: number;
      totalAmount: number;
      avgTicket: number;
      lastVisit: Date;
    }> = {};

    for (const c of consumptions) {
      if (!c.memberId) continue;
      if (!memberStats[c.memberId]) {
        memberStats[c.memberId] = {
          memberId: c.memberId,
          memberName: c.member?.name || '未知',
          phone: c.member?.phone || '',
          level: c.member?.level || 'normal',
          visitCount: 0,
          totalAmount: 0,
          avgTicket: 0,
          lastVisit: new Date(0)
        };
      }
      memberStats[c.memberId].visitCount++;
      memberStats[c.memberId].totalAmount += Number(c.actualAmount);
      if (new Date(c.createdAt) > memberStats[c.memberId].lastVisit) {
        memberStats[c.memberId].lastVisit = new Date(c.createdAt);
      }
    }

    // 计算平均客单价
    const results = Object.values(memberStats).map(m => ({
      ...m,
      avgTicket: m.visitCount > 0 ? m.totalAmount / m.visitCount : 0,
      lastVisit: m.lastVisit.toISOString().split('T')[0]
    })).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, limit);

    return {
      summary: {
        totalMembers: Object.keys(memberStats).length,
        totalVisits: results.reduce((sum, r) => sum + r.visitCount, 0),
        totalAmount: results.reduce((sum, r) => sum + r.totalAmount, 0)
      },
      customers: results
    };
  }

  // ========== 8. 营收趋势 ==========
  async getTrend(query: { startDate?: string; endDate?: string; storeId?: string; groupBy?: 'day' | 'week' | 'month'; days?: number }) {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (query.days) {
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      start = new Date(now);
      start.setDate(start.getDate() - query.days + 1);
      start.setHours(0, 0, 0, 0);
    } else {
      const range = this.getDateRange(query.startDate, query.endDate);
      start = range.start;
      end = range.end;
    }

    const groupBy = query.groupBy || 'day';

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });

    const consumptions = await qb.getMany();

    // 按时间分组
    const grouped: Record<string, { amount: number; count: number }> = {};

    for (const c of consumptions) {
      const key = this.getDateKey(new Date(c.createdAt), groupBy);
      if (!grouped[key]) {
        grouped[key] = { amount: 0, count: 0 };
      }
      grouped[key].amount += Number(c.actualAmount);
      grouped[key].count++;
    }

    const trend = Object.entries(grouped).map(([date, data]) => ({
      date,
      amount: data.amount,
      count: data.count
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary: {
        totalAmount: trend.reduce((sum, t) => sum + t.amount, 0),
        totalCount: trend.reduce((sum, t) => sum + t.count, 0),
        avgAmount: trend.length > 0 ? trend.reduce((sum, t) => sum + t.amount, 0) / trend.length : 0
      },
      trend
    };
  }

  // ========== 9. 营收利润 ==========
  async getProfit(query: { startDate?: string; endDate?: string; storeId?: string; includeCost?: boolean }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });

    const consumptions = await qb.getMany();

    const totalRevenue = consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);
    const totalCost = consumptions.reduce((sum, c) => sum + Number(c.costAmount || 0), 0);
    const totalProfit = totalRevenue - totalCost;

    // 按类型分组
    const byType: Record<string, { revenue: number; cost: number; profit: number }> = {};
    for (const c of consumptions) {
      const type = c.consumptionType || 'other';
      if (!byType[type]) {
        byType[type] = { revenue: 0, cost: 0, profit: 0 };
      }
      byType[type].revenue += Number(c.actualAmount);
      byType[type].cost += Number(c.costAmount || 0);
      byType[type].profit = byType[type].revenue - byType[type].cost;
    }

    return {
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        profitRate: totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0
      },
      byType
    };
  }

  // ========== 10. 银行对账单 ==========
  async getBank(query: { startDate?: string; endDate?: string; storeId?: string; bankName?: string }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });

    const consumptions = await qb.getMany();

    // 按支付方式分组（模拟银行账户）
    const byPaymentMethod: Record<string, { count: number; amount: number }> = {};
    const bankMethods = ['wechat', 'alipay', 'card', 'bank'];

    for (const c of consumptions) {
      const method = c.paymentMethod || 'cash';
      if (!byPaymentMethod[method]) {
        byPaymentMethod[method] = { count: 0, amount: 0 };
      }
      byPaymentMethod[method].count++;
      byPaymentMethod[method].amount += Number(c.actualAmount);
    }

    const totalBank = bankMethods.reduce((sum, method) => sum + (byPaymentMethod[method]?.amount || 0), 0);

    return {
      summary: {
        totalAmount: consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0),
        totalCount: consumptions.length,
        bankAmount: totalBank
      },
      byPaymentMethod,
      records: consumptions.slice(0, 100).map(c => ({
        id: c.id,
        date: new Date(c.createdAt).toISOString().split('T')[0],
        orderNo: c.orderNo,
        amount: Number(c.actualAmount),
        paymentMethod: c.paymentMethod,
        memberName: c.member?.name
      }))
    };
  }

  // ========== 11. 员工业务分析 ==========
  async getEmployeeBusiness(query: { startDate?: string; endDate?: string; storeId?: string; employeeId?: string; businessType?: string }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);

    let employees = await this.employeeRepository.find({ where: { status: EmployeeStatus.ACTIVE } });
    if (query.employeeId) {
      employees = employees.filter(e => e.id === query.employeeId);
    }

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });

    const consumptions = await qb.getMany();

    const results = employees.map(emp => {
      const empConsumptions = consumptions.filter(c => c.employeeId === emp.id);

      // 按业务类型统计
      const byType: Record<string, { count: number; amount: number }> = {};
      for (const c of empConsumptions) {
        const type = c.consumptionType || 'service';
        if (!byType[type]) {
          byType[type] = { count: 0, amount: 0 };
        }
        byType[type].count++;
        byType[type].amount += Number(c.actualAmount);
      }

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        position: emp.position,
        totalCount: empConsumptions.length,
        totalAmount: empConsumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0),
        byType
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      summary: {
        totalEmployees: results.length,
        totalAmount: results.reduce((sum, r) => sum + r.totalAmount, 0),
        totalCount: results.reduce((sum, r) => sum + r.totalCount, 0)
      },
      employees: results
    };
  }

  // ========== 12. 品项分析 ==========
  async getItemAnalysis(query: { startDate?: string; endDate?: string; storeId?: string; category?: string; limit?: number; sortBy?: string }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const limit = query.limit || 20;
    const sortBy = query.sortBy || 'revenue';

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });

    const consumptions = await qb.getMany();

    // 统计品项
    const itemStats: Record<string, { itemId: string; itemName: string; category: string; count: number; revenue: number; cost: number }> = {};

    for (const c of consumptions) {
      const items = c.items || [];
      for (const item of items as any[]) {
        const id = item.serviceId || item.productId;
        if (!itemStats[id]) {
          itemStats[id] = {
            itemId: id,
            itemName: item.serviceName || item.productName || '未知',
            category: item.category || '其他',
            count: 0,
            revenue: 0,
            cost: 0
          };
        }
        itemStats[id].count += item.quantity || 1;
        itemStats[id].revenue += item.amount || (item.price * (item.quantity || 1));
        itemStats[id].cost += item.cost || 0;
      }
    }

    let results = Object.values(itemStats);
    if (query.category) {
      results = results.filter(r => r.category === query.category);
    }

    // 排序
    if (sortBy === 'sales') {
      results.sort((a, b) => b.count - a.count);
    } else if (sortBy === 'profit') {
      results.sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost));
    } else {
      results.sort((a, b) => b.revenue - a.revenue);
    }

    return {
      summary: {
        totalItems: results.length,
        totalRevenue: results.reduce((sum, r) => sum + r.revenue, 0),
        totalCount: results.reduce((sum, r) => sum + r.count, 0)
      },
      items: results.slice(0, limit)
    };
  }

  // ========== 13. 顾客消费汇总 ==========
  async getCustomerConsumption(query: { startDate?: string; endDate?: string; storeId?: string; page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('c.memberId IS NOT NULL');
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });

    const consumptions = await qb.getMany();

    // 按会员汇总
    const memberStats: Record<string, { memberId: string; memberName: string; phone: string; count: number; amount: number }> = {};

    for (const c of consumptions) {
      if (!c.memberId) continue;
      if (!memberStats[c.memberId]) {
        memberStats[c.memberId] = {
          memberId: c.memberId,
          memberName: c.member?.name || '未知',
          phone: c.member?.phone || '',
          count: 0,
          amount: 0
        };
      }
      memberStats[c.memberId].count++;
      memberStats[c.memberId].amount += Number(c.actualAmount);
    }

    let results = Object.values(memberStats);

    // 排序
    const sortBy = query.sortBy || 'amount';
    const sortOrder = query.sortOrder || 'desc';
    results.sort((a, b) => {
      const aVal = sortBy === 'count' ? a.count : sortBy === 'amount' ? a.amount : a.amount / a.count;
      const bVal = sortBy === 'count' ? b.count : sortBy === 'amount' ? b.amount : b.amount / b.count;
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return {
      summary: {
        totalMembers: results.length,
        totalAmount: results.reduce((sum, r) => sum + r.amount, 0),
        totalCount: results.reduce((sum, r) => sum + r.count, 0)
      },
      data: results.slice((page - 1) * pageSize, page * pageSize),
      pagination: {
        page,
        pageSize,
        total: results.length,
        totalPages: Math.ceil(results.length / pageSize)
      }
    };
  }

  // ========== 14. 顾客消费明细 ==========
  async getCustomerDetail(query: { startDate?: string; endDate?: string; storeId?: string; memberId?: string; page?: number; pageSize?: number }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });
    if (query.memberId) qb.andWhere('c.memberId = :memberId', { memberId: query.memberId });

    const [consumptions, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();

    return {
      summary: {
        totalAmount: consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0),
        totalCount: total
      },
      data: consumptions.map(c => ({
        id: c.id,
        date: new Date(c.createdAt).toISOString().split('T')[0],
        orderNo: c.orderNo,
        memberName: c.member?.name,
        type: c.consumptionType,
        amount: Number(c.actualAmount),
        paymentMethod: c.paymentMethod,
        employeeName: c.employee?.name
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // ========== 15. 充值明细 ==========
  async getRechargeDetail(query: { startDate?: string; endDate?: string; storeId?: string; memberId?: string; paymentMethod?: string; page?: number; pageSize?: number }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('c.consumptionType = :type', { type: 'recharge' });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });
    if (query.memberId) qb.andWhere('c.memberId = :memberId', { memberId: query.memberId });
    if (query.paymentMethod) qb.andWhere('c.paymentMethod = :paymentMethod', { paymentMethod: query.paymentMethod });

    const [consumptions, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();

    return {
      summary: {
        totalAmount: consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0),
        totalCount: total
      },
      data: consumptions.map(c => ({
        id: c.id,
        date: new Date(c.createdAt).toISOString().split('T')[0],
        orderNo: c.orderNo,
        memberName: c.member?.name,
        amount: Number(c.actualAmount),
        paymentMethod: c.paymentMethod,
        employeeName: c.employee?.name
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // ========== 16. 次卡销售明细 ==========
  async getCardSales(query: { startDate?: string; endDate?: string; storeId?: string; cardType?: string; page?: number; pageSize?: number }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('c.consumptionType = :type', { type: 'card_sale' });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });

    const [consumptions, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();

    return {
      summary: {
        totalAmount: consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0),
        totalCount: total
      },
      data: consumptions.map(c => ({
        id: c.id,
        date: new Date(c.createdAt).toISOString().split('T')[0],
        orderNo: c.orderNo,
        memberName: c.member?.name,
        cardName: c.card?.name,
        amount: Number(c.actualAmount),
        employeeName: c.employee?.name
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // ========== 17. 次卡消费明细 ==========
  async getCardConsumption(query: { startDate?: string; endDate?: string; storeId?: string; cardId?: string; page?: number; pageSize?: number }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('c.consumptionType = :type', { type: 'card_use' });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });
    if (query.cardId) qb.andWhere('c.cardId = :cardId', { cardId: query.cardId });

    const [consumptions, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();

    return {
      summary: {
        totalAmount: consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0),
        totalCount: total
      },
      data: consumptions.map(c => ({
        id: c.id,
        date: new Date(c.createdAt).toISOString().split('T')[0],
        orderNo: c.orderNo,
        memberName: c.member?.name,
        cardName: c.card?.name,
        amount: Number(c.actualAmount),
        employeeName: c.employee?.name
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // ========== 18. 员工提成汇总 ==========
  async getEmployeeCommission(query: { startDate?: string; endDate?: string; storeId?: string; employeeId?: string; commissionType?: string }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);

    let employees = await this.employeeRepository.find({ where: { status: EmployeeStatus.ACTIVE } });
    if (query.employeeId) {
      employees = employees.filter(e => e.id === query.employeeId);
    }

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });

    const consumptions = await qb.getMany();

    const results = employees.map(emp => {
      const empConsumptions = consumptions.filter(c => c.employeeId === emp.id);
      const totalCommission = empConsumptions.reduce((sum, c) => sum + Number(c.commission || 0), 0);
      const serviceCommission = empConsumptions.reduce((sum, c) => sum + Number(c.serviceCommission || 0), 0);
      const productCommission = empConsumptions.reduce((sum, c) => sum + Number(c.productCommission || 0), 0);

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        position: emp.position,
        totalCommission,
        serviceCommission,
        productCommission,
        consumptionCount: empConsumptions.length
      };
    }).sort((a, b) => b.totalCommission - a.totalCommission);

    return {
      summary: {
        totalCommission: results.reduce((sum, r) => sum + r.totalCommission, 0),
        serviceCommission: results.reduce((sum, r) => sum + r.serviceCommission, 0),
        productCommission: results.reduce((sum, r) => sum + r.productCommission, 0)
      },
      employees: results
    };
  }

  // ========== 19. 提成明细 ==========
  async getCommissionDetail(query: { startDate?: string; endDate?: string; storeId?: string; employeeId?: string; page?: number; pageSize?: number }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });
    if (query.employeeId) qb.andWhere('c.employeeId = :employeeId', { employeeId: query.employeeId });

    const [consumptions, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();

    return {
      summary: {
        totalCommission: consumptions.reduce((sum, c) => sum + Number(c.commission || 0), 0),
        totalCount: total
      },
      data: consumptions.map(c => ({
        id: c.id,
        date: new Date(c.createdAt).toISOString().split('T')[0],
        orderNo: c.orderNo,
        memberName: c.member?.name,
        employeeName: c.employee?.name,
        amount: Number(c.actualAmount),
        commission: Number(c.commission || 0),
        commissionType: c.commissionType
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // ========== 20. 工资统计 ==========
  async getSalary(query: { startDate?: string; endDate?: string; storeId?: string; employeeId?: string; includeBonus?: boolean }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);

    let employees = await this.employeeRepository.find({ where: { status: EmployeeStatus.ACTIVE } });
    if (query.employeeId) {
      employees = employees.filter(e => e.id === query.employeeId);
    }

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });

    const consumptions = await qb.getMany();

    const results = employees.map(emp => {
      const empConsumptions = consumptions.filter(c => c.employeeId === emp.id);
      const commission = empConsumptions.reduce((sum, c) => sum + Number(c.commission || 0), 0);
      const baseSalary = Number(emp.baseSalary || 0);
      const bonus = query.includeBonus ? Number(emp.bonus || 0) : 0;
      const total = baseSalary + commission + bonus;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        position: emp.position,
        baseSalary,
        commission,
        bonus,
        total,
        deduction: 0 // TODO: 实现扣款逻辑
      };
    });

    return {
      summary: {
        totalBaseSalary: results.reduce((sum, r) => sum + r.baseSalary, 0),
        totalCommission: results.reduce((sum, r) => sum + r.commission, 0),
        totalBonus: results.reduce((sum, r) => sum + r.bonus, 0),
        total: results.reduce((sum, r) => sum + r.total, 0)
      },
      employees: results
    };
  }

  // ========== 21. 会员卡变更 ==========
  async getMemberCardChange(query: { startDate?: string; endDate?: string; storeId?: string; memberId?: string; page?: number; pageSize?: number }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    // 模拟会员卡变更记录
    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('c.consumptionType IN (:...types)', { types: ['card_upgrade', 'card_renew', 'card_transfer'] });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });
    if (query.memberId) qb.andWhere('c.memberId = :memberId', { memberId: query.memberId });

    const [consumptions, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();

    return {
      summary: {
        totalCount: total
      },
      data: consumptions.map(c => ({
        id: c.id,
        date: new Date(c.createdAt).toISOString().split('T')[0],
        memberName: c.member?.name,
        changeType: c.consumptionType,
        oldCard: c.oldCard?.name,
        newCard: c.newCard?.name,
        amount: Number(c.actualAmount)
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // ========== 22. 会员余额统计 ==========
  async getMemberBalance(query: { startDate?: string; endDate?: string; storeId?: string; groupBy?: string }) {
    const members = await this.memberRepository.find();

    const totalBalance = members.reduce((sum, m) => sum + Number(m.balance || 0), 0);

    // 按等级分组
    const byLevel: Record<string, { count: number; balance: number }> = {};
    for (const m of members) {
      const level = m.level || 'normal';
      if (!byLevel[level]) {
        byLevel[level] = { count: 0, balance: 0 };
      }
      byLevel[level].count++;
      byLevel[level].balance += Number(m.balance || 0);
    }

    // 按余额范围分组
    const byRange: Record<string, { count: number; balance: number }> = {
      '0': { count: 0, balance: 0 },
      '1-500': { count: 0, balance: 0 },
      '500-1000': { count: 0, balance: 0 },
      '1000-5000': { count: 0, balance: 0 },
      '5000+': { count: 0, balance: 0 }
    };

    for (const m of members) {
      const balance = Number(m.balance || 0);
      if (balance === 0) {
        byRange['0'].count++;
      } else if (balance < 500) {
        byRange['1-500'].count++;
        byRange['1-500'].balance += balance;
      } else if (balance < 1000) {
        byRange['500-1000'].count++;
        byRange['500-1000'].balance += balance;
      } else if (balance < 5000) {
        byRange['1000-5000'].count++;
        byRange['1000-5000'].balance += balance;
      } else {
        byRange['5000+'].count++;
        byRange['5000+'].balance += balance;
      }
    }

    return {
      summary: {
        totalMembers: members.length,
        totalBalance,
        avgBalance: members.length > 0 ? totalBalance / members.length : 0
      },
      byLevel,
      byRange
    };
  }

  // ========== 23. 会员次卡统计 ==========
  async getMemberCard(query: { startDate?: string; endDate?: string; storeId?: string; cardType?: string }) {
    const members = await this.memberRepository.find();

    // 模拟次卡统计
    const cardStats: Record<string, { count: number; totalTimes: number; usedTimes: number; remainingTimes: number }> = {};

    // TODO: 实现真实的次卡统计逻辑

    return {
      summary: {
        totalCards: Object.keys(cardStats).length,
        totalTimes: Object.values(cardStats).reduce((sum, c) => sum + c.totalTimes, 0),
        usedTimes: Object.values(cardStats).reduce((sum, c) => sum + c.usedTimes, 0),
        remainingTimes: Object.values(cardStats).reduce((sum, c) => sum + c.remainingTimes, 0)
      },
      cards: Object.entries(cardStats).map(([cardType, stats]) => ({
        cardType,
        ...stats
      }))
    };
  }

  // ========== 24. 积分变更 ==========
  async getPointChange(query: { startDate?: string; endDate?: string; storeId?: string; memberId?: string; page?: number; pageSize?: number }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    // 模拟积分变更记录
    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });
    if (query.memberId) qb.andWhere('c.memberId = :memberId', { memberId: query.memberId });

    const [consumptions, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();

    return {
      summary: {
        totalEarn: consumptions.reduce((sum, c) => sum + Number(c.pointsEarned || 0), 0),
        totalUse: consumptions.reduce((sum, c) => sum + Number(c.pointsUsed || 0), 0)
      },
      data: consumptions.map(c => ({
        id: c.id,
        date: new Date(c.createdAt).toISOString().split('T')[0],
        memberName: c.member?.name,
        changeType: Number(c.pointsEarned || 0) > 0 ? 'earn' : 'use',
        points: Number(c.pointsEarned || 0) || Number(c.pointsUsed || 0),
        balance: c.member?.points || 0,
        remark: c.orderNo
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // ========== 25. 现金对账 ==========
  async getCashReconciliation(query: { startDate?: string; endDate?: string; storeId?: string; verified?: boolean }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('c.paymentMethod = :method', { method: 'cash' });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });

    const consumptions = await qb.getMany();

    // 按日期分组
    const byDate: Record<string, { expected: number; actual: number; difference: number }> = {};
    for (const c of consumptions) {
      const date = new Date(c.createdAt).toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { expected: 0, actual: 0, difference: 0 };
      }
      byDate[date].expected += Number(c.actualAmount);
      // TODO: 实际金额需要从对账记录获取
      byDate[date].actual = byDate[date].expected; // 暂时假设一致
      byDate[date].difference = byDate[date].actual - byDate[date].expected;
    }

    return {
      summary: {
        totalExpected: Object.values(byDate).reduce((sum, d) => sum + d.expected, 0),
        totalActual: Object.values(byDate).reduce((sum, d) => sum + d.actual, 0),
        totalDifference: Object.values(byDate).reduce((sum, d) => sum + d.difference, 0)
      },
      byDate: Object.entries(byDate).map(([date, data]) => ({ date, ...data }))
    };
  }

  // ========== 26. 客流统计 ==========
  async getTraffic(query: { startDate?: string; endDate?: string; storeId?: string; groupBy?: 'hour' | 'day' | 'week' }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const groupBy = query.groupBy || 'hour';

    const qb = this.consumptionRepository.createQueryBuilder('c')
      .where('c.createdAt BETWEEN :start AND :end', { start, end });
    if (query.storeId) qb.andWhere('c.storeId = :storeId', { storeId: query.storeId });

    const consumptions = await qb.getMany();

    // 按时段分组
    const timeSlots: Record<string, { count: number; amount: number }> = {};

    for (const c of consumptions) {
      const key = this.getDateKey(new Date(c.createdAt), groupBy);
      if (!timeSlots[key]) {
        timeSlots[key] = { count: 0, amount: 0 };
      }
      timeSlots[key].count++;
      timeSlots[key].amount += Number(c.actualAmount);
    }

    const results = Object.entries(timeSlots).map(([timeSlot, data]) => ({
      timeSlot,
      ...data,
      avgTicket: data.count > 0 ? data.amount / data.count : 0
    })).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    // 找出高峰时段
    const peak = [...results].sort((a, b) => b.count - a.count).slice(0, 3);

    return {
      summary: {
        totalCount: results.reduce((sum, r) => sum + r.count, 0),
        totalAmount: results.reduce((sum, r) => sum + r.amount, 0),
        avgCount: results.length > 0 ? results.reduce((sum, r) => sum + r.count, 0) / results.length : 0,
        peak
      },
      timeSlots: results
    };
  }

  // ========== 27. 短信费收取记录 ==========
  async getSmsFee(query: { startDate?: string; endDate?: string; storeId?: string; page?: number; pageSize?: number }) {
    const { start, end } = this.getDateRange(query.startDate, query.endDate);
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    // 模拟短信费记录
    // TODO: 实现真实的短信费统计逻辑

    const records: any[] = [];
    const total = 0;

    return {
      summary: {
        totalFee: 0,
        totalCount: 0
      },
      data: records,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // ========== 原有接口保持不变 ==========

  async getDailyReport(date: string): Promise<any> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const consumptions = await this.consumptionRepository.find({
      where: { createdAt: Between(start, end) },
      relations: ['member', 'employee'],
    });

    const totalAmount = consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);
    const totalCommission = consumptions.reduce((sum, c) => sum + Number(c.commission || 0), 0);
    const totalCount = consumptions.length;

    const byPaymentMethod: Record<string, number> = {};
    for (const c of consumptions) {
      byPaymentMethod[c.paymentMethod] = (byPaymentMethod[c.paymentMethod] || 0) + Number(c.actualAmount);
    }

    const byType: Record<string, { count: number; amount: number }> = {};
    for (const c of consumptions) {
      if (!byType[c.consumptionType]) {
        byType[c.consumptionType] = { count: 0, amount: 0 };
      }
      byType[c.consumptionType].count++;
      byType[c.consumptionType].amount += Number(c.actualAmount);
    }

    return {
      date,
      totalAmount,
      totalCommission,
      totalCount,
      byPaymentMethod,
      byType,
      consumptions,
    };
  }

  async getMonthlyReport(year: number, month: number): Promise<any> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const consumptions = await this.consumptionRepository.find({
      where: { createdAt: Between(start, end) },
      relations: ['member', 'employee'],
    });

    const totalAmount = consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);
    const totalCommission = consumptions.reduce((sum, c) => sum + Number(c.commission || 0), 0);
    const totalCount = consumptions.length;

    const dailyStats: Record<string, { count: number; amount: number }> = {};
    for (const c of consumptions) {
      const dateKey = new Date(c.createdAt).toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { count: 0, amount: 0 };
      }
      dailyStats[dateKey].count++;
      dailyStats[dateKey].amount += Number(c.actualAmount);
    }

    const byPaymentMethod: Record<string, number> = {};
    for (const c of consumptions) {
      byPaymentMethod[c.paymentMethod] = (byPaymentMethod[c.paymentMethod] || 0) + Number(c.actualAmount);
    }

    return {
      year,
      month,
      totalAmount,
      totalCommission,
      totalCount,
      dailyStats,
      byPaymentMethod,
    };
  }

  async getEmployeePerformance(startDate: string, endDate: string): Promise<any[]> {
    const { start, end } = this.getDateRange(startDate, endDate);

    const employees = await this.employeeRepository.find({
      where: { status: EmployeeStatus.ACTIVE },
    });

    const consumptions = await this.consumptionRepository.find({
      where: { createdAt: Between(start, end) },
      relations: ['employee'],
    });

    const result = employees.map(emp => {
      const empConsumptions = consumptions.filter(c => c.employeeId === emp.id);
      const totalSales = empConsumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);
      const totalCommission = empConsumptions.reduce((sum, c) => sum + Number(c.commission || 0), 0);
      const serviceCount = empConsumptions.reduce((sum, c) => {
        const items = c.items || [];
        return sum + items.filter((item: any) => item.employeeId === emp.id).length;
      }, 0);

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        employeeNo: emp.employeeNo,
        position: emp.position,
        totalSales,
        totalCommission,
        serviceCount,
        consumptions: empConsumptions,
      };
    });

    return result.sort((a, b) => b.totalSales - a.totalSales);
  }

  async getServiceSalesRanking(startDate: string, endDate: string, limit: number = 10): Promise<any[]> {
    const { start, end } = this.getDateRange(startDate, endDate);

    const consumptions = await this.consumptionRepository.find({
      where: { createdAt: Between(start, end) },
    });

    const serviceStats: Record<string, { serviceId: string; serviceName: string; count: number; totalAmount: number }> = {};

    for (const c of consumptions) {
      const items = c.items || [];
      for (const item of items as any[]) {
        if (!serviceStats[item.serviceId]) {
          serviceStats[item.serviceId] = {
            serviceId: item.serviceId,
            serviceName: item.serviceName,
            count: 0,
            totalAmount: 0,
          };
        }
        serviceStats[item.serviceId].count += item.quantity || 1;
        serviceStats[item.serviceId].totalAmount += item.amount || (item.price * item.quantity);
      }
    }

    return Object.values(serviceStats)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit);
  }

  async getPermDyeConversionRate(startDate: string, endDate: string): Promise<any> {
    const { start, end } = this.getDateRange(startDate, endDate);

    const consumptions = await this.consumptionRepository.find({
      where: { createdAt: Between(start, end) },
    });

    const services = await this.serviceRepository.find();
    const permDyeKeywords = ['烫', '染', '烫发', '染发', '冷烫', '热烫', '数码烫', '颜色', '挑染'];
    const permDyeServices = services.filter(s => permDyeKeywords.some(keyword => s.name.includes(keyword)));
    const permDyeServiceIds = new Set(permDyeServices.map(s => s.id));

    let totalCustomers = new Set<string>();
    let permDyeCustomers = new Set<string>();

    for (const consumption of consumptions) {
      if (consumption.memberId) {
        totalCustomers.add(consumption.memberId);
      }
      const items = consumption.items || [];
      const hasPermDye = items.some((item: any) => permDyeServiceIds.has(item.serviceId));
      if (hasPermDye && consumption.memberId) {
        permDyeCustomers.add(consumption.memberId);
      }
    }

    const conversionRate = totalCustomers.size > 0 ? (permDyeCustomers.size / totalCustomers.size * 100).toFixed(2) : 0;

    return {
      summary: {
        totalCustomers: totalCustomers.size,
        permDyeCustomers: permDyeCustomers.size,
        conversionRate,
        permDyeServices: permDyeServices.length,
      },
      services: permDyeServices.map(s => ({ id: s.id, name: s.name, price: s.price })),
    };
  }

  async getCustomerFlowTrend(startDate: string, endDate: string, groupBy: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    const { start, end } = this.getDateRange(startDate, endDate);

    const consumptions = await this.consumptionRepository.find({
      where: { createdAt: Between(start, end) },
      relations: ['member'],
    });

    const flowData: Record<string, { customerCount: number; newCustomerCount: number; totalAmount: number }> = {};

    const knownCustomers = new Set<string>();

    for (const consumption of consumptions) {
      const dateKey = this.getDateKey(new Date(consumption.createdAt), groupBy);

      if (!flowData[dateKey]) {
        flowData[dateKey] = { customerCount: 0, newCustomerCount: 0, totalAmount: 0 };
      }

      flowData[dateKey].customerCount++;
      flowData[dateKey].totalAmount += Number(consumption.actualAmount);

      if (consumption.memberId) {
        if (knownCustomers.has(consumption.memberId)) {
          // 老客户
        } else {
          flowData[dateKey].newCustomerCount++;
          knownCustomers.add(consumption.memberId);
        }
      }
    }

    const trend = Object.entries(flowData).map(([date, data]) => ({
      date,
      ...data,
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary: {
        totalCustomerCount: trend.reduce((sum, d) => sum + d.customerCount, 0),
        totalNewCustomerCount: trend.reduce((sum, d) => sum + d.newCustomerCount, 0),
      },
      trend,
      groupBy,
    };
  }

  async getCustomerRetention(months: number = 6): Promise<any> {
    const result = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i, 0);
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);

      const newCustomers = await this.consumptionRepository
        .createQueryBuilder('c')
        .select('c.memberId')
        .where('c.createdAt BETWEEN :start AND :end', { start: monthStart, end: monthEnd })
        .groupBy('c.memberId')
        .getRawMany();

      const newCustomerIds = newCustomers.map(c => c.memberId).filter(Boolean);

      let retainedCount = 0;
      for (const memberId of newCustomerIds) {
        const nextMonthStart = new Date(monthEnd);
        nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
        const nextMonthEnd = new Date(nextMonthStart);
        nextMonthEnd.setMonth(nextMonthEnd.getMonth() + 1);

        const nextPurchase = await this.consumptionRepository.findOne({
          where: { memberId, createdAt: Between(nextMonthStart, nextMonthEnd) },
        });

        if (nextPurchase) {
          retainedCount++;
        }
      }

      const retentionRate = newCustomerIds.length > 0 ? (retainedCount / newCustomerIds.length * 100).toFixed(2) : 0;

      result.push({
        month: monthStart.toISOString().slice(0, 7),
        newCustomers: newCustomerIds.length,
        retainedCustomers: retainedCount,
        retentionRate,
      });
    }

    return result;
  }

  // ========== 目标管理 ==========

  async createSalesTarget(data: any): Promise<SalesTarget> {
    const target = this.salesTargetRepository.create({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      achievedAmount: 0,
      completionRate: 0,
    });
    const saved = await this.salesTargetRepository.save(target);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async getSalesTarget(query: any): Promise<SalesTarget[]> {
    const qb = this.salesTargetRepository.createQueryBuilder('target');

    if (query.periodType) {
      qb.andWhere('target.periodType = :periodType', { periodType: query.periodType });
    }
    if (query.startDate) {
      qb.andWhere('target.startDate >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('target.endDate <= :endDate', { endDate: query.endDate });
    }
    if (query.storeId) {
      qb.andWhere('target.storeId = :storeId', { storeId: query.storeId });
    }
    if (query.employeeId) {
      qb.andWhere('target.employeeId = :employeeId', { employeeId: query.employeeId });
    }

    qb.orderBy('target.createdAt', 'DESC');
    return qb.getMany();
  }

  async getSalesTargetById(id: string): Promise<SalesTarget> {
    const target = await this.salesTargetRepository.findOne({ where: { id } });
    if (!target) {
      throw new NotFoundException('目标不存在');
    }
    return target;
  }

  async deleteSalesTarget(id: string): Promise<void> {
    const target = await this.salesTargetRepository.findOne({ where: { id } });
    if (!target) {
      throw new NotFoundException('目标不存在');
    }
    await this.salesTargetRepository.remove(target);
  }

  // ========== Target CRUD (for controller) ==========

  async createTarget(dto: any): Promise<Target> {
    const target = this.targetRepository.create({
      ...dto,
      actualAmount: 0,
      completionRate: 0,
    });
    const saved = await this.targetRepository.save(target);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async updateTarget(id: string, dto: any): Promise<Target> {
    const target = await this.targetRepository.findOne({ where: { id } });
    if (!target) {
      throw new NotFoundException('目标不存在');
    }
    Object.assign(target, dto);
    const saved = await this.targetRepository.save(target);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async deleteTarget(id: string): Promise<void> {
    const target = await this.targetRepository.findOne({ where: { id } });
    if (!target) {
      throw new NotFoundException('目标不存在');
    }
    await this.targetRepository.remove(target);
  }
}
