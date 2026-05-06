import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftTemplate } from '../entities/shift-template.entity';
import { CreateShiftTemplateDto, UpdateShiftTemplateDto } from '../dto/shift-template.dto';

@Injectable()
export class ShiftTemplateService {
  constructor(
    @InjectRepository(ShiftTemplate)
    private shiftTemplateRepository: Repository<ShiftTemplate>,
  ) {}

  async create(dto: CreateShiftTemplateDto): Promise<ShiftTemplate> {
    const shift = this.shiftTemplateRepository.create(dto);
    return this.shiftTemplateRepository.save(shift);
  }

  async findAll(isActive?: boolean): Promise<ShiftTemplate[]> {
    const query = this.shiftTemplateRepository.createQueryBuilder('shift');
    
    if (isActive !== undefined) {
      query.where('shift.isActive = :isActive', { isActive });
    }
    
    return query.orderBy('shift.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<ShiftTemplate> {
    const shift = await this.shiftTemplateRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException('班次模板不存在');
    }
    return shift;
  }

  async update(id: string, dto: UpdateShiftTemplateDto): Promise<ShiftTemplate> {
    const shift = await this.findOne(id);
    Object.assign(shift, dto);
    return this.shiftTemplateRepository.save(shift);
  }

  async remove(id: string): Promise<void> {
    const shift = await this.findOne(id);
    await this.shiftTemplateRepository.remove(shift);
  }
}
