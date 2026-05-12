/**
 * 增量迁移：为 consumptions 表添加 merged_to 和 cancelled_at 字段
 * 用于支持合单标记和订单取消功能
 *
 * 使用方法：
 * npx ts-node -r tsconfig-paths/register src/scripts/migration-add-merge-cancel.ts
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

async function main() {
  const dbType = process.env.DB_TYPE || 'better-sqlite3';

  const dsConfig: any = dbType === 'better-sqlite3'
    ? {
        type: 'better-sqlite3',
        database: process.env.DB_DATABASE || './data/meiye_saas.db',
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'meiye_saas',
      };

  const dataSource = new DataSource(dsConfig);

  try {
    await dataSource.initialize();
    console.log(`数据库连接成功 (${dbType})`);

    const queryRunner = dataSource.createQueryRunner();

    if (dbType === 'better-sqlite3') {
      // SQLite: 用 pragma 查表结构
      const columns: any[] = await queryRunner.query(`PRAGMA table_info(consumptions)`);
      const colNames = columns.map((c: any) => c.name);

      if (!colNames.includes('merged_to')) {
        await queryRunner.query(`ALTER TABLE consumptions ADD COLUMN merged_to varchar NULL`);
        console.log('已添加 merged_to 字段');
      } else {
        console.log('merged_to 字段已存在，跳过');
      }

      if (!colNames.includes('cancelled_at')) {
        await queryRunner.query(`ALTER TABLE consumptions ADD COLUMN cancelled_at datetime NULL`);
        console.log('已添加 cancelled_at 字段');
      } else {
        console.log('cancelled_at 字段已存在，跳过');
      }
    } else {
      // PostgreSQL
      const tableInfo = await queryRunner.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'consumptions' AND column_name IN ('merged_to', 'cancelled_at')
      `);
      const colNames = tableInfo.map((row: any) => row.column_name);

      if (!colNames.includes('merged_to')) {
        await queryRunner.query(`ALTER TABLE consumptions ADD COLUMN merged_to varchar NULL`);
        console.log('已添加 merged_to 字段');
      } else {
        console.log('merged_to 字段已存在，跳过');
      }

      if (!colNames.includes('cancelled_at')) {
        await queryRunner.query(`ALTER TABLE consumptions ADD COLUMN cancelled_at timestamp NULL`);
        console.log('已添加 cancelled_at 字段');
      } else {
        console.log('cancelled_at 字段已存在，跳过');
      }
    }

    console.log('迁移完成！');
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

main();
