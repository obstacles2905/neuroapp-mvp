import { PartialType } from '@nestjs/mapped-types';
import { CreateMndSymptomDto } from './create-mnd-symptom.dto';

export class UpdateMndSymptomDto extends PartialType(CreateMndSymptomDto) {}
