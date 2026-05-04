import { PartialType } from '@nestjs/mapped-types';
import { CreateMndMatrixRuleDto } from './create-mnd-matrix-rule.dto';

export class UpdateMndMatrixRuleDto extends PartialType(
  CreateMndMatrixRuleDto,
) {}
