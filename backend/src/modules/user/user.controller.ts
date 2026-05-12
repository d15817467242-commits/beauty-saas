import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ForbiddenException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { StoreId } from '../../common/decorators/store-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: any) {
    if (user.role !== 'superadmin' && user.role !== 'admin' && user.role !== 'manager') {
      throw new ForbiddenException('无权创建用户');
    }
    return this.userService.create(createUserDto);
  }

  // ===== 员工审核 =====

  @Get('pending')
  async findPending(@CurrentUser() user: any) {
    if (user.role !== 'superadmin' && user.role !== 'admin' && user.role !== 'manager') {
      throw new ForbiddenException('无权查看待审核帐号');
    }
    return this.userService.findPending();
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body() body: { role: string; storeId?: string },
    @CurrentUser() user: any,
  ) {
    if (user.role !== 'superadmin' && user.role !== 'admin' && user.role !== 'manager') {
      throw new ForbiddenException('无权审核帐号');
    }
    return this.userService.approve(id, body.role, body.storeId);
  }

  @Delete(':id/reject')
  async reject(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.role !== 'superadmin' && user.role !== 'admin' && user.role !== 'manager') {
      throw new ForbiddenException('无权拒绝帐号');
    }
    await this.userService.reject(id);
    return { message: '已拒绝该注册申请' };
  }

  // ===== 通用 CRUD =====

  @Get()
  findAll(@StoreId() storeId?: string, @CurrentUser() user?: any) {
    if (user?.role === 'superadmin') {
      return this.userService.findAll();
    }
    return this.userService.findAll(storeId || undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Patch(':id/stores')
  async updateStores(
    @Param('id') id: string,
    @Body() body: { storeIds: string[] },
    @CurrentUser() user: any,
  ) {
    if (user.role !== 'superadmin' && user.role !== 'admin') {
      throw new ForbiddenException('无权修改门店关联');
    }
    await this.userService.setUserStores(id, body.storeIds);
    return this.userService.findOne(id);
  }

  @Get(':id/stores')
  async getStores(@Param('id') id: string) {
    return this.userService.getUserStores(id);
  }
}