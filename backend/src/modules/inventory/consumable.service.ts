import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consumable, ServiceConsumable, ConsumableMovement, ConsumableMovementType } from './consumable.entity';
import { 
  CreateConsumableDto, 
  UpdateConsumableDto, 
  CreateConsumableMovementDto, 
  CreateServiceConsumableDto 
} from './dto/consumable.dto';

@Injectable()
export class ConsumableService {
  constructor(
    @InjectRepository(Consumable)
    private consumableRepository: Repository<Consumable>,
    @InjectRepository(ServiceConsumable)
    private serviceConsumableRepository: Repository<ServiceConsumable>,
    @InjectRepository(ConsumableMovement)
    private consumableMovementRepository: Repository<ConsumableMovement>,
  ) {}

  // 创建耗材
  async create(dto: CreateConsumableDto): Promise<Consumable> {
    const consumable = this.consumableRepository.create(dto);
    return this.consumableRepository.save(consumable);
  }

  // 获取耗材列表
  async findAll(category?: string): Promise<Consumable[]> {
    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }
    return this.consumableRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  // 获取单个耗材
  async findOne(id: string): Promise<Consumable> {
    const consumable = await this.consumableRepository.findOne({ where: { id } });
    if (!consumable) {
      throw new NotFoundException('耗材不存在');
    }
    return consumable;
  }

  // 更新耗材
  async update(id: string, dto: UpdateConsumableDto): Promise<Consumable> {
    const consumable = await this.findOne(id);
    Object.assign(consumable, dto);
    return this.consumableRepository.save(consumable);
  }

  // 删除耗材
  async remove(id: string): Promise<void> {
    const consumable = await this.findOne(id);
    consumable.isActive = false;
    await this.consumableRepository.save(consumable);
  }

  // 库存变动
  async createMovement(dto: CreateConsumableMovementDto, userId: string): Promise<ConsumableMovement> {
    const consumable = await this.findOne(dto.consumableId);
    const beforeStock = consumable.stock;
    let afterStock = beforeStock;
    
    switch (dto.movementType) {
      case ConsumableMovementType.IN:
        afterStock = beforeStock + dto.quantity;
        break;
      case ConsumableMovementType.OUT:
      case ConsumableMovementType.WASTE:
        if (beforeStock < dto.quantity) {
          throw new BadRequestException('库存不足');
        }
        afterStock = beforeStock - dto.quantity;
        break;
      case ConsumableMovementType.ADJUST:
        afterStock = dto.quantity;
        break;
    }
    
    // 更新库存
    consumable.stock = afterStock;
    await this.consumableRepository.save(consumable);
    
    // 创建变动记录
    const movement = this.consumableMovementRepository.create({
      ...dto,
      beforeStock,
      afterStock,
      createdBy: userId,
    });
    
    return this.consumableMovementRepository.save(movement);
  }

  // 服务消耗耗材（在服务消费时自动调用）
  async consumeForService(
    serviceId: string,
    consumptionId: string,
    userId: string,
  ): Promise<ConsumableMovement[]> {
    // 获取服务关联的耗材
    const serviceConsumables = await this.serviceConsumableRepository.find({
      where: { serviceId },
      relations: ['consumable'],
    });
    
    const movements: ConsumableMovement[] = [];
    
    for (const sc of serviceConsumables) {
      const consumable = sc.consumable;
      const quantity = sc.quantity;
      
      if (consumable.stock < quantity) {
        console.warn(`耗材 ${consumable.name} 库存不足，当前库存: ${consumable.stock}, 需要: ${quantity}`);
        continue;
      }
      
      const beforeStock = consumable.stock;
      const afterStock = beforeStock - quantity;
      
      // 更新库存
      consumable.stock = afterStock;
      await this.consumableRepository.save(consumable);
      
      // 创建变动记录
      const movement = this.consumableMovementRepository.create({
        consumableId: consumable.id,
        movementType: ConsumableMovementType.OUT,
        quantity,
        beforeStock,
        afterStock,
        unitPrice: consumable.costPrice,
        serviceId,
        consumptionId,
        createdBy: userId,
      });
      movements.push(await this.consumableMovementRepository.save(movement));
    }
    
    return movements;
  }

  // 设置服务耗材
  async setServiceConsumable(dto: CreateServiceConsumableDto): Promise<ServiceConsumable> {
    // 检查是否已存在
    const existing = await this.serviceConsumableRepository.findOne({
      where: { serviceId: dto.serviceId, consumableId: dto.consumableId },
    });
    
    if (existing) {
      existing.quantity = dto.quantity;
      if (dto.remark !== undefined) {
        existing.remark = dto.remark;
      }
      return this.serviceConsumableRepository.save(existing);
    }
    
    const serviceConsumable = this.serviceConsumableRepository.create(dto);
    return this.serviceConsumableRepository.save(serviceConsumable);
  }

  // 获取服务的耗材列表
  async getServiceConsumables(serviceId: string): Promise<ServiceConsumable[]> {
    return this.serviceConsumableRepository.find({
      where: { serviceId },
      relations: ['consumable'],
    });
  }

  // 删除服务耗材
  async removeServiceConsumable(serviceId: string, consumableId: string): Promise<void> {
    const sc = await this.serviceConsumableRepository.findOne({
      where: { serviceId, consumableId },
    });
    if (sc) {
      await this.serviceConsumableRepository.remove(sc);
    }
  }

  // 获取耗材变动记录
  async getMovements(consumableId?: string): Promise<ConsumableMovement[]> {
    const where: any = {};
    if (consumableId) {
      where.consumableId = consumableId;
    }
    return this.consumableMovementRepository.find({
      where,
      relations: ['consumable'],
      order: { createdAt: 'DESC' },
    });
  }

  // 获取库存预警耗材
  async getLowStockConsumables(): Promise<Consumable[]> {
    return this.consumableRepository
      .createQueryBuilder('c')
      .where('c.isActive = :isActive', { isActive: true })
      .andWhere('c.stock <= c.warningStock')
      .getMany();
  }
}
