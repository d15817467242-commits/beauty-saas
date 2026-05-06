import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { StoreExpense } from '../entities/store-expense.entity';
import { ExpenseCategory } from '../entities/expense-category.entity';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(StoreExpense)
    private expenseRepository: Repository<StoreExpense>,
    @InjectRepository(ExpenseCategory)
    private categoryRepository: Repository<ExpenseCategory>,
  ) {}

  // 生成单据编号
  private generateDocumentNo(type: 'income' | 'expense'): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = type === 'income' ? 'SR' : 'ZC';
    return `${prefix}${year}${month}${day}${random}`;
  }

  // ========== 收支分类管理 ==========

  async getCategories(type?: 'income' | 'expense'): Promise<ExpenseCategory[]> {
    const where: any = {};
    if (type) where.type = type;
    return this.categoryRepository.find({
      where,
      order: { sort: 'ASC', createdAt: 'ASC' }
    });
  }

  async getCategory(id: string): Promise<ExpenseCategory> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('分类不存在');
    return category;
  }

  async createCategory(data: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
    const category = this.categoryRepository.create(data);
    return this.categoryRepository.save(category);
  }

  async updateCategory(id: string, data: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
    const category = await this.getCategory(id);
    Object.assign(category, data);
    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.getCategory(id);
    // 检查是否有关联的收支记录
    const count = await this.expenseRepository.count({ where: { categoryId: id } });
    if (count > 0) {
      throw new BadRequestException('该分类下有收支记录，不能删除');
    }
    await this.categoryRepository.remove(category);
  }

  // ========== 收支记录管理 ==========

  async getExpenses(query: {
    type?: 'income' | 'expense';
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    storeId?: string;
    status?: 'pending' | 'approved' | 'rejected';
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: StoreExpense[]; total: number }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.expenseRepository.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category');

    if (query.type) {
      queryBuilder.andWhere('expense.type = :type', { type: query.type });
    }
    if (query.categoryId) {
      queryBuilder.andWhere('expense.categoryId = :categoryId', { categoryId: query.categoryId });
    }
    if (query.startDate) {
      queryBuilder.andWhere('expense.expenseDate >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      queryBuilder.andWhere('expense.expenseDate <= :endDate', { endDate: query.endDate });
    }
    if (query.storeId) {
      queryBuilder.andWhere('expense.storeId = :storeId', { storeId: query.storeId });
    }
    if (query.status) {
      queryBuilder.andWhere('expense.status = :status', { status: query.status });
    }
    if (query.keyword) {
      queryBuilder.andWhere(
        '(expense.documentNo LIKE :keyword OR expense.remark LIKE :keyword)',
        { keyword: `%${query.keyword}%` }
      );
    }

    queryBuilder
      .orderBy('expense.expenseDate', 'DESC')
      .addOrderBy('expense.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async getExpense(id: string): Promise<StoreExpense> {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: ['category']
    });
    if (!expense) throw new NotFoundException('收支记录不存在');
    return expense;
  }

  async createExpense(data: Partial<StoreExpense>, userId?: string): Promise<StoreExpense> {
    // 验证分类存在
    if (!data.categoryId) {
      throw new BadRequestException('分类ID不能为空');
    }
    const category = await this.getCategory(data.categoryId);
    
    const expense = this.expenseRepository.create({
      ...data,
      documentNo: this.generateDocumentNo(data.type || category.type),
      type: category.type,
      createdBy: userId,
    });
    
    return this.expenseRepository.save(expense);
  }

  async updateExpense(id: string, data: Partial<StoreExpense>): Promise<StoreExpense> {
    const expense = await this.getExpense(id);
    
    if (expense.status !== 'pending') {
      throw new BadRequestException('只能修改待审核的记录');
    }
    
    Object.assign(expense, data);
    return this.expenseRepository.save(expense);
  }

  async deleteExpense(id: string): Promise<void> {
    const expense = await this.getExpense(id);
    
    if (expense.status !== 'pending') {
      throw new BadRequestException('只能删除待审核的记录');
    }
    
    await this.expenseRepository.remove(expense);
  }

  // 审核
  async approveExpense(id: string, userId: string): Promise<StoreExpense> {
    const expense = await this.getExpense(id);
    
    if (expense.status !== 'pending') {
      throw new BadRequestException('该记录已审核');
    }
    
    expense.status = 'approved';
    expense.approvedBy = userId;
    expense.approvedAt = new Date();
    
    return this.expenseRepository.save(expense);
  }

  async rejectExpense(id: string, userId: string, reason?: string): Promise<StoreExpense> {
    const expense = await this.getExpense(id);
    
    if (expense.status !== 'pending') {
      throw new BadRequestException('该记录已审核');
    }
    
    expense.status = 'rejected';
    expense.approvedBy = userId;
    expense.approvedAt = new Date();
    if (reason) {
      expense.remark = `${expense.remark || ''} [驳回原因: ${reason}]`;
    }
    
    return this.expenseRepository.save(expense);
  }

  // ========== 统计报表 ==========

  async getExpenseSummary(query: {
    startDate?: string;
    endDate?: string;
    storeId?: string;
  }): Promise<{
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
    byCategory: { categoryId: string; categoryName: string; type: string; amount: number }[];
    byMonth: { month: string; income: number; expense: number }[];
  }> {
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .where('expense.status = :status', { status: 'approved' });

    if (query.startDate) {
      queryBuilder.andWhere('expense.expenseDate >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      queryBuilder.andWhere('expense.expenseDate <= :endDate', { endDate: query.endDate });
    }
    if (query.storeId) {
      queryBuilder.andWhere('expense.storeId = :storeId', { storeId: query.storeId });
    }

    const expenses = await queryBuilder.getMany();

    // 计算总收入和总支出
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryMap = new Map<string, { categoryId: string; categoryName: string; type: string; amount: number }>();
    const monthMap = new Map<string, { income: number; expense: number }>();

    for (const expense of expenses) {
      const amount = Number(expense.amount);
      
      if (expense.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }

      // 按分类统计
      const catKey = expense.categoryId;
      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, {
          categoryId: expense.categoryId,
          categoryName: expense.category?.name || '未知',
          type: expense.type,
          amount: 0
        });
      }
      categoryMap.get(catKey)!.amount += amount;

      // 按月统计
      const monthKey = expense.expenseDate.toISOString().slice(0, 7);
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { income: 0, expense: 0 });
      }
      const monthData = monthMap.get(monthKey)!;
      if (expense.type === 'income') {
        monthData.income += amount;
      } else {
        monthData.expense += amount;
      }
    }

    return {
      totalIncome,
      totalExpense,
      netIncome: totalIncome - totalExpense,
      byCategory: Array.from(categoryMap.values()),
      byMonth: Array.from(monthMap.entries()).map(([month, data]) => ({
        month,
        ...data
      })).sort((a, b) => a.month.localeCompare(b.month))
    };
  }
}
