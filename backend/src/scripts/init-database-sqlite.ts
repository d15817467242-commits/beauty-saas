/**
 * SQLite 数据库初始化脚本
 * 使用 TypeORM 的 synchronize 功能创建正确的表结构
 * 
 * 使用方法：
 * npx ts-node -r tsconfig-paths/register src/scripts/init-database-sqlite.ts
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// 确保 data 目录存在
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('已创建 data 目录');
}

// 创建数据源 (SQLite) - 使用通配符自动加载所有实体
const dbPath = process.env.DB_DATABASE || './data/meiye_saas.db';
const dataSource = new DataSource({
  type: 'better-sqlite3',
  database: dbPath,
  entities: [path.join(__dirname, '../modules/**/*.entity{.ts,.js}')],
  synchronize: true,  // 使用 synchronize 创建正确的表结构
  logging: true,
  dropSchema: true,  // 先删除现有表
});

async function insertDefaultData() {
  console.log('插入默认数据...');
  
  // 插入默认角色
  const roleRepo = dataSource.getRepository('Role');
  const rolesCount = await roleRepo.count();
  
  if (rolesCount === 0) {
    await roleRepo.save([
      { code: 'admin', name: '管理员', description: '系统管理员，拥有所有权限', permissions: JSON.stringify(['member:view','member:create','member:update','member:delete','employee:view','employee:create','employee:update','employee:delete','service:view','service:create','service:update','service:delete','count_card:view','count_card:create','count_card:update','count_card:delete','cashier:use','report:view','system:settings']), isActive: true },
      { code: 'manager', name: '店长', description: '店长角色', permissions: JSON.stringify(['member:view','member:create','member:update','employee:view','service:view','service:update','count_card:view','count_card:create','cashier:use','report:view']), isActive: true },
      { code: 'receptionist', name: '前台', description: '前台接待角色', permissions: JSON.stringify(['member:view','member:create','member:update','service:view','count_card:view','cashier:use']), isActive: true },
      { code: 'stylist', name: '发型师', description: '发型师角色', permissions: JSON.stringify(['member:view','service:view']), isActive: true },
    ]);
    console.log('默认角色已插入');
  }
  
  // 插入默认门店
  const storeRepo = dataSource.getRepository('Store');
  const storesCount = await storeRepo.count();
  
  if (storesCount === 0) {
    await storeRepo.save({
      code: 'HQ',
      name: '总店',
      status: 'active',
      isHeadquarters: true,
    });
    console.log('默认门店已插入');
  }
  
  // 插入超级管理员用户
  const userRepo = dataSource.getRepository('User');
  const usersCount = await userRepo.count();

  if (usersCount === 0) {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('showba0714', 10);

    const adminRole = await roleRepo.findOne({ where: { code: 'admin' } });

    await userRepo.save({
      username: 'beyond0714',
      password: hashedPassword,
      name: '超级管理员',
      phone: '13397242689',
      role: 'admin',
      roleId: adminRole?.id,
      isActive: true,
    });
    console.log('超级管理员已插入 (用户名: beyond0714, 密码: showba0714)');
  }

  // 插入初始密钥
  const licenseRepo = dataSource.getRepository('LicenseKey');
  const licenseCount = await licenseRepo.count();

  if (licenseCount === 0) {
    await licenseRepo.save({
      key: 'SHOWBA-TEST-KEY1',
      status: 'unused',
      remark: '初始测试密钥',
    });
    console.log('初始密钥已插入 (SHOWBA-TEST-KEY1)');
  }
  
  // 插入服务分类
  const categoryRepo = dataSource.getRepository('ServiceCategoryEntity');
  const categoriesCount = await categoryRepo.count();
  
  if (categoriesCount === 0) {
    await categoryRepo.save([
      { name: '美发', code: 'hair', sort: 1, isActive: true },
      { name: '剪发', code: 'hair-cut', sort: 2, isActive: true },
      { name: '染发', code: 'hair-dye', sort: 3, isActive: true },
      { name: '烫发', code: 'hair-perm', sort: 4, isActive: true },
      { name: '美容', code: 'beauty', sort: 5, isActive: true },
      { name: '美甲', code: 'nail', sort: 6, isActive: true },
      { name: '其他', code: 'other', sort: 7, isActive: true }
    ]);
    console.log('服务分类已插入');
  }
  
  console.log('默认数据插入完成！');
}

async function main() {
  console.log('========================================');
  console.log('SQLite 数据库初始化脚本');
  console.log('========================================');
  console.log(`数据库文件: ${path.resolve(dbPath)}`);
  console.log('========================================');
  console.log('警告：此操作将删除所有现有数据！');
  console.log('========================================');
  
  try {
    // 连接数据库
    await dataSource.initialize();
    console.log('数据库连接成功！');
    console.log('正在创建表结构...');
    
    // synchronize 会自动创建所有表
    // dropSchema: true 会先删除现有表
    
    console.log('表结构创建完成！');
    
    // 插入默认数据
    await insertDefaultData();
    
    console.log('========================================');
    console.log('数据库初始化完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// 执行主函数
main();
