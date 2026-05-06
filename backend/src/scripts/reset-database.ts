/**
 * 数据库重置脚本
 * 删除所有表并重新创建
 * 
 * 使用方法：
 * npx ts-node -r tsconfig-paths/register src/scripts/reset-database.ts
 * 
 * 警告：此操作会删除所有数据！
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

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

async function dropAllTables(queryRunner: any) {
  console.log('删除所有表...');
  
  // 获取所有表名
  const tables = await queryRunner.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
  `);
  
  // 删除所有外键约束
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
  
  // 删除所有表
  for (const table of tables) {
    try {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`);
    } catch (e) {
      console.log(`删除表 ${table.tablename} 失败:`, e.message);
    }
  }
  
  // 删除所有枚举类型
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
  
  console.log('所有表已删除！');
}

async function main() {
  console.log('========================================');
  console.log('数据库重置脚本');
  console.log('========================================');
  console.log(`数据库: ${process.env.DB_DATABASE || 'meiye_saas'}`);
  console.log(`主机: ${process.env.DB_HOST || 'localhost'}`);
  console.log('========================================');
  console.log('警告：此操作将删除所有数据！');
  console.log('========================================');
  
  // 确认操作
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise<string>((resolve) => {
    rl.question('确定要重置数据库吗？(yes/no): ', resolve);
  });
  
  rl.close();
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('操作已取消');
    process.exit(0);
  }
  
  let queryRunner;
  
  try {
    // 连接数据库
    await dataSource.initialize();
    console.log('数据库连接成功！');
    
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    
    // 开始事务
    await queryRunner.startTransaction();
    
    // 删除所有表
    await dropAllTables(queryRunner);
    
    // 提交事务
    await queryRunner.commitTransaction();
    
    console.log('========================================');
    console.log('数据库重置完成！');
    console.log('请运行 npm run db:init 重新创建表');
    console.log('========================================');
    
  } catch (error) {
    console.error('重置失败:', error);
    
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
