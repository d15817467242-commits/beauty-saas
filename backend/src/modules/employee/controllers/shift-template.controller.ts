import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ShiftTemplateService } from '../services/shift-template.service';
import { CreateShiftTemplateDto, UpdateShiftTemplateDto } from '../dto/shift-template.dto';

@Controller('employees/shift-templates')
export class ShiftTemplateController {
  constructor(private readonly service: ShiftTemplateService) {}

  @Post()
  create(@Body() dto: CreateShiftTemplateDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('isActive') isActive?: boolean) {
    return this.service.findAll(isActive);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShiftTemplateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
