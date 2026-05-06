import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ExpenseService } from '../services/expense.service';
import { StoreExpense } from '../entities/store-expense.entity';
import { ExpenseCategory } from '../entities/expense-category.entity';

@Controller('expense')
export class ExpenseController {
  constructor(private readonly service: ExpenseService) {}

  // ========== 收支分类接口 ==========

  @Get('categories')
  getCategories(@Query('type') type?: 'income' | 'expense'): Promise<ExpenseCategory[]> {
    return this.service.getCategories(type);
  }

  @Get('categories/:id')
  getCategory(@Param('id', ParseUUIDPipe) id: string): Promise<ExpenseCategory> {
    return this.service.getCategory(id);
  }

  @Post('categories')
  createCategory(@Body() data: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
    return this.service.createCategory(data);
  }

  @Put('categories/:id')
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<ExpenseCategory>
  ): Promise<ExpenseCategory> {
    return this.service.updateCategory(id, data);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.deleteCategory(id);
  }

  // ========== 收支记录接口 ==========

  @Get()
  getExpenses(@Query() query: {
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
    return this.service.getExpenses(query);
  }

  @Get(':id')
  getExpense(@Param('id', ParseUUIDPipe) id: string): Promise<StoreExpense> {
    return this.service.getExpense(id);
  }

  @Post()
  createExpense(@Body() data: Partial<StoreExpense>): Promise<StoreExpense> {
    return this.service.createExpense(data);
  }

  @Put(':id')
  updateExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<StoreExpense>
  ): Promise<StoreExpense> {
    return this.service.updateExpense(id, data);
  }

  @Delete(':id')
  deleteExpense(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.deleteExpense(id);
  }

  // ========== 审核接口 ==========

  @Post(':id/approve')
  approveExpense(@Param('id', ParseUUIDPipe) id: string): Promise<StoreExpense> {
    // TODO: 从JWT获取用户ID
    const userId = 'system';
    return this.service.approveExpense(id, userId);
  }

  @Post(':id/reject')
  rejectExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string
  ): Promise<StoreExpense> {
    // TODO: 从JWT获取用户ID
    const userId = 'system';
    return this.service.rejectExpense(id, userId, reason);
  }

  // ========== 统计报表 ==========

  @Get('summary/overview')
  getExpenseSummary(@Query() query: {
    startDate?: string;
    endDate?: string;
    storeId?: string;
  }): Promise<any> {
    return this.service.getExpenseSummary(query);
  }
}
