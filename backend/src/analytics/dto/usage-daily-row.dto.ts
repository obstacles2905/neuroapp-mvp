import { ApiProperty } from '@nestjs/swagger';

export class UsageDailyRowDto {
  @ApiProperty({ example: '2026-06-04' })
  localDay: string;

  @ApiProperty({ description: 'Миллисекунды в приложении за день' })
  appMs: number;

  @ApiProperty({ description: 'Миллисекунды на упражнениях/уроках за день' })
  exerciseMs: number;

  @ApiProperty()
  sessionCount: number;
}
