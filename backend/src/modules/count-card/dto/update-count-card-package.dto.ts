import { PartialType } from '@nestjs/mapped-types';
import { CreateCountCardPackageDto } from './create-count-card-package.dto';

export class UpdateCountCardPackageDto extends PartialType(CreateCountCardPackageDto) {}
