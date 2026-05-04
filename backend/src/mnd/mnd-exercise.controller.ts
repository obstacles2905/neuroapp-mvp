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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { MndExercise } from '../common/entity/mnd-exercise.entity';
import { CreateMndExerciseDto } from './dto/create-mnd-exercise.dto';
import { UpdateMndExerciseDto } from './dto/update-mnd-exercise.dto';
import { MndExerciseService } from './mnd-exercise.service';

@ApiTags('mnd-exercises')
@ApiBearerAuth('access-token')
@Controller('admin/mnd/exercises')
export class MndExerciseController {
  constructor(private readonly exerciseService: MndExerciseService) {}

  @Get()
  @ApiOperation({ summary: 'List MND exercises' })
  @ApiQuery({ name: 'masterStackId', required: false })
  findAll(
    @Query('masterStackId') masterStackId?: string,
  ): Promise<MndExercise[]> {
    return this.exerciseService.findAll(masterStackId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get MND exercise by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MndExercise> {
    return this.exerciseService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create MND exercise' })
  create(@Body() dto: CreateMndExerciseDto): Promise<MndExercise> {
    return this.exerciseService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update MND exercise' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMndExerciseDto,
  ): Promise<MndExercise> {
    return this.exerciseService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete MND exercise' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.exerciseService.remove(id);
  }
}
