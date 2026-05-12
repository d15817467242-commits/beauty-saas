import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

// 模块
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MemberModule } from './modules/member/member.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { ServiceModule } from './modules/service/service.module';
import { CashierModule } from './modules/cashier/cashier.module';
import { ReportModule } from './modules/report/report.module';
import { CountCardModule } from './modules/count-card/count-card.module';
import { ReminderModule } from './modules/reminder/reminder.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

// 新增模块
import { MiniappModule } from './modules/miniapp/miniapp.module';
import { OperationLogModule } from './modules/operation-log/operation-log.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { BackupModule } from './modules/backup/backup.module';

// 系统配置增强模块
import { StoreModule } from './modules/store/store.module';
import { PaymentConfigModule } from './modules/payment-config/payment-config.module';
import { PrintTemplateModule } from './modules/print-template/print-template.module';
import { MessageTemplateModule } from './modules/message-template/message-template.module';
import { DataSettingsModule } from './modules/data-settings/data-settings.module';

// 库存和收支模块
import { StockModule } from './modules/stock/stock.module';
import { ExpenseModule } from './modules/expense/expense.module';

// 新增功能模块
import { ParamSettingsModule } from './modules/param-settings/param-settings.module';
import { SmsModule } from './modules/sms/sms.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { RoomModule } from './modules/room/room.module';
import { OtherModule } from './modules/other/other.module';
import { CommissionModule } from './modules/commission/commission.module';
import { RouteAliasModule } from './modules/route-aliases/route-alias.module';
import { RouteAliasNewModule } from './modules/route-aliases/route-alias-new.module';
import { LicenseModule } from './modules/license/license.module';

// 守卫
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // 数据库连接 (支持SQLite和PostgreSQL)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get('DB_TYPE', 'postgres');

        if (dbType === 'better-sqlite3') {
          return {
            type: 'better-sqlite3',
            database: configService.get('DB_DATABASE', './data/meiye_saas.db'),
            entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
            synchronize: false,
            logging: false,
            entitySkipConstructor: true,
            enableWAL: true,
          };
        }

        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', 'postgres'),
          database: configService.get('DB_DATABASE', 'meiye_saas'),
          entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
          synchronize: false,
            logging: false,
        };
      },
      inject: [ConfigService],
    }),

    // JWT配置
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'meiye-saas-secret-key'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
      global: true,
    }),

    // 业务模块
    AuthModule,
    UserModule,
    MemberModule,
    EmployeeModule,
    ServiceModule,
    CashierModule,
    ReportModule,
    CountCardModule,
    ReminderModule,
    AppointmentModule,
    MarketingModule,
    InventoryModule,
    DashboardModule,

    // 新增模块
    MiniappModule,
    OperationLogModule,
    SystemConfigModule,
    BackupModule,

    // 系统配置增强模块
    StoreModule,
    PaymentConfigModule,
    PrintTemplateModule,
    MessageTemplateModule,
    DataSettingsModule,

    // 库存和收支模块
    StockModule,
    ExpenseModule,

    // 新增功能模块
    ParamSettingsModule,
    SmsModule,
    IntegrationModule,
    RoomModule,
    OtherModule,
    CommissionModule,
    RouteAliasModule,
    RouteAliasNewModule,
    LicenseModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
