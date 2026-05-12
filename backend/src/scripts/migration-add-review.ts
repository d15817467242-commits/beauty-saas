import * as path from 'path';

const DB_PATH = path.resolve(__dirname, '../../data/meiye_saas.db');

function migrate() {
  // 动态导入 better-sqlite3
  const Database = require('better-sqlite3');
  const db = new Database(DB_PATH);

  try {
    // 获取现有列
    const columns = db.pragma('table_info(consumptions)');
    const columnNames = (columns as any[]).map((c: any) => c.name);

    const newColumns = [
      { name: 'review_status', sql: "ALTER TABLE consumptions ADD COLUMN review_status TEXT DEFAULT 'pending'" },
      { name: 'reviewed_by', sql: 'ALTER TABLE consumptions ADD COLUMN reviewed_by TEXT' },
      { name: 'reviewed_at', sql: 'ALTER TABLE consumptions ADD COLUMN reviewed_at TEXT' },
    ];

    for (const col of newColumns) {
      if (!columnNames.includes(col.name)) {
        console.log(`添加列: ${col.name}`);
        db.exec(col.sql);
        console.log(`✅ ${col.name} 添加成功`);
      } else {
        console.log(`⏭️ 列 ${col.name} 已存在，跳过`);
      }
    }

    console.log('\n✅ 审核字段迁移完成！');
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

migrate();
