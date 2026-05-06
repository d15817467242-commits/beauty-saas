import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CountCardService } from './count-card.service';
import { CreateCountCardPackageDto } from './dto/create-count-card-package.dto';
import { UpdateCountCardPackageDto } from './dto/update-count-card-package.dto';
import { PurchaseCountCardDto } from './dto/purchase-count-card.dto';
import { UseCountCardDto } from './dto/use-count-card.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('count-card')
@UseGuards(JwtAuthGuard)
export class CountCardController {
  constructor(private readonly countCardService: CountCardService) {}

  // ========== 次卡套餐管理 ==========

  @Post('packages')
  createPackage(@Body() dto: CreateCountCardPackageDto) {
    return this.countCardService.createPackage(dto);
  }

  @Get('packages')
  findAllPackages() {
    return this.countCardService.findAllPackages();
  }

  @Get('packages/:id')
  findPackage(@Param('id') id: string) {
    return this.countCardService.findPackage(id);
  }

  @Patch('packages/:id')
  updatePackage(@Param('id') id: string, @Body() dto: UpdateCountCardPackageDto) {
    return this.countCardService.updatePackage(id, dto);
  }

  @Delete('packages/:id')
  removePackage(@Param('id') id: string) {
    return this.countCardService.removePackage(id);
  }

  // ========== 会员次卡操作 ==========

  @Post('purchase')
  purchase(@Body() dto: PurchaseCountCardDto, @Request() req: any) {
    return this.countCardService.purchase(dto, req.user.userId);
  }

  @Get('member/:memberId')
  findByMember(@Param('memberId') memberId: string) {
    return this.countCardService.findByMember(memberId);
  }

  @Get('member-card/:id')
  findOneMemberCard(@Param('id') id: string) {
    return this.countCardService.findOneMemberCard(id);
  }

  @Post('use')
  useCountCard(@Body() dto: UseCountCardDto, @Request() req: any) {
    return this.countCardService.useCountCard(dto, req.user.userId);
  }

  @Get('available/:memberId')
  getAvailableCards(@Param('memberId') memberId: string) {
    return this.countCardService.getAvailableCards(memberId);
  }

  @Get('available/:memberId/service/:serviceId')
  getAvailableCardsForService(
    @Param('memberId') memberId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.countCardService.getAvailableCards(memberId, serviceId);
  }
}
