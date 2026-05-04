import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MndSymptom } from '../common/entity/mnd-symptom.entity';
import { CreateMndSymptomDto } from './dto/create-mnd-symptom.dto';
import { UpdateMndSymptomDto } from './dto/update-mnd-symptom.dto';
import { MndSymptomService } from './mnd-symptom.service';

@ApiTags('mnd-symptoms')
@ApiBearerAuth('access-token')
@Controller('admin/mnd/symptoms')
export class MndSymptomController {
  constructor(private readonly symptomService: MndSymptomService) {}

  @Get()
  @ApiOperation({ summary: 'List MND symptoms' })
  findAll(): Promise<MndSymptom[]> {
    return this.symptomService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get MND symptom by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MndSymptom> {
    return this.symptomService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create MND symptom' })
  create(@Body() dto: CreateMndSymptomDto): Promise<MndSymptom> {
    return this.symptomService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update MND symptom' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMndSymptomDto,
  ): Promise<MndSymptom> {
    return this.symptomService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete MND symptom' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.symptomService.remove(id);
  }
}
