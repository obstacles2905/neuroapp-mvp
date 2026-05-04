import { PartialType } from '@nestjs/mapped-types';
import { CreateMndMasterStackDto } from './create-mnd-master-stack.dto';

export class UpdateMndMasterStackDto extends PartialType(
  CreateMndMasterStackDto,
) {}
