import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseController } from './controllers/expense.controller';
import { ExpenseService } from './services/expense.service';
import { StoreExpense } from './entities/store-expense.entity';
import { ExpenseCategory } from './entities/expense-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StoreExpense,
      ExpenseCategory,
    ]),
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService],
  exports: [ExpenseService],
})
export class ExpenseModule {}
