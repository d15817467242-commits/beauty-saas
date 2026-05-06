import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintTemplate, PrintTemplateVariable } from './print-template.entity';
import { PrintTemplateService } from './print-template.service';
import { PrintTemplateController } from './print-template.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PrintTemplate, PrintTemplateVariable])],
  controllers: [PrintTemplateController],
  providers: [PrintTemplateService],
  exports: [PrintTemplateService],
})
export class PrintTemplateModule {}
