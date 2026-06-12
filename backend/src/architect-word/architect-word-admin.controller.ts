import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArchitectWordService } from './architect-word.service';
import { ArchitectWordAdminSlotResponseDto } from './dto/architect-word-admin-slot-response.dto';
import { UpsertArchitectWordSlotDto } from './dto/upsert-architect-word-slot.dto';

@ApiTags('architect-word-admin')
@ApiBearerAuth('access-token')
@Controller('admin/mnd/symptoms/:symptomId/architect-word')
export class ArchitectWordAdminController {
  constructor(private readonly architectWordService: ArchitectWordService) {}

  @Get()
  @ApiOperation({ summary: 'Слоты видео «Слово Архитектора» для симптома' })
  listSlots(
    @Param('symptomId', ParseUUIDPipe) symptomId: string,
  ): Promise<ArchitectWordAdminSlotResponseDto[]> {
    return this.architectWordService.listAdminSlots(symptomId);
  }

  @Put(':slot')
  @ApiOperation({ summary: 'Сохранить слот видео' })
  upsertSlot(
    @Param('symptomId', ParseUUIDPipe) symptomId: string,
    @Param('slot', ParseIntPipe) slot: number,
    @Body() dto: UpsertArchitectWordSlotDto,
  ): Promise<ArchitectWordAdminSlotResponseDto> {
    return this.architectWordService.upsertAdminSlot(symptomId, slot, dto);
  }

  @Delete(':slot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Очистить слот видео' })
  clearSlot(
    @Param('symptomId', ParseUUIDPipe) symptomId: string,
    @Param('slot', ParseIntPipe) slot: number,
  ): Promise<ArchitectWordAdminSlotResponseDto> {
    return this.architectWordService.clearAdminSlot(symptomId, slot);
  }
}
