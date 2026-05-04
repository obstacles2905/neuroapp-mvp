import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  MAX_CATEGORY_TAG_LENGTH,
  MAX_CATEGORY_TAGS,
} from '../../common/constants/category-tags.constants';
import { CategoryCatalogAudience } from '../../common/enums/category-catalog-audience.enum';
import { LocalizedTextDto } from './localized-text.dto';

export class CreateCategoryDto {
  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title: LocalizedTextDto;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description: LocalizedTextDto;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({
    enum: CategoryCatalogAudience,
    default: CategoryCatalogAudience.PRODUCTION,
    description:
      'production — в основном каталоге приложения; experimental — тест/закрытый запуск',
  })
  @IsOptional()
  @IsEnum(CategoryCatalogAudience)
  catalogAudience?: CategoryCatalogAudience;

  @ApiPropertyOptional({
    description:
      'Опциональный ключ для фичефлага (приложение решает, кому показывать experimental)',
    example: 'beta_category_sleep',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  catalogFeatureFlagKey?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Теги категории (уникальны без учёта регистра)',
    example: ['сон', 'стресс'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_CATEGORY_TAGS)
  @IsString({ each: true })
  @MaxLength(MAX_CATEGORY_TAG_LENGTH, { each: true })
  tags?: string[];
}
