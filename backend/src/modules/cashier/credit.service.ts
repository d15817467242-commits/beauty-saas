import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credit, CreditPayment, CreditStatus } from './credit.entity';
import { CreateCreditDto, CreateCreditPaymentDto } from './dto/credit.dto';

@Injectable()
export class CreditService {
  constructor(
    @InjectRepository(Credit)
    private creditRepository: Repository<Credit>,
    @InjectRepository(CreditPayment)
    private creditPaymentRepository: Repository<CreditPayment>,
  ) {}

  // 创建挂账记录
  async create(dto: CreateCreditDto, userId: string): Promise<Credit> {
    const credit = this.creditRepository.create({
      ...dto,
      remainingAmount: dto.totalAmount,
      paidAmount: 0,
      status: CreditStatus.PENDING,
      creditTime: new Date(),
      dueTime: dto.dueTime ? new Date(dto.dueTime) : undefined,
      createdBy: userId,
    });
    return this.creditRepository.save(credit);
  }

  // 获取挂账列表
  async findAll(memberId?: string, status?: CreditStatus): Promise<Credit[]> {
    const where: any = {};
    if (memberId) {
      where.memberId = memberId;
    }
    if (status) {
      where.status = status;
    }
    return this.creditRepository.find({
      where,
      relations: ['member'],
      order: { createdAt: 'DESC' },
    });
  }

  // 获取单个挂账
  async findOne(id: string): Promise<Credit> {
    const credit = await this.creditRepository.findOne({
      where: { id },
      relations: ['member', 'payments'],
    });
    if (!credit) {
      throw new NotFoundException('挂账记录不存在');
    }
    return credit;
  }

  // 还款
  async createPayment(dto: CreateCreditPaymentDto, userId: string): Promise<CreditPayment> {
    const credit = await this.findOne(dto.creditId);
    
    if (credit.status === CreditStatus.SETTLED) {
      throw new BadRequestException('该挂账已结清');
    }
    
    if (dto.amount > credit.remainingAmount) {
      throw new BadRequestException('还款金额超过剩余金额');
    }
    
    // 创建还款记录
    const payment = this.creditPaymentRepository.create({
      ...dto,
      paymentTime: new Date(),
      createdBy: userId,
    });
    await this.creditPaymentRepository.save(payment);
    
    // 更新挂账记录
    credit.paidAmount += dto.amount;
    credit.remainingAmount -= dto.amount;
    
    if (credit.remainingAmount === 0) {
      credit.status = CreditStatus.SETTLED;
      credit.settleTime = new Date();
    } else {
      credit.status = CreditStatus.PARTIAL;
    }
    
    await this.creditRepository.save(credit);
    
    return payment;
  }

  // 获取会员挂账汇总
  async getMemberCreditSummary(memberId: string): Promise<{
    totalCredit: number;
    totalPaid: number;
    totalRemaining: number;
    pendingCount: number;
    overdueCount: number;
  }> {
    const credits = await this.creditRepository.find({
      where: { memberId },
    });
    
    const now = new Date();
    let totalCredit = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    
    for (const credit of credits) {
      totalCredit += credit.totalAmount;
      totalPaid += credit.paidAmount;
      totalRemaining += credit.remainingAmount;
      
      if (credit.status !== CreditStatus.SETTLED) {
        pendingCount++;
        if (credit.dueTime && new Date(credit.dueTime) < now) {
          overdueCount++;
        }
      }
    }
    
    return {
      totalCredit,
      totalPaid,
      totalRemaining,
      pendingCount,
      overdueCount,
    };
  }

  // 更新逾期状态
  async updateOverdueStatus(): Promise<void> {
    const now = new Date();
    const overdueCredits = await this.creditRepository.find({
      where: {
        status: CreditStatus.PENDING,
        dueTime: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 过期一天后标记为逾期
      },
    });
    
    for (const credit of overdueCredits) {
      if (credit.dueTime && new Date(credit.dueTime) < now) {
        credit.status = CreditStatus.OVERDUE;
        await this.creditRepository.save(credit);
      }
    }
  }

  // 获取挂账还款记录
  async getPayments(creditId: string): Promise<CreditPayment[]> {
    return this.creditPaymentRepository.find({
      where: { creditId },
      order: { paymentTime: 'DESC' },
    });
  }
}
