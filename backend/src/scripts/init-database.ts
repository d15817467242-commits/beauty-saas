/**
 * 数据库初始化脚本
 * 用于手动创建所有数据库表，解决 synchronize: false 导致表不存在的问题
 * 
 * 使用方法：
 * npx ts-node -r tsconfig-paths/register src/scripts/init-database.ts
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// 创建数据源
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'meiye_saas',
  synchronize: false,
  logging: true,
});

// 表创建顺序（按依赖关系排序）
const tableCreationOrder = [
  // 1. 基础表（无外键依赖）
  'roles',
  'stores',
  'store_configs',
  'users',
  
  // 2. 会员相关
  'members',
  'member_cards',
  
  // 3. 员工相关
  'employees',
  'employee_roles',
  'employee_services',
  'permissions',
  'commission_rules',
  'commission_records',
  'attendance_rules',
  'attendances',
  'shift_templates',
  'work_schedules',
  'training_courses',
  'trainings',
  
  // 4. 服务相关
  'service_categories',
  'services',
  'service_packages',
  'package_items',
  'service_reviews',
  
  // 5. 次卡相关
  'count_card_packages',
  'member_count_cards',
  
  // 6. 收银相关
  'consumptions',
  'credits',
  'coupons',
  'coupon_verifications',
  'discounts',
  'documents',
  'product_categories',
  'products',
  'warehouses',
  'service_categories_cashier',
  
  // 7. 预约相关
  'appointments',
  'appointment_reminders',
  'appointment_reviews',
  'queues',
  'queue_items',
  'schedules',
  'appointment_configs',
  'business_hours',
  
  // 8. 营销相关
  'coupons_marketing',
  'coupon_usages',
  'flash_sales',
  'group_buys',
  'marketing_campaigns',
  'member_tasks',
  'newbie_gifts',
  'points_mall',
  'referrals',
  
  // 9. 库存相关
  'consumables',
  'products_inventory',
  'purchases',
  'stock_alerts',
  'stock_costs',
  'stock_takes',
  'stock_transfers',
  'suppliers',
  
  // 10. 报表相关
  'customer_analyses',
  'daily_reports',
  'employee_performances',
  'monthly_reports',
  'sales_targets',
  'targets',
  
  // 11. 系统配置相关
  'system_configs',
  'operation_logs',
  'backups',
  'miniapp_users',
  'payment_configs',
  'print_templates',
  'message_templates',
  
  // 12. 数据设置相关
  'departments',
  'positions',
  'price_strategies',
  'product_specs',
  'product_units',
  'stores_data_settings',
  'warehouses_data_settings',
  
  // 13. 库存和收支相关
  'stock_checks',
  'stock_ins',
  'stock_movements',
  'stock_outs',
  'stock_transfers_stock',
  'suppliers_stock',
  'expense_categories',
  'store_expenses',
  
  // 14. 其他功能模块
  'integration_configs',
  'rooms',
  'rooms_other',
  'system_params',
  'user_groups',
  'sms_accounts',
  'sms_records',
  'sms_templates',
  'gifts',
];

async function dropExistingTables(queryRunner: any) {
  console.log('检查并删除现有表...');
  
  // 删除整个 public schema 并重建
  try {
    await queryRunner.query(`DROP SCHEMA public CASCADE`);
    await queryRunner.query(`CREATE SCHEMA public`);
    await queryRunner.query(`GRANT ALL ON SCHEMA public TO postgres`);
    await queryRunner.query(`GRANT ALL ON SCHEMA public TO public`);
    console.log('已删除并重建 public schema');
  } catch (e) {
    console.log('删除 schema 失败，尝试逐个删除表:', e.message);
    
    // 备用方案：逐个删除
    const constraints = await queryRunner.query(`
      SELECT conname, conrelid::regclass AS table_name
      FROM pg_constraint 
      WHERE contype = 'f' 
      AND connamespace = 'public'::regnamespace
    `);
    
    for (const constraint of constraints) {
      try {
        await queryRunner.query(`ALTER TABLE "${constraint.table_name}" DROP CONSTRAINT IF EXISTS "${constraint.conname}"`);
      } catch (e) {
        // 忽略错误
      }
    }
    
    const tables = await queryRunner.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    for (const table of tables) {
      try {
        await queryRunner.query(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`);
        console.log(`已删除表: ${table.tablename}`);
      } catch (e) {
        console.log(`删除表 ${table.tablename} 失败:`, e.message);
      }
    }
    
    const enums = await queryRunner.query(`
      SELECT typname FROM pg_type 
      WHERE typnamespace = 'public'::regnamespace 
      AND typtype = 'e'
    `);
    
    for (const enumType of enums) {
      try {
        await queryRunner.query(`DROP TYPE IF EXISTS "${enumType.typname}" CASCADE`);
      } catch (e) {
        // 忽略错误
      }
    }
  }
  
  console.log('现有表清理完成！');
}

async function createTables(queryRunner: any) {
  console.log('开始创建表...');
  
  // 创建扩展插件
  await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  
  // 1. roles 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "roles" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "code" VARCHAR(255) UNIQUE NOT NULL,
      "name" VARCHAR(255) NOT NULL,
      "description" VARCHAR(255),
      "permissions" JSONB,
      "is_active" BOOLEAN DEFAULT true,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  
  // 2. stores 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "stores" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "code" VARCHAR(255) UNIQUE NOT NULL,
      "name" VARCHAR(255) NOT NULL,
      "logo" VARCHAR(255),
      "phone" VARCHAR(255),
      "email" VARCHAR(255),
      "province" VARCHAR(255),
      "city" VARCHAR(255),
      "district" VARCHAR(255),
      "address" VARCHAR(255),
      "longitude" DECIMAL(10, 7),
      "latitude" DECIMAL(10, 7),
      "business_hours" VARCHAR(255),
      "description" TEXT,
      "status" VARCHAR(50) DEFAULT 'active',
      "is_headquarters" BOOLEAN DEFAULT true,
      "parent_id" UUID,
      "manager_id" UUID,
      "manager_name" VARCHAR(255),
      "max_employees" INTEGER DEFAULT 0,
      "max_appointments" INTEGER DEFAULT 0,
      "config" JSONB,
      "extra" JSONB,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  
  // 3. store_configs 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "store_configs" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "store_id" UUID NOT NULL,
      "key" VARCHAR(255) UNIQUE NOT NULL,
      "value" TEXT NOT NULL,
      "description" VARCHAR(255),
      "type" VARCHAR(255),
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  
  // 4. users 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "username" VARCHAR(255) UNIQUE NOT NULL,
      "password" VARCHAR(255) NOT NULL,
      "name" VARCHAR(255) NOT NULL,
      "phone" VARCHAR(255),
      "avatar" VARCHAR(255),
      "role" VARCHAR(50) DEFAULT 'employee',
      "role_id" UUID,
      "is_active" BOOLEAN DEFAULT true,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "FK_user_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL
    )
  `);
  
  // 5. members 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "members" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "name" VARCHAR(255) NOT NULL,
      "phone" VARCHAR(255) UNIQUE NOT NULL,
      "gender" VARCHAR(255),
      "birthday" DATE,
      "remark" VARCHAR(255),
      "level" VARCHAR(50) DEFAULT 'normal',
      "points" INTEGER DEFAULT 0,
      "balance" DECIMAL(10, 2) DEFAULT 0,
      "count_cards" JSONB,
      "last_visit_at" DATE,
      "total_spent" DECIMAL(10, 2) DEFAULT 0,
      "visit_count" INTEGER DEFAULT 0,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  
  // 6. member_cards 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "member_cards" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "member_id" UUID NOT NULL,
      "card_no" VARCHAR(255) NOT NULL,
      "name" VARCHAR(255) NOT NULL,
      "card_type" VARCHAR(50) DEFAULT 'balance',
      "status" VARCHAR(50) DEFAULT 'active',
      "balance" DECIMAL(10, 2) DEFAULT 0,
      "initial_balance" DECIMAL(10, 2),
      "expire_date" DATE,
      "remark" VARCHAR(255),
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "FK_member_card_member" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE
    )
  `);
  
  // 7. employees 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "employees" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "name" VARCHAR(255) NOT NULL,
      "employee_no" VARCHAR(255) UNIQUE NOT NULL,
      "phone" VARCHAR(255),
      "position" VARCHAR(255),
      "hire_date" DATE,
      "status" VARCHAR(50) DEFAULT 'active',
      "avatar" VARCHAR(255),
      "commission_type" VARCHAR(50) DEFAULT 'percent',
      "commission_value" DECIMAL(5, 2),
      "base_commission_rate" DECIMAL(5, 2),
      "tiered_commission_rules" JSONB,
      "service_commission_rules" JSONB,
      "total_sales" DECIMAL(10, 2) DEFAULT 0,
      "total_commission" DECIMAL(10, 2) DEFAULT 0,
      "base_salary" DECIMAL(10, 2),
      "bonus" DECIMAL(10, 2),
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  
  // 8. service_categories 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "service_categories" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "name" VARCHAR(255) NOT NULL,
      "code" VARCHAR(255),
      "description" TEXT,
      "icon" VARCHAR(255),
      "image" VARCHAR(255),
      "sort" INTEGER DEFAULT 0,
      "is_active" BOOLEAN DEFAULT true,
      "parent_id" UUID,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  
  // 9. services 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "services" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "name" VARCHAR(255) NOT NULL,
      "code" VARCHAR(255),
      "category" VARCHAR(50) DEFAULT 'hair',
      "category_id" UUID,
      "price" DECIMAL(10, 2) NOT NULL,
      "member_price" DECIMAL(10, 2),
      "commission_rate" DECIMAL(10, 2),
      "fixed_commission" DECIMAL(10, 2),
      "duration" INTEGER,
      "description" TEXT,
      "images" TEXT,
      "notice" TEXT,
      "is_active" BOOLEAN DEFAULT true,
      "sort" INTEGER DEFAULT 0,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "FK_service_category" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE SET NULL
    )
  `);
  
  // 10. count_card_packages 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "count_card_packages" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "name" VARCHAR(255) NOT NULL,
      "code" VARCHAR(255),
      "count" INTEGER NOT NULL,
      "gift_count" INTEGER,
      "price" DECIMAL(10, 2) NOT NULL,
      "valid_days" INTEGER,
      "validity_months" INTEGER,
      "image" VARCHAR(255),
      "applicable_services" JSONB,
      "description" VARCHAR(255),
      "is_active" BOOLEAN DEFAULT true,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  
  // 11. member_count_cards 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "member_count_cards" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "member_id" UUID NOT NULL,
      "package_id" UUID NOT NULL,
      "order_no" VARCHAR(255) NOT NULL,
      "total_count" INTEGER NOT NULL,
      "remaining_count" INTEGER NOT NULL,
      "purchase_price" DECIMAL(10, 2) NOT NULL,
      "expire_date" DATE,
      "status" VARCHAR(50) DEFAULT 'active',
      "usage_records" JSONB,
      "created_by" UUID NOT NULL,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "FK_member_count_card_member" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_member_count_card_package" FOREIGN KEY ("package_id") REFERENCES "count_card_packages"("id") ON DELETE CASCADE
    )
  `);
  
  // 12. consumptions 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "consumptions" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "order_no" VARCHAR(255) UNIQUE NOT NULL,
      "manual_order_no" VARCHAR(255),
      "warehouse_id" UUID,
      "member_id" UUID,
      "consumption_type" VARCHAR(50) DEFAULT 'service',
      "amount" DECIMAL(10, 2) NOT NULL,
      "total_amount" DECIMAL(10, 2),
      "actual_amount" DECIMAL(10, 2) NOT NULL,
      "discount_amount" DECIMAL(10, 2) NOT NULL,
      "cost_amount" DECIMAL(10, 2),
      "discount_type" VARCHAR(50) DEFAULT 'none',
      "payment_method" VARCHAR(50) DEFAULT 'cash',
      "payment_detail" JSONB,
      "items" JSONB,
      "employee_id" UUID,
      "commission" DECIMAL(10, 2),
      "service_commission" DECIMAL(10, 2),
      "product_commission" DECIMAL(10, 2),
      "commission_type" VARCHAR(255),
      "card_id" UUID,
      "old_card_id" UUID,
      "new_card_id" UUID,
      "points_earned" INTEGER DEFAULT 0,
      "points_used" INTEGER DEFAULT 0,
      "remark" VARCHAR(255),
      "created_by" UUID NOT NULL,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "FK_consumption_member" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL,
      CONSTRAINT "FK_consumption_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL,
      CONSTRAINT "FK_consumption_card" FOREIGN KEY ("card_id") REFERENCES "member_cards"("id") ON DELETE SET NULL,
      CONSTRAINT "FK_consumption_old_card" FOREIGN KEY ("old_card_id") REFERENCES "member_cards"("id") ON DELETE SET NULL,
      CONSTRAINT "FK_consumption_new_card" FOREIGN KEY ("new_card_id") REFERENCES "member_cards"("id") ON DELETE SET NULL
    )
  `);
  
  // 13. appointments 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "appointments" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "member_id" UUID,
      "service_id" UUID,
      "employee_id" UUID,
      "appointment_time" TIMESTAMP NOT NULL,
      "end_time" TIMESTAMP,
      "status" VARCHAR(50) DEFAULT 'pending',
      "remark" VARCHAR(255),
      "source" VARCHAR(50) DEFAULT 'manual',
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "FK_appointment_member" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL,
      CONSTRAINT "FK_appointment_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL,
      CONSTRAINT "FK_appointment_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL
    )
  `);
  
  // 14. system_configs 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "system_configs" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "key" VARCHAR(255) UNIQUE NOT NULL,
      "value" TEXT NOT NULL,
      "description" VARCHAR(255),
      "group" VARCHAR(255),
      "type" VARCHAR(255),
      "is_public" BOOLEAN DEFAULT true,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  
  // 15. operation_logs 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "operation_logs" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "user_id" UUID,
      "action" VARCHAR(255) NOT NULL,
      "module" VARCHAR(255),
      "target" VARCHAR(255),
      "detail" JSONB,
      "ip" VARCHAR(255),
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  
  // 16. backups 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "backups" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "filename" VARCHAR(255) NOT NULL,
      "path" VARCHAR(255) NOT NULL,
      "size" BIGINT NOT NULL,
      "type" VARCHAR(50) DEFAULT 'manual',
      "status" VARCHAR(50) DEFAULT 'completed',
      "created_by" UUID,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  
  // 17. payment_configs 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "payment_configs" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "type" VARCHAR(50) NOT NULL,
      "name" VARCHAR(255) NOT NULL,
      "config" JSONB NOT NULL,
      "is_active" BOOLEAN DEFAULT true,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  
  // 18. print_templates 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "print_templates" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "name" VARCHAR(255) NOT NULL,
      "type" VARCHAR(50) NOT NULL,
      "content" TEXT NOT NULL,
      "is_default" BOOLEAN DEFAULT false,
      "is_active" BOOLEAN DEFAULT true,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  
  // 19. message_templates 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "message_templates" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "name" VARCHAR(255) NOT NULL,
      "type" VARCHAR(50) NOT NULL,
      "content" TEXT NOT NULL,
      "variables" JSONB,
      "is_active" BOOLEAN DEFAULT true,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  
  // 20. miniapp_users 表
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "miniapp_users" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "openid" VARCHAR(255) UNIQUE NOT NULL,
      "unionid" VARCHAR(255),
      "member_id" UUID,
      "nickname" VARCHAR(255),
      "avatar" VARCHAR(255),
      "phone" VARCHAR(255),
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "FK_miniapp_user_member" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL
    )
  `);
  
  console.log('基础表创建完成！');
}

async function createIndexes(queryRunner: any) {
  console.log('创建索引...');
  
  // member_count_cards 索引
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS "IDX_member_count_cards_member_status" 
    ON "member_count_cards" ("member_id", "status")
  `);
  
  console.log('索引创建完成！');
}

async function insertDefaultData(queryRunner: any) {
  console.log('插入默认数据...');
  
  // 检查是否已有默认角色
  const rolesCount = await queryRunner.query(`SELECT COUNT(*) FROM "roles"`);
  
  if (parseInt(rolesCount[0].count) === 0) {
    // 插入默认角色
    await queryRunner.query(`
      INSERT INTO "roles" ("code", "name", "description", "permissions", "is_active") VALUES
      ('admin', '管理员', '系统管理员，拥有所有权限', '["member:view","member:create","member:update","member:delete","employee:view","employee:create","employee:update","employee:delete","service:view","service:create","service:update","service:delete","count_card:view","count_card:create","count_card:update","count_card:delete","cashier:use","report:view","system:settings"]', true),
      ('manager', '店长', '店长角色', '["member:view","member:create","member:update","employee:view","service:view","service:update","count_card:view","count_card:create","cashier:use","report:view"]', true),
      ('receptionist', '前台', '前台接待角色', '["member:view","member:create","member:update","service:view","count_card:view","cashier:use"]', true),
      ('stylist', '发型师', '发型师角色', '["member:view","service:view"]', true)
    `);
    console.log('默认角色已插入');
  }
  
  // 检查是否已有默认门店
  const storesCount = await queryRunner.query(`SELECT COUNT(*) FROM "stores"`);
  
  if (parseInt(storesCount[0].count) === 0) {
    // 插入默认门店
    await queryRunner.query(`
      INSERT INTO "stores" ("code", "name", "status", "is_headquarters") VALUES
      ('HQ', '总店', 'active', true)
    `);
    console.log('默认门店已插入');
  }
  
  console.log('默认数据插入完成！');
}

async function main() {
  console.log('========================================');
  console.log('数据库初始化脚本');
  console.log('========================================');
  console.log(`数据库: ${process.env.DB_DATABASE || 'meiye_saas'}`);
  console.log(`主机: ${process.env.DB_HOST || 'localhost'}`);
  console.log('========================================');
  
  let queryRunner;
  
  try {
    // 连接数据库
    await dataSource.initialize();
    console.log('数据库连接成功！');
    
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    
    // 开始事务
    await queryRunner.startTransaction();
    
    // 先删除现有表
    await dropExistingTables(queryRunner);
    
    // 创建表
    await createTables(queryRunner);
    
    // 创建索引
    await createIndexes(queryRunner);
    
    // 插入默认数据
    await insertDefaultData(queryRunner);
    
    // 提交事务
    await queryRunner.commitTransaction();
    
    console.log('========================================');
    console.log('数据库初始化完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('初始化失败:', error);
    
    if (queryRunner) {
      await queryRunner.rollbackTransaction();
    }
    
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// 执行主函数
main();
