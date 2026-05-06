import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParamSettingsController } from './controllers/param-settings.controller';
import { ParamSettingsService } from './services/param-settings.service';
import { UserGroup } from './entities/user-group.entity';
import { SystemParam } from './entities/system-param.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserGroup,
      SystemParam,
    ]),
  ],
  controllers: [ParamSettingsController],
  providers: [ParamSettingsService],
  exports: [ParamSettingsService],
})
export class ParamSettingsModule {}
