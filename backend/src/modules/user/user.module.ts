import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { UserSetting } from './entities/user-setting.entity';
import { UserProfileService } from './services/user-profile.service';
import { UserProfileController } from './controllers/user-profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSetting])],
  controllers: [UserController, UserProfileController],
  providers: [UserService, UserProfileService],
  exports: [UserService, UserProfileService],
})
export class UserModule {}
