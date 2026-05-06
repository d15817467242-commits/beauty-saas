import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { Product, ProductStock, StockMovement, StockWarning, StockMovementType } from './product.entity';
import { CreateProductDto, UpdateProductDto, CreateStockMovementDto, UpdateStockWarningDto } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductStock)
    private productStockRepository: Repository<ProductStock>,
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(StockWarning)
    private stockWarningRepository: Repository<StockWarning>,
  ) {}

  // 创建产品
  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(dto);
    const savedProduct = await this.productRepository.save(product);
    
    // 创建库存记录
    const stock = this.productStockRepository.create({
      productId: savedProduct.id,
      quantity: 0,
      warningQuantity: 10,
      maxQuantity: 1000,
    });
    await this.productStockRepository.save(stock);
    
    return savedProduct;
  }

  // 获取产品列表
  async findAll(category?: string): Promise<Product[]> {
    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }
    return this.productRepository.find({
      where,
      relations: ['stock'],
      order: { name: 'ASC' },
    });
  }

  // 获取单个产品
  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['stock'],
    });
    if (!product) {
      throw new NotFoundException('产品不存在');
    }
    return product;
  }

  // 更新产品
  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  // 删除产品
  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.productRepository.save(product);
  }

  // 库存变动
  async createStockMovement(dto: CreateStockMovementDto, userId: string): Promise<StockMovement> {
    const product = await this.findOne(dto.productId);
    const stock = await this.productStockRepository.findOne({
      where: { productId: dto.productId },
    });
    
    if (!stock) {
      throw new NotFoundException('库存记录不存在');
    }
    
    const beforeQuantity = stock.quantity;
    let afterQuantity = beforeQuantity;
    
    switch (dto.movementType) {
      case StockMovementType.IN:
      case StockMovementType.RETURN:
        afterQuantity = beforeQuantity + dto.quantity;
        break;
      case StockMovementType.OUT:
      case StockMovementType.ADJUST:
        if (dto.movementType === StockMovementType.OUT && beforeQuantity < dto.quantity) {
          throw new BadRequestException('库存不足');
        }
        afterQuantity = dto.movementType === StockMovementType.ADJUST 
          ? dto.quantity 
          : beforeQuantity - dto.quantity;
        break;
    }
    
    // 更新库存
    stock.quantity = afterQuantity;
    await this.productStockRepository.save(stock);
    
    // 创建变动记录
    const movement = this.stockMovementRepository.create({
      ...dto,
      beforeQuantity,
      afterQuantity,
      totalAmount: dto.unitPrice ? dto.quantity * dto.unitPrice : undefined,
      createdBy: userId,
    });
    const savedMovement = await this.stockMovementRepository.save(movement);
    
    // 检查库存预警
    if (afterQuantity <= stock.warningQuantity) {
      await this.createStockWarning(dto.productId, afterQuantity, stock.warningQuantity);
    }
    
    return savedMovement;
  }

  // 创建库存预警
  private async createStockWarning(
    productId: string,
    currentQuantity: number,
    warningQuantity: number,
  ): Promise<StockWarning> {
    // 检查是否已有未处理的预警
    const existingWarning = await this.stockWarningRepository.findOne({
      where: { productId, isHandled: false },
    });
    
    if (existingWarning) {
      existingWarning.currentQuantity = currentQuantity;
      return this.stockWarningRepository.save(existingWarning);
    }
    
    const warning = this.stockWarningRepository.create({
      productId,
      currentQuantity,
      warningQuantity,
    });
    return this.stockWarningRepository.save(warning);
  }

  // 获取库存预警列表
  async getStockWarnings(handled?: boolean): Promise<StockWarning[]> {
    const where: any = {};
    if (handled !== undefined) {
      where.isHandled = handled;
    }
    return this.stockWarningRepository.find({
      where,
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  // 处理库存预警
  async handleStockWarning(id: string, remark: string, userId: string): Promise<StockWarning> {
    const warning = await this.stockWarningRepository.findOne({
      where: { id },
    });
    if (!warning) {
      throw new NotFoundException('预警记录不存在');
    }
    
    warning.isHandled = true;
    warning.handleTime = new Date();
    warning.handleBy = userId;
    warning.handleRemark = remark;
    
    return this.stockWarningRepository.save(warning);
  }

  // 更新库存预警设置
  async updateStockWarning(productId: string, dto: UpdateStockWarningDto): Promise<ProductStock> {
    const stock = await this.productStockRepository.findOne({
      where: { productId },
    });
    if (!stock) {
      throw new NotFoundException('库存记录不存在');
    }
    
    stock.warningQuantity = dto.warningQuantity;
    if (dto.maxQuantity) {
      stock.maxQuantity = dto.maxQuantity;
    }
    
    return this.productStockRepository.save(stock);
  }

  // 获取库存变动记录
  async getStockMovements(productId?: string): Promise<StockMovement[]> {
    const where: any = {};
    if (productId) {
      where.productId = productId;
    }
    return this.stockMovementRepository.find({
      where,
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }
}
