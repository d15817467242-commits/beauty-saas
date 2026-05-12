import { DataSource } from 'typeorm';
import * as path from 'path';

async function seed() {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: path.join(__dirname, '../data/meiye_saas.db'),
    entities: [path.join(__dirname, '../dist/modules/**/*.entity{.ts,.js}')],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('数据库连接成功');

  const queryRunner = dataSource.createQueryRunner();

  try {
    // ==================== 门店 ====================
    const storeCount = await queryRunner.query('SELECT COUNT(*) as c FROM store');
    if (storeCount[0].c === 0) {
      await queryRunner.query(`
        INSERT INTO store (id, name, address, phone, status, "createdAt", "updatedAt") VALUES
        ('store-001', 'SHOWBA美业旗舰店', '上海市静安区南京西路1688号', '021-62889900', 'active', datetime('now'), datetime('now')),
        ('store-002', 'SHOWBA美业分店', '上海市浦东新区陆家嘴环路1000号', '021-58887700', 'active', datetime('now'), datetime('now'))
      `);
      console.log('✅ 门店数据已插入');
    }

    // ==================== 员工 ====================
    const empCount = await queryRunner.query('SELECT COUNT(*) as c FROM employee');
    if (empCount[0].c === 0) {
      await queryRunner.query(`
        INSERT INTO employee (id, name, phone, gender, position, "storeId", status, "hireDate", "createdAt", "updatedAt") VALUES
        ('emp-001', '张美丽', '13800001001', 'female', '美容师', 'store-001', 'active', '2024-01-15', datetime('now'), datetime('now')),
        ('emp-002', '李晓芳', '13800001002', 'female', '美容师', 'store-001', 'active', '2024-03-20', datetime('now'), datetime('now')),
        ('emp-003', '王丽华', '13800001003', 'female', '高级美容师', 'store-001', 'active', '2023-06-10', datetime('now'), datetime('now')),
        ('emp-004', '赵雅琴', '13800001004', 'female', '美容师', 'store-002', 'active', '2024-05-01', datetime('now'), datetime('now')),
        ('emp-005', '陈晓梅', '13800001005', 'female', '美甲师', 'store-001', 'active', '2024-02-01', datetime('now'), datetime('now')),
        ('emp-006', '刘婷婷', '13800001006', 'female', '前台', 'store-001', 'active', '2024-04-15', datetime('now'), datetime('now')),
        ('emp-007', '周佳慧', '13800001007', 'female', '店长', 'store-001', 'active', '2023-01-01', datetime('now'), datetime('now')),
        ('emp-008', '吴思雨', '13800001008', 'female', '美容师', 'store-002', 'active', '2024-06-01', datetime('now'), datetime('now'))
      `);
      console.log('✅ 员工数据已插入');
    }

    // ==================== 会员 ====================
    const memberCount = await queryRunner.query('SELECT COUNT(*) as c FROM member');
    if (memberCount[0].c === 0) {
      await queryRunner.query(`
        INSERT INTO member (id, name, phone, gender, level, points, "totalSpent", "visitCount", "lastVisitDate", birthday, status, "storeId", "createdAt", "updatedAt") VALUES
        ('mem-001', '王小红', '13900001001', 'female', 'gold', 5200, 15800.00, 28, '2026-05-08', '1990-05-15', 'active', 'store-001', datetime('now'), datetime('now')),
        ('mem-002', '李芳芳', '13900001002', 'female', 'silver', 3100, 8900.00, 15, '2026-05-01', '1988-08-20', 'active', 'store-001', datetime('now'), datetime('now')),
        ('mem-003', '张丽丽', '13900001003', 'female', 'platinum', 12000, 45600.00, 52, '2026-05-09', '1992-03-12', 'active', 'store-001', datetime('now'), datetime('now')),
        ('mem-004', '刘美美', '13900001004', 'female', 'normal', 800, 2200.00, 5, '2026-04-10', '1995-11-08', 'active', 'store-001', datetime('now'), datetime('now')),
        ('mem-005', '陈静', '13900001005', 'female', 'gold', 6500, 22000.00, 35, '2026-05-05', '1987-06-25', 'active', 'store-002', datetime('now'), datetime('now')),
        ('mem-006', '赵雪', '13900001006', 'female', 'silver', 2800, 7500.00, 12, '2026-04-20', '1993-09-30', 'active', 'store-001', datetime('now'), datetime('now')),
        ('mem-007', '孙婷', '13900001007', 'female', 'normal', 500, 1200.00, 3, '2026-03-15', '1996-01-18', 'active', 'store-001', datetime('now'), datetime('now')),
        ('mem-008', '周敏', '13900001008', 'female', 'platinum', 15000, 58000.00, 68, '2026-05-10', '1985-04-05', 'active', 'store-002', datetime('now'), datetime('now')),
        ('mem-009', '吴佳', '13900001009', 'female', 'gold', 4800, 13500.00, 22, '2026-05-03', '1991-07-14', 'active', 'store-001', datetime('now'), datetime('now')),
        ('mem-010', '郑慧', '13900001010', 'female', 'silver', 2200, 6800.00, 10, '2026-04-28', '1994-12-22', 'active', 'store-001', datetime('now'), datetime('now')),
        ('mem-011', '黄丽', '13900001011', 'female', 'normal', 300, 800.00, 2, '2026-02-10', '1997-05-30', 'active', 'store-001', datetime('now'), datetime('now')),
        ('mem-012', '林芳', '13900001012', 'female', 'gold', 5800, 18000.00, 30, '2026-05-07', '1989-10-08', 'active', 'store-002', datetime('now'), datetime('now'))
      `);
      console.log('✅ 会员数据已插入');
    }

    // ==================== 服务项目 ====================
    const svcCount = await queryRunner.query('SELECT COUNT(*) as c FROM service');
    if (svcCount[0].c === 0) {
      await queryRunner.query(`
        INSERT INTO service (id, name, price, duration, category, description, status, "storeId", "createdAt", "updatedAt") VALUES
        ('svc-001', '面部深层清洁', 298.00, 60, 'facial', '深层清洁面部肌肤，去除污垢和角质', 'active', 'store-001', datetime('now'), datetime('now')),
        ('svc-002', '水光补水护理', 498.00, 90, 'facial', '注入水分精华，让肌肤水润透亮', 'active', 'store-001', datetime('now'), datetime('now')),
        ('svc-003', '抗衰老护理', 698.00, 120, 'facial', '紧致肌肤，减少细纹和皱纹', 'active', 'store-001', datetime('now'), datetime('now')),
        ('svc-004', '全身精油SPA', 598.00, 90, 'body', '精油按摩全身，放松身心', 'active', 'store-001', datetime('now'), datetime('now')),
        ('svc-005', '肩颈调理', 198.00, 45, 'body', '缓解肩颈疲劳，改善僵硬', 'active', 'store-001', datetime('now'), datetime('now')),
        ('svc-006', '经络疏通', 398.00, 60, 'body', '疏通经络，促进血液循环', 'active', 'store-001', datetime('now'), datetime('now')),
        ('svc-007', '日式美甲', 128.00, 60, 'nail', '精致日式美甲设计', 'active', 'store-001', datetime('now'), datetime('now')),
        ('svc-008', '光疗甲', 198.00, 90, 'nail', '持久光疗美甲', 'active', 'store-001', datetime('now'), datetime('now')),
        ('svc-009', '睫毛嫁接', 168.00, 60, 'eyelash', '自然浓密嫁接睫毛', 'active', 'store-001', datetime('now'), datetime('now')),
        ('svc-010', '半永久纹眉', 880.00, 120, 'eyebrow', '自然持久半永久纹眉', 'active', 'store-001', datetime('now'), datetime('now'))
      `);
      console.log('✅ 服务项目数据已插入');
    }

    // ==================== 服务分类 ====================
    const catCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='service_category'");
    if (catCount.length > 0) {
      const catData = await queryRunner.query('SELECT COUNT(*) as c FROM service_category');
      if (catData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO service_category (id, name, sort, status, "createdAt", "updatedAt") VALUES
          ('cat-001', '面部护理', 1, 'active', datetime('now'), datetime('now')),
          ('cat-002', '身体护理', 2, 'active', datetime('now'), datetime('now')),
          ('cat-003', '美甲美睫', 3, 'active', datetime('now'), datetime('now')),
          ('cat-004', '纹绣', 4, 'active', datetime('now'), datetime('now'))
        `);
        console.log('✅ 服务分类数据已插入');
      }
    }

    // ==================== 产品/库存 ====================
    const prodCount = await queryRunner.query('SELECT COUNT(*) as c FROM product');
    if (prodCount[0].c === 0) {
      await queryRunner.query(`
        INSERT INTO product (id, name, "sku", category, price, cost, "unit", description, status, "createdAt", "updatedAt") VALUES
        ('prod-001', '玻尿酸精华液', 'SKU-001', 'skincare', 298.00, 89.00, '瓶', '高浓度玻尿酸精华', 'active', datetime('now'), datetime('now')),
        ('prod-002', '胶原蛋白面膜', 'SKU-002', 'skincare', 158.00, 45.00, '盒', '深层补水面膜', 'active', datetime('now'), datetime('now')),
        ('prod-003', '美白防晒霜', 'SKU-003', 'skincare', 228.00, 68.00, '支', 'SPF50+防晒', 'active', datetime('now'), datetime('now')),
        ('prod-004', '精油套装', 'SKU-004', 'aromatherapy', 498.00, 150.00, '套', '薰衣草精油套装', 'active', datetime('now'), datetime('now')),
        ('prod-005', '美甲甲油胶', 'SKU-005', 'nail', 68.00, 20.00, '瓶', '持久甲油胶', 'active', datetime('now'), datetime('now')),
        ('prod-006', '睫毛胶水', 'SKU-006', 'eyelash', 88.00, 30.00, '支', '低敏嫁接胶水', 'active', datetime('now'), datetime('now')),
        ('prod-007', '洁面乳', 'SKU-007', 'skincare', 128.00, 38.00, '支', '温和氨基酸洁面', 'active', datetime('now'), datetime('now')),
        ('prod-008', '按摩精油', 'SKU-008', 'aromatherapy', 198.00, 60.00, '瓶', '全身按摩精油', 'active', datetime('now'), datetime('now'))
      `);
      console.log('✅ 产品数据已插入');
    }

    // ==================== 产品库存 ====================
    const stockCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='product_stock'");
    if (stockCount.length > 0) {
      const stockData = await queryRunner.query('SELECT COUNT(*) as c FROM product_stock');
      if (stockData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO product_stock (id, "productId", quantity, "storeId", "minStock", "createdAt", "updatedAt") VALUES
          ('ps-001', 'prod-001', 50, 'store-001', 10, datetime('now'), datetime('now')),
          ('ps-002', 'prod-002', 80, 'store-001', 20, datetime('now'), datetime('now')),
          ('ps-003', 'prod-003', 35, 'store-001', 10, datetime('now'), datetime('now')),
          ('ps-004', 'prod-004', 25, 'store-001', 5, datetime('now'), datetime('now')),
          ('ps-005', 'prod-005', 100, 'store-001', 30, datetime('now'), datetime('now')),
          ('ps-006', 'prod-006', 40, 'store-001', 10, datetime('now'), datetime('now')),
          ('ps-007', 'prod-007', 60, 'store-001', 15, datetime('now'), datetime('now')),
          ('ps-008', 'prod-008', 30, 'store-001', 5, datetime('now'), datetime('now'))
        `);
        console.log('✅ 产品库存数据已插入');
      }
    }

    // ==================== 耗材 ====================
    const consCount = await queryRunner.query('SELECT COUNT(*) as c FROM consumable');
    if (consCount[0].c === 0) {
      await queryRunner.query(`
        INSERT INTO consumable (id, name, "sku", category, "unitPrice", stock, "minStock", "unit", status, "createdAt", "updatedAt") VALUES
        ('cons-001', '一次性毛巾', 'CSKU-001', 'towel', 2.00, 500, 100, '条', 'active', datetime('now'), datetime('now')),
        ('cons-002', '化妆棉', 'CSKU-002', 'cotton', 0.50, 2000, 500, '片', 'active', datetime('now'), datetime('now')),
        ('cons-003', '手套', 'CSKU-003', 'glove', 1.00, 300, 50, '双', 'active', datetime('now'), datetime('now')),
        ('cons-004', '面膜碗', 'CSKU-004', 'tool', 5.00, 100, 20, '个', 'active', datetime('now'), datetime('now')),
        ('cons-005', '棉签', 'CSKU-005', 'cotton', 0.10, 5000, 1000, '根', 'active', datetime('now'), datetime('now'))
      `);
      console.log('✅ 耗材数据已插入');
    }

    // ==================== 供应商 ====================
    const supCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='supplier'");
    if (supCount.length > 0) {
      const supData = await queryRunner.query('SELECT COUNT(*) as c FROM supplier');
      if (supData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO supplier (id, name, contact, phone, address, status, "createdAt", "updatedAt") VALUES
          ('sup-001', '广州美妆供应链', '张经理', '020-88886666', '广州市白云区美妆大道88号', 'active', datetime('now'), datetime('now')),
          ('sup-002', '上海护肤品批发', '李总', '021-55553333', '上海市闵行区化妆品路168号', 'active', datetime('now'), datetime('now')),
          ('sup-003', '深圳美甲用品', '王经理', '0755-22224444', '深圳市南山区美甲街66号', 'active', datetime('now'), datetime('now'))
        `);
        console.log('✅ 供应商数据已插入');
      }
    }

    // ==================== 订单 ====================
    const orderCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='consumption_order'");
    if (orderCount.length > 0) {
      const orderData = await queryRunner.query('SELECT COUNT(*) as c FROM consumption_order');
      if (orderData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO consumption_order (id, "orderNo", "memberId", "employeeId", "storeId", "totalAmount", "actualAmount", "discountAmount", status, "paymentMethod", "orderDate", "createdAt", "updatedAt") VALUES
          ('order-001', 'ORD20260510001', 'mem-001', 'emp-003', 'store-001', 498.00, 448.20, 49.80, 'completed', 'cash', '2026-05-10', datetime('now'), datetime('now')),
          ('order-002', 'ORD20260509001', 'mem-003', 'emp-001', 'store-001', 1196.00, 1076.40, 119.60, 'completed', 'card', '2026-05-09', datetime('now'), datetime('now')),
          ('order-003', 'ORD20260508001', 'mem-005', 'emp-004', 'store-002', 598.00, 538.20, 59.80, 'completed', 'wechat', '2026-05-08', datetime('now'), datetime('now')),
          ('order-004', 'ORD20260507001', 'mem-002', 'emp-002', 'store-001', 298.00, 268.20, 29.80, 'completed', 'cash', '2026-05-07', datetime('now'), datetime('now')),
          ('order-005', 'ORD20260506001', 'mem-008', 'emp-003', 'store-002', 896.00, 806.40, 89.60, 'completed', 'card', '2026-05-06', datetime('now'), datetime('now')),
          ('order-006', 'ORD20260505001', 'mem-009', 'emp-001', 'store-001', 398.00, 358.20, 39.80, 'completed', 'wechat', '2026-05-05', datetime('now'), datetime('now')),
          ('order-007', 'ORD20260504001', 'mem-012', 'emp-008', 'store-002', 698.00, 628.20, 69.80, 'completed', 'cash', '2026-05-04', datetime('now'), datetime('now')),
          ('order-008', 'ORD20260503001', 'mem-006', 'emp-005', 'store-001', 326.00, 293.40, 32.60, 'completed', 'alipay', '2026-05-03', datetime('now'), datetime('now'))
        `);
        console.log('✅ 订单数据已插入');
      }
    }

    // ==================== 预约 ====================
    const aptCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='appointment'");
    if (aptCount.length > 0) {
      const aptData = await queryRunner.query('SELECT COUNT(*) as c FROM appointment');
      if (aptData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO appointment (id, "memberId", "employeeId", "serviceId", "storeId", "appointmentDate", "startTime", "endTime", status, "createdAt", "updatedAt") VALUES
          ('apt-001', 'mem-001', 'emp-003', 'svc-002', 'store-001', '2026-05-11', '10:00', '11:30', 'confirmed', datetime('now'), datetime('now')),
          ('apt-002', 'mem-003', 'emp-001', 'svc-003', 'store-001', '2026-05-11', '14:00', '16:00', 'confirmed', datetime('now'), datetime('now')),
          ('apt-003', 'mem-005', 'emp-004', 'svc-004', 'store-002', '2026-05-11', '09:00', '10:30', 'pending', datetime('now'), datetime('now')),
          ('apt-004', 'mem-009', 'emp-002', 'svc-001', 'store-001', '2026-05-12', '10:00', '11:00', 'pending', datetime('now'), datetime('now')),
          ('apt-005', 'mem-012', 'emp-008', 'svc-006', 'store-002', '2026-05-12', '14:00', '15:00', 'pending', datetime('now'), datetime('now'))
        `);
        console.log('✅ 预约数据已插入');
      }
    }

    // ==================== 营销活动 ====================
    const campCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='marketing_campaign'");
    if (campCount.length > 0) {
      const campData = await queryRunner.query('SELECT COUNT(*) as c FROM marketing_campaign');
      if (campData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO marketing_campaign (id, name, subtitle, type, status, "startTime", "endTime", "budgetAmount", "usedBudget", "totalParticipants", "totalOrders", "totalAmount", "totalDiscount", "participateLimit", "dailyLimit", "createdBy", "createdAt", "updatedAt") VALUES
          ('camp-001', '五一焕新季', '全场8折起', 'discount', 'active', '2026-05-01', '2026-05-31', 10000.00, 3500.00, 25, 30, 15000.00, 3000.00, -1, -1, 'admin-001', datetime('now'), datetime('now')),
          ('camp-002', '母亲节特惠', '带妈妈来变美', 'full_reduce', 'active', '2026-05-08', '2026-05-15', 5000.00, 1200.00, 12, 15, 8000.00, 1500.00, -1, -1, 'admin-001', datetime('now'), datetime('now')),
          ('camp-003', '新客首单立减', '首次到店享优惠', 'new_customer', 'active', '2026-01-01', '2026-12-31', 20000.00, 8500.00, 68, 75, 35000.00, 8000.00, 1, -1, 'admin-001', datetime('now'), datetime('now'))
        `);
        console.log('✅ 营销活动数据已插入');
      }
    }

    // ==================== 优惠券 ====================
    const couponCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='marketing_coupon'");
    if (couponCount.length > 0) {
      const couponData = await queryRunner.query('SELECT COUNT(*) as c FROM marketing_coupon');
      if (couponData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO marketing_coupon (id, name, type, value, "minAmount", "totalCount", "usedCount", "remainCount", status, "startTime", "endTime", "createdAt", "updatedAt") VALUES
          ('coupon-001', '满300减50', 'full_reduce', 50.00, 300.00, 100, 35, 65, 'active', '2026-05-01', '2026-05-31', datetime('now'), datetime('now')),
          ('coupon-002', '全场8折', 'discount', 8.0, 0.00, 200, 80, 120, 'active', '2026-05-01', '2026-05-31', datetime('now'), datetime('now')),
          ('coupon-003', '新客立减30', 'cash', 30.00, 0.00, 500, 150, 350, 'active', '2026-01-01', '2026-12-31', datetime('now'), datetime('now'))
        `);
        console.log('✅ 优惠券数据已插入');
      }
    }

    // ==================== 考勤 ====================
    const attCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='attendance'");
    if (attCount.length > 0) {
      const attData = await queryRunner.query('SELECT COUNT(*) as c FROM attendance');
      if (attData[0].c === 0) {
        for (let d = 1; d <= 10; d++) {
          const date = `2026-05-${String(d).padStart(2, '0')}`;
          for (const empId of ['emp-001', 'emp-002', 'emp-003', 'emp-005', 'emp-006', 'emp-007']) {
            await queryRunner.query(`
              INSERT INTO attendance (id, "employeeId", date, "checkInTime", "checkOutTime", status, "createdAt", "updatedAt") VALUES
              ('att-${empId}-${d}', '${empId}', '${date}', '09:00', '18:00', 'normal', datetime('now'), datetime('now'))
            `);
          }
        }
        console.log('✅ 考勤数据已插入');
      }
    }

    // ==================== 提成规则 ====================
    const crCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='commission_rule'");
    if (crCount.length > 0) {
      const crData = await queryRunner.query('SELECT COUNT(*) as c FROM commission_rule');
      if (crData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO commission_rule (id, name, "ruleType", "targetId", "commissionRate", "fixedAmount", "minAmount", "maxCommission", priority, "isActive", "createdAt", "updatedAt") VALUES
          ('cr-001', '面部护理提成', 'service', 'svc-001', 15.00, NULL, 0, 200, 1, 1, datetime('now'), datetime('now')),
          ('cr-002', '高端护理提成', 'service', 'svc-003', 20.00, NULL, 0, 500, 2, 1, datetime('now'), datetime('now')),
          ('cr-003', '美甲提成', 'service', 'svc-007', 25.00, NULL, 0, 100, 1, 1, datetime('now'), datetime('now')),
          ('cr-004', '全店销售提成', 'store', 'store-001', 5.00, NULL, 0, NULL, 0, 1, datetime('now'), datetime('now'))
        `);
        console.log('✅ 提成规则数据已插入');
      }
    }

    // ==================== 提成记录 ====================
    const cRecCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='commission_record'");
    if (cRecCount.length > 0) {
      const cRecData = await queryRunner.query('SELECT COUNT(*) as c FROM commission_record');
      if (cRecData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO commission_record (id, "employeeId", "orderId", "ruleId", "baseAmount", "commissionAmount", status, "createdAt", "updatedAt") VALUES
          ('crec-001', 'emp-003', 'order-001', 'cr-002', 498.00, 74.70, 'paid', datetime('now'), datetime('now')),
          ('crec-002', 'emp-001', 'order-002', 'cr-001', 498.00, 74.70, 'paid', datetime('now'), datetime('now')),
          ('crec-003', 'emp-004', 'order-003', 'cr-001', 598.00, 89.70, 'pending', datetime('now'), datetime('now')),
          ('crec-004', 'emp-002', 'order-004', 'cr-001', 298.00, 44.70, 'pending', datetime('now'), datetime('now')),
          ('crec-005', 'emp-003', 'order-005', 'cr-002', 698.00, 104.70, 'paid', datetime('now'), datetime('now')),
          ('crec-006', 'emp-005', 'order-008', 'cr-003', 128.00, 32.00, 'pending', datetime('now'), datetime('now'))
        `);
        console.log('✅ 提成记录数据已插入');
      }
    }

    // ==================== 操作日志 ====================
    const logCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='operation_log'");
    if (logCount.length > 0) {
      const logData = await queryRunner.query('SELECT COUNT(*) as c FROM operation_log');
      if (logData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO operation_log (id, "userId", "userName", module, action, detail, ip, "createdAt") VALUES
          ('log-001', 'admin-001', '管理员', 'member', 'create', '创建会员：王小红', '127.0.0.1', datetime('now')),
          ('log-002', 'admin-001', '管理员', 'order', 'create', '创建订单：ORD20260510001', '127.0.0.1', datetime('now')),
          ('log-003', 'admin-001', '管理员', 'employee', 'update', '更新员工信息：张美丽', '127.0.0.1', datetime('now')),
          ('log-004', 'admin-001', '管理员', 'marketing', 'create', '创建营销活动：五一焕新季', '127.0.0.1', datetime('now')),
          ('log-005', 'admin-001', '管理员', 'inventory', 'update', '更新库存：玻尿酸精华液', '127.0.0.1', datetime('now')),
          ('log-006', 'admin-001', '管理员', 'system', 'login', '管理员登录系统', '127.0.0.1', datetime('now'))
        `);
        console.log('✅ 操作日志数据已插入');
      }
    }

    // ==================== 备份配置 ====================
    const bkConfigCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='backup_config'");
    if (bkConfigCount.length > 0) {
      const bkConfigData = await queryRunner.query('SELECT COUNT(*) as c FROM backup_config');
      if (bkConfigData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO backup_config (id, name, type, format, "cronExpression", "isActive", "storeId", "createdBy", "createdAt", "updatedAt") VALUES
          ('bkc-001', '每日自动备份', 'auto', 'json', '0 2 * * *', 1, 'store-001', 'admin-001', datetime('now'), datetime('now')),
          ('bkc-002', '每周完整备份', 'auto', 'sql', '0 3 * * 0', 1, 'store-001', 'admin-001', datetime('now'), datetime('now'))
        `);
        console.log('✅ 备份配置数据已插入');
      }
    }

    // ==================== 备份记录 ====================
    const bkRecCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='backup_record'");
    if (bkRecCount.length > 0) {
      const bkRecData = await queryRunner.query('SELECT COUNT(*) as c FROM backup_record');
      if (bkRecData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO backup_record (id, "configId", type, format, status, "fileSize", "triggeredBy", "startedAt", "completedAt", "createdAt", "updatedAt") VALUES
          ('bkr-001', 'bkc-001', 'auto', 'json', 'completed', 2048576, 'system', datetime('now', '-1 day'), datetime('now', '-1 day'), datetime('now', '-1 day'), datetime('now', '-1 day')),
          ('bkr-002', 'bkc-002', 'auto', 'sql', 'completed', 5242880, 'system', datetime('now', '-7 day'), datetime('now', '-7 day'), datetime('now', '-7 day'), datetime('now', '-7 day'))
        `);
        console.log('✅ 备份记录数据已插入');
      }
    }

    // ==================== 库存预警 ====================
    const alertCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='stock_alert'");
    if (alertCount.length > 0) {
      const alertData = await queryRunner.query('SELECT COUNT(*) as c FROM stock_alert');
      if (alertData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO stock_alert (id, "productId", type, message, status, "createdAt", "updatedAt") VALUES
          ('sa-001', 'prod-003', 'low_stock', '美白防晒霜库存不足，当前库存35，低于安全库存50', 'pending', datetime('now'), datetime('now')),
          ('sa-002', 'prod-004', 'low_stock', '精油套装库存不足，当前库存25，低于安全库存30', 'pending', datetime('now'), datetime('now'))
        `);
        console.log('✅ 库存预警数据已插入');
      }
    }

    // ==================== 库存预警规则 ====================
    const alertRuleCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='stock_alert_rule'");
    if (alertRuleCount.length > 0) {
      const alertRuleData = await queryRunner.query('SELECT COUNT(*) as c FROM stock_alert_rule');
      if (alertRuleData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO stock_alert_rule (id, name, "minStock", "isActive", "createdAt", "updatedAt") VALUES
          ('sar-001', '护肤品低库存预警', 20, 1, datetime('now'), datetime('now')),
          ('sar-002', '美甲用品低库存预警', 30, 1, datetime('now'), datetime('now'))
        `);
        console.log('✅ 库存预警规则数据已插入');
      }
    }

    // ==================== 采购单 ====================
    const poCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='purchase_order'");
    if (poCount.length > 0) {
      const poData = await queryRunner.query('SELECT COUNT(*) as c FROM purchase_order');
      if (poData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO purchase_order (id, "orderNo", "supplierId", "storeId", status, "totalAmount", "createdBy", "createdAt", "updatedAt") VALUES
          ('po-001', 'PO20260510001', 'sup-001', 'store-001', 'pending', 5680.00, 'admin-001', datetime('now'), datetime('now')),
          ('po-002', 'PO20260509001', 'sup-002', 'store-001', 'approved', 3200.00, 'admin-001', datetime('now', '-1 day'), datetime('now', '-1 day')),
          ('po-003', 'PO20260508001', 'sup-003', 'store-001', 'completed', 1500.00, 'admin-001', datetime('now', '-3 day'), datetime('now', '-3 day'))
        `);
        console.log('✅ 采购单数据已插入');
      }
    }

    // ==================== 评价 ====================
    const reviewCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='service_review'");
    if (reviewCount.length > 0) {
      const reviewData = await queryRunner.query('SELECT COUNT(*) as c FROM service_review');
      if (reviewData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO service_review (id, "serviceId", "memberId", "orderId", rating, content, "isVisible", "createdAt", "updatedAt") VALUES
          ('rev-001', 'svc-002', 'mem-001', 'order-001', 5, '水光补水效果很好，皮肤变得水润了', 1, datetime('now'), datetime('now')),
          ('rev-002', 'svc-003', 'mem-003', 'order-002', 5, '抗衰老护理非常专业，效果明显', 1, datetime('now'), datetime('now')),
          ('rev-003', 'svc-004', 'mem-005', 'order-003', 4, '精油SPA很舒服，就是时间可以再长一点', 1, datetime('now'), datetime('now')),
          ('rev-004', 'svc-001', 'mem-002', 'order-004', 4, '面部清洁很到位，下次还来', 1, datetime('now'), datetime('now')),
          ('rev-005', 'svc-006', 'mem-008', 'order-005', 5, '经络疏通后整个人都轻松了', 1, datetime('now'), datetime('now'))
        `);
        console.log('✅ 评价数据已插入');
      }
    }

    // ==================== 员工排班 ====================
    const schedCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='employee_schedule'");
    if (schedCount.length > 0) {
      const schedData = await queryRunner.query('SELECT COUNT(*) as c FROM employee_schedule');
      if (schedData[0].c === 0) {
        for (let d = 10; d <= 16; d++) {
          const date = `2026-05-${String(d).padStart(2, '0')}`;
          for (const empId of ['emp-001', 'emp-002', 'emp-003', 'emp-005']) {
            await queryRunner.query(`
              INSERT INTO employee_schedule (id, "employeeId", date, "shiftType", "startTime", "endTime", status, "createdAt", "updatedAt") VALUES
              ('sched-${empId}-${d}', '${empId}', '${date}', 'morning', '09:00', '17:00', 'scheduled', datetime('now'), datetime('now'))
            `);
          }
        }
        console.log('✅ 员工排班数据已插入');
      }
    }

    // ==================== 财务记录 ====================
    const finCount = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table' AND name='finance_record'");
    if (finCount.length > 0) {
      const finData = await queryRunner.query('SELECT COUNT(*) as c FROM finance_record');
      if (finData[0].c === 0) {
        await queryRunner.query(`
          INSERT INTO finance_record (id, type, category, amount, description, "storeId", "orderNo", "createdAt", "updatedAt") VALUES
          ('fin-001', 'income', 'service', 498.00, '水光补水护理', 'store-001', 'ORD20260510001', datetime('now'), datetime('now')),
          ('fin-002', 'income', 'service', 1196.00, '抗衰老护理+面部清洁', 'store-001', 'ORD20260509001', datetime('now', '-1 day'), datetime('now', '-1 day')),
          ('fin-003', 'income', 'service', 598.00, '全身精油SPA', 'store-002', 'ORD20260508001', datetime('now', '-2 day'), datetime('now', '-2 day')),
          ('fin-004', 'expense', 'rent', 15000.00, '5月门店租金', 'store-001', NULL, datetime('now', '-5 day'), datetime('now', '-5 day')),
          ('fin-005', 'expense', 'salary', 28000.00, '4月员工工资', 'store-001', NULL, datetime('now', '-3 day'), datetime('now', '-3 day')),
          ('fin-006', 'expense', 'purchase', 5680.00, '护肤品采购', 'store-001', 'PO20260510001', datetime('now'), datetime('now')),
          ('fin-007', 'income', 'product', 890.00, '产品销售', 'store-001', NULL, datetime('now', '-1 day'), datetime('now', '-1 day')),
          ('fin-008', 'income', 'service', 698.00, '抗衰老护理', 'store-002', 'ORD20260504001', datetime('now', '-4 day'), datetime('now', '-4 day'))
        `);
        console.log('✅ 财务记录数据已插入');
      }
    }

    console.log('\n🎉 测试数据注入完成！');

  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

seed().catch(err => {
  console.error('数据注入失败:', err);
  process.exit(1);
});
