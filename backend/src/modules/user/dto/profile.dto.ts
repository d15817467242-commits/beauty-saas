import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6, { message: '旧密码至少6位' })
  oldPassword: string;

  @IsString()
  @MinLength(6, { message: '新密码至少6位' })
  @MaxLength(20, { message: '新密码最多20位' })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}

export class UpdateThemeDto {
  @IsOptional()
  @IsString()
  theme?: 'light' | 'dark' | 'auto';

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  fontSize?: 'small' | 'medium' | 'large';

  @IsOptional()
  layout?: 'side' | 'top';
}

export class UserSettings {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  layout: 'side' | 'top';
  language: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}
