import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStore } from './entities/user-store.entity';
import { Store } from '../store/store.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserStore)
    private userStoreRepository: Repository<UserStore>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  // 查询待审核用户（isActive = '0' 的员工）
  async findPending(): Promise<any[]> {
    const users = await this.userRepository.find({
      where: { isActive: '0' },
      select: ['id', 'username', 'name', 'phone', 'role', 'createdAt'],
    });
    return users;
  }

  // 审核通过：激活帐号 + 设置角色 + 分配门店
  async approve(userId: string, role: string, storeId?: string): Promise<User> {
    const updateData: any = { isActive: '1', role };
    if (storeId) updateData.storeId = storeId;
    await this.userRepository.update(userId, updateData);
    if (storeId) {
      await this.addUserStore(userId, storeId);
    }
    return (await this.userRepository.findOne({ where: { id: userId } }))!;
  }

  // 审核拒绝：删除帐号
  async reject(userId: string): Promise<void> {
    await this.userRepository.delete(userId);
  }

  async findAll(storeId?: string): Promise<any[]> {
    const where: any = {};
    if (storeId) where.storeId = storeId;

    const users = await this.userRepository.find({
      where,
      select: ['id', 'username', 'name', 'phone', 'avatar', 'role', 'storeId', 'isActive', 'createdAt'],
    });

    // 为每个用户附加关联门店信息
    const result = [];
    for (const user of users) {
      const userStores = await this.userStoreRepository.find({ where: { userId: user.id } });
      const storeIds = userStores.map(us => us.storeId);
      let stores: { id: string; name: string }[] = [];
      if (storeIds.length > 0) {
        const storeEntities = await this.storeRepository.find({ where: { id: In(storeIds) } });
        stores = storeEntities.map(s => ({ id: s.id, name: s.name }));
      }
      result.push({
        ...user,
        stores,
      });
    }

    return result;
  }

  async findOne(id: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return null;

    const userStores = await this.userStoreRepository.find({ where: { userId: id } });
    const storeIds = userStores.map(us => us.storeId);
    let stores: { id: string; name: string }[] = [];
    if (storeIds.length > 0) {
      const storeEntities = await this.storeRepository.find({ where: { id: In(storeIds) } });
      stores = storeEntities.map(s => ({ id: s.id, name: s.name }));
    }

    return { ...user, stores };
  }

  async create(dto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const updateData: any = { ...dto };
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }
    await this.userRepository.update(id, updateData);
    return this.userRepository.findOne({ where: { id } }) as Promise<User>;
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async addUserStore(userId: string, storeId: string): Promise<void> {
    const existing = await this.userStoreRepository.findOne({
      where: { userId, storeId },
    });
    if (!existing) {
      await this.userStoreRepository.save(
        this.userStoreRepository.create({ userId, storeId }),
      );
    }
  }

  async removeUserStore(userId: string, storeId: string): Promise<void> {
    await this.userStoreRepository.delete({ userId, storeId });
  }

  async setUserStores(userId: string, storeIds: string[]): Promise<void> {
    // 先删除所有旧的关联
    await this.userStoreRepository.delete({ userId });
    // 再批量新增
    for (const storeId of storeIds) {
      await this.userStoreRepository.save(
        this.userStoreRepository.create({ userId, storeId }),
      );
    }
  }

  async getUserStores(userId: string): Promise<{ id: string; name: string }[]> {
    const userStores = await this.userStoreRepository.find({ where: { userId } });
    const storeIds = userStores.map(us => us.storeId);
    if (storeIds.length === 0) return [];
    const stores = await this.storeRepository.find({ where: { id: In(storeIds) } });
    return stores.map(s => ({ id: s.id, name: s.name }));
  }
}
