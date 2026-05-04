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
import { MndMatrixRule } from '../common/entity/mnd-matrix-rule.entity';
import { CreateMndMatrixRuleDto } from './dto/create-mnd-matrix-rule.dto';
import { UpdateMndMatrixRuleDto } from './dto/update-mnd-matrix-rule.dto';
import { MndMatrixRuleService } from './mnd-matrix-rule.service';

@ApiTags('mnd-matrix-rules')
@ApiBearerAuth('access-token')
@Controller('admin/mnd/matrix-rules')
export class MndMatrixRuleController {
  constructor(private readonly ruleService: MndMatrixRuleService) {}

  @Get()
  @ApiOperation({ summary: 'List MND matrix rules' })
  findAll(): Promise<MndMatrixRule[]> {
    return this.ruleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get MND matrix rule by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MndMatrixRule> {
    return this.ruleService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create MND matrix rule' })
  create(@Body() dto: CreateMndMatrixRuleDto): Promise<MndMatrixRule> {
    return this.ruleService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update MND matrix rule' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMndMatrixRuleDto,
  ): Promise<MndMatrixRule> {
    return this.ruleService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete MND matrix rule' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.ruleService.remove(id);
  }
}
