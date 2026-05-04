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
import { MndMasterStack } from '../common/entity/mnd-master-stack.entity';
import { CreateMndMasterStackDto } from './dto/create-mnd-master-stack.dto';
import { UpdateMndMasterStackDto } from './dto/update-mnd-master-stack.dto';
import { MndMasterStackService } from './mnd-master-stack.service';

@ApiTags('mnd-master-stacks')
@ApiBearerAuth('access-token')
@Controller('admin/mnd/master-stacks')
export class MndMasterStackController {
  constructor(private readonly stackService: MndMasterStackService) {}

  @Get()
  @ApiOperation({ summary: 'List MND master stacks' })
  findAll(): Promise<MndMasterStack[]> {
    return this.stackService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get MND master stack by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MndMasterStack> {
    return this.stackService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create MND master stack' })
  create(@Body() dto: CreateMndMasterStackDto): Promise<MndMasterStack> {
    return this.stackService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update MND master stack' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMndMasterStackDto,
  ): Promise<MndMasterStack> {
    return this.stackService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete MND master stack' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.stackService.remove(id);
  }
}
