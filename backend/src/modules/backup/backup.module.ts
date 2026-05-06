import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupConfig, BackupRecord } from './backup.entity';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([BackupConfig, BackupRecord])],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}
