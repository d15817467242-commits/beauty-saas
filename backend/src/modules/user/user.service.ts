import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });
    
    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }
    
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'username', 'name', 'phone', 'avatar', 'role', 'isActive', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'name', 'phone', 'avatar', 'role', 'isActive', 'createdAt'],
    });
    
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  // 重置密码（忘记密码功能）
  async resetPassword(dto: { username: string; newPassword: string; phone?: string }): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { username: dto.username } });
    
    if (!user) {
      throw new NotFoundException('用户名不存在');
    }
    
    // 如果提供了手机号，验证是否匹配
    if (dto.phone && user.phone && user.phone !== dto.phone) {
      throw new BadRequestException('手机号与注册手机号不一致');
    }
    
    // 更新密码
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);
    
    return { message: '密码重置成功，请使用新密码登录' };
  }
}
