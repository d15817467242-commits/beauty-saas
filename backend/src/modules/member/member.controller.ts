import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberLevel } from './member.entity';
import { StoreId } from '../../common/decorators/store-id.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  @Roles('admin', 'manager', 'cashier')
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.memberService.create(createMemberDto);
  }

  @Get()
  @Roles('admin', 'manager', 'cashier', 'employee')
  findAll(@StoreId() storeId?: string, @Query('keyword') keyword?: string, @Query('level') level?: MemberLevel) {
    return this.memberService.findAll({ keyword, level, storeId });
  }

  @Get(':id')
  @Roles('admin', 'manager', 'cashier', 'employee')
  findOne(@Param('id') id: string) {
    return this.memberService.findOne(id);
  }

  @Get('phone/:phone')
  @Roles('admin', 'manager', 'cashier')
  findByPhone(@Param('phone') phone: string) {
    return this.memberService.findByPhone(phone);
  }

  @Get(':id/consumptions')
  @Roles('admin', 'manager', 'cashier')
  getConsumptions(@Param('id') id: string) {
    return this.memberService.getConsumptions(id);
  }

  @Get(':id/detail')
  @Roles('admin', 'manager', 'cashier')
  getDetail(@Param('id') id: string) {
    return this.memberService.getDetail(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return this.memberService.update(id, updateMemberDto);
  }

  @Post(':id/recharge')
  @Roles('admin', 'manager', 'cashier')
  recharge(@Param('id') id: string, @Body('amount') amount: number) {
    return this.memberService.recharge(id, amount);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.memberService.remove(id);
  }
}
