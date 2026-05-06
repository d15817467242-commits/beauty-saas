import { Controller, Get, Post, Body, Param, Query, Request } from '@nestjs/common';
import { CreditService } from './credit.service';
import { CreateCreditDto, CreateCreditPaymentDto } from './dto/credit.dto';
import { CreditStatus } from './credit.entity';

@Controller('credits')
export class CreditController {
  constructor(private creditService: CreditService) {}

  @Post()
  async create(@Body() dto: CreateCreditDto, @Request() req: any) {
    return this.creditService.create(dto, req.user.userId);
  }

  @Get()
  async findAll(
    @Query('memberId') memberId?: string,
    @Query('status') status?: string,
  ) {
    return this.creditService.findAll(
      memberId,
      status as CreditStatus,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.creditService.findOne(id);
  }

  @Post('payments')
  async createPayment(@Body() dto: CreateCreditPaymentDto, @Request() req: any) {
    return this.creditService.createPayment(dto, req.user.userId);
  }

  @Get(':id/payments')
  async getPayments(@Param('id') id: string) {
    return this.creditService.getPayments(id);
  }

  @Get('member/:memberId/summary')
  async getMemberCreditSummary(@Param('memberId') memberId: string) {
    return this.creditService.getMemberCreditSummary(memberId);
  }
}
