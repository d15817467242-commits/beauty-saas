import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ServicePackageService } from './service-package.service';
import { CreateServicePackageDto, CreatePackageItemDto } from './dto/create-service-package.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';
import { PackageStatus } from './service-package.entity';

@Controller('packages')
export class PackageAliasController {
  constructor(private readonly packageService: ServicePackageService) {}

  @Get()
  findAll(
    @Query('status') status?: PackageStatus,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.packageService.findAll(status, includeInactive === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packageService.findOne(id);
  }
}

@Controller('service-packages')
export class ServicePackageController {
  constructor(private readonly packageService: ServicePackageService) {}

  @Post()
  create(@Body() createPackageDto: CreateServicePackageDto) {
    return this.packageService.create(createPackageDto);
  }

  @Get()
  findAll(
    @Query('status') status?: PackageStatus,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.packageService.findAll(status, includeInactive === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packageService.findOne(id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.packageService.findByCode(code);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePackageDto: UpdateServicePackageDto) {
    return this.packageService.update(id, updatePackageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.packageService.remove(id);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.packageService.publish(id);
  }

  @Patch(':id/offline')
  offline(@Param('id') id: string) {
    return this.packageService.offline(id);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.packageService.toggleActive(id);
  }

  // 套餐项目管理
  @Get(':id/items')
  getItems(@Param('id') id: string) {
    return this.packageService.getItems(id);
  }

  @Post(':id/items')
  addItem(
    @Param('id') id: string,
    @Body() itemDto: CreatePackageItemDto,
  ) {
    return this.packageService.addItem(id, itemDto);
  }

  @Patch('items/:itemId')
  updateItem(
    @Param('itemId') itemId: string,
    @Body() itemDto: Partial<CreatePackageItemDto>,
  ) {
    return this.packageService.updateItem(itemId, itemDto);
  }

  @Delete('items/:itemId')
  removeItem(@Param('itemId') itemId: string) {
    return this.packageService.removeItem(itemId);
  }
}
