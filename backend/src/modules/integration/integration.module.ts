import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationController } from './controllers/integration.controller';
import { IntegrationService } from './services/integration.service';
import { MeituanConfig, DouyinConfig, WechatConfig, ThirdPartyCoupon } from './entities/integration-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MeituanConfig,
      DouyinConfig,
      WechatConfig,
      ThirdPartyCoupon,
    ]),
  ],
  controllers: [IntegrationController],
  providers: [IntegrationService],
  exports: [IntegrationService],
})
export class IntegrationModule {}
