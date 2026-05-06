import { PartialType } from '@nestjs/mapped-types';
import { CreateServicePackageDto, CreatePackageItemDto } from './create-service-package.dto';

export class UpdateServicePackageDto extends PartialType(CreateServicePackageDto) {}
export class UpdatePackageItemDto extends PartialType(CreatePackageItemDto) {}
