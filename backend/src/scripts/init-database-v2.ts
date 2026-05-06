/**
 * 数据库初始化脚本 V2
 * 使用 TypeORM 的 synchronize 功能创建正确的表结构
 * 
 * 使用方法：
 * npx ts-node -r tsconfig-paths/register src/scripts/init-database-v2.ts
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// 导入所有实体
const entities = [
  require('../modules/user/user.entity').User,
  require('../modules/auth/role.entity').Role,
  require('../modules/member/member.entity').Member,
  require('../modules/member/member-card.entity').MemberCard,
  require('../modules/employee/entities/employee.entity').Employee,
  require('../modules/service/service.entity').Service,
  require('../modules/service/service-category.entity').ServiceCategory,
  require('../modules/count-card/count-card-package.entity').CountCardPackage,
  require('../modules/count-card/member-count-card.entity').MemberCountCard,
  require('../modules/cashier/consumption.entity').Consumption,
  require('../modules/appointment/entities/appointment.entity').Appointment,
  require('../modules/system-config/system-config.entity').SystemConfig,
  require('../modules/operation-log/operation-log.entity').OperationLog,
  require('../modules/backup/backup.entity').Backup,
  require('../modules/payment-config/payment-config.entity').PaymentConfig,
  require('../modules/print-template/print-template.entity').PrintTemplate,
  require('../modules/message-template/message-template.entity').MessageTemplate,
  require('../modules/miniapp/miniapp-user.entity').MiniappUser,
  require('../modules/store/store.entity').Store,
];

// 创建数据源
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'meiye_saas',
  entities: entities,
  synchronize: true,  // 使用 synchronize 创建正确的表结构
  logging: true,
  dropSchema: true,  // 先删除现有表
});

async function insertDefaultData(queryRunner: any) {
  console.log('插入默认数据...');
  
  // 插入默认角色
  const roleRepo = dataSource.getRepository('Role');
  const rolesCount = await roleRepo.count();
  
  if (rolesCount === 0) {
    await roleRepo.save([
      { code: 'admin', name: '管理员', description: '系统管理员，拥有所有权限', permissions: ['member:view','member:create','member:update','member:delete','employee:view','employee:create','employee:update','employee:delete','service:view','service:create','service:update','service:delete','count_card:view','count_card:create','count_card:update','count_card:delete','cashier:use','report:view','system:settings'], isActive: true },
      { code: 'manager', name: '店长', description: '店长角色', permissions: ['member:view','member:create','member:update','employee:view','service:view','service:update','count_card:view','count_card:create','cashier:use','report:view'], isActive: true },
      { code: 'receptionist', name: '前台', description: '前台接待角色', permissions: ['member:view','member:create','member:update','service:view','count_card:view','cashier:use'], isActive: true },
      { code: 'stylist', name: '发型师', description: '发型师角色', permissions: ['member:view','service:view'], isActive: true },
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
  
  console.log('默认数据插入完成！');
}

async function main() {
  console.log('========================================');
  console.log('数据库初始化脚本 V2');
  console.log('========================================');
  console.log(`数据库: ${process.env.DB_DATABASE || 'meiye_saas'}`);
  console.log(`主机: ${process.env.DB_HOST || 'localhost'}`);
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
    await insertDefaultData(dataSource.createQueryRunner());
    
    console.log('========================================');
    console.log('数据库初始化完成！');
    console.log('========================================');
    console.log('请记得将 app.module.ts 中的 synchronize 改回 false');
    
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
