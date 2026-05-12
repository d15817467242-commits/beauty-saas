import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Store } from './store.entity';
import { UserStore } from '../user/entities/user-store.entity';
import { User } from '../user/user.entity';
import { Member } from '../member/member.entity';
import { Employee } from '../employee/entities/employee.entity';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(UserStore)
    private userStoreRepository: Repository<UserStore>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async findAll(): Promise<any[]> {
    const stores = await this.storeRepository.find();

    const result = [];
    for (const store of stores) {
      // 关联的管理员
      const userStores = await this.userStoreRepository.find({ where: { storeId: store.id } });
      const userIds = userStores.map(us => us.userId);
      let admins: { id: string; name: string; username: string; role: string }[] = [];
      if (userIds.length > 0) {
        const users = await this.userRepository.find({ where: { id: In(userIds) } });
        admins = users
          .filter(u => u.role === 'admin' || u.role === 'superadmin')
          .map(u => ({ id: u.id, name: u.name, username: u.username, role: u.role }));
      }

      // 会员数
      const memberCount = await this.memberRepository.count({ where: { storeId: store.id } });

      // 员工数
      const employeeCount = await this.employeeRepository.count({ where: { storeId: store.id } });

      result.push({
        ...store,
        admins,
        memberCount,
        employeeCount,
      });
    }

    return result;
  }

  async findOne(id: string): Promise<any | null> {
    const store = await this.storeRepository.findOne({ where: { id } });
    if (!store) return null;

    const userStores = await this.userStoreRepository.find({ where: { storeId: id } });
    const userIds = userStores.map(us => us.userId);
    let admins: { id: string; name: string; username: string; role: string }[] = [];
    if (userIds.length > 0) {
      const users = await this.userRepository.find({ where: { id: In(userIds) } });
      admins = users
        .filter(u => u.role === 'admin' || u.role === 'superadmin')
        .map(u => ({ id: u.id, name: u.name, username: u.username, role: u.role }));
    }

    const memberCount = await this.memberRepository.count({ where: { storeId: id } });
    const employeeCount = await this.employeeRepository.count({ where: { storeId: id } });

    return { ...store, admins, memberCount, employeeCount };
  }

  async create(data: Partial<Store>): Promise<Store> {
    const store = this.storeRepository.create(data);
    return this.storeRepository.save(store);
  }

  async update(id: string, data: Partial<Store>): Promise<Store> {
    await this.storeRepository.update(id, data);
    return this.storeRepository.findOne({ where: { id } }) as Promise<Store>;
  }

  async remove(id: string): Promise<void> {
    await this.storeRepository.delete(id);
  }
}
