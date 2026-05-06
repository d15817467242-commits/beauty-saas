import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageTemplate, SmsConfig, WechatTemplateConfig } from './message-template.entity';
import { MessageTemplateService } from './message-template.service';
import { MessageTemplateController } from './message-template.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MessageTemplate, SmsConfig, WechatTemplateConfig])],
  controllers: [MessageTemplateController],
  providers: [MessageTemplateService],
  exports: [MessageTemplateService],
})
export class MessageTemplateModule {}
