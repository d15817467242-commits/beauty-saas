import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenseKey } from './license.entity';
import { User } from '../user/user.entity';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LicenseKey, User])],
  controllers: [LicenseController],
  providers: [LicenseService],
  exports: [LicenseService],
})
export class LicenseModule {}
