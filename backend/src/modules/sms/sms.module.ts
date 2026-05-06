import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsController } from './controllers/sms.controller';
import { SmsService } from './services/sms.service';
import { SmsAccount } from './entities/sms-account.entity';
import { SmsRecord } from './entities/sms-record.entity';
import { SmsTemplate } from './entities/sms-template.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SmsAccount,
      SmsRecord,
      SmsTemplate,
    ]),
  ],
  controllers: [SmsController],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
