import { IsString, IsOptional, IsBoolean, IsNumber, IsObject, IsEnum, IsArray, MaxLength, Min, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageTemplateType, MessageTemplateScene, MessageTemplateStatus, MessageVariable } from '../message-template.entity';

export { MessageTemplateType, MessageTemplateScene, MessageTemplateStatus, MessageVariable };

export class CreateMessageTemplateDto {
  @IsOptional()
  @IsString()
  storeId?: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(50)
  code: string;

  @IsEnum(MessageTemplateType)
  type: MessageTemplateType;

  @IsEnum(MessageTemplateScene)
  scene: MessageTemplateScene;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  variables?: MessageVariable[];

  @IsOptional()
  @IsEnum(MessageTemplateStatus)
  status?: MessageTemplateStatus;

  @IsOptional()
  @IsString()
  thirdPartyId?: string;

  @IsOptional()
  @IsString()
  thirdPartyCode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  extra?: Record<string, any>;
}

export class UpdateMessageTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  variables?: MessageVariable[];

  @IsOptional()
  @IsEnum(MessageTemplateStatus)
  status?: MessageTemplateStatus;

  @IsOptional()
  @IsString()
  thirdPartyId?: string;

  @IsOptional()
  @IsString()
  thirdPartyCode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  extra?: Record<string, any>;
}

export class CreateSmsConfigDto {
  @IsOptional()
  @IsString()
  storeId?: string;

  @IsString()
  @MaxLength(50)
  name: string;

  @IsString()
  provider: string;

  @IsString()
  accessKeyId: string;

  @IsString()
  accessKeySecret: string;

  @IsOptional()
  @IsString()
  signName?: string;

  @IsOptional()
  @IsString()
  regionId?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateSmsConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  accessKeyId?: string;

  @IsOptional()
  @IsString()
  accessKeySecret?: string;

  @IsOptional()
  @IsString()
  signName?: string;

  @IsOptional()
  @IsString()
  regionId?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateWechatConfigDto {
  @IsOptional()
  @IsString()
  storeId?: string;

  @IsString()
  @MaxLength(50)
  name: string;

  @IsString()
  appId: string;

  @IsString()
  appSecret: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  subscribeTemplateId?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateWechatConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  appId?: string;

  @IsOptional()
  @IsString()
  appSecret?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  subscribeTemplateId?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class RenderMessageTemplateDto {
  @IsObject()
  data: Record<string, any>;
}

export class CopyMessageTemplateDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(50)
  code: string;
}

export class SendSmsDto {
  @IsString()
  phone: string;

  @IsString()
  templateId: string;

  @IsObject()
  data: Record<string, any>;
}

export class SendWechatDto {
  @IsString()
  openId: string;

  @IsString()
  templateId: string;

  @IsObject()
  data: Record<string, any>;
}
