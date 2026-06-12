import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AppUserRepository } from '../analytics/app-user.repository';
import { UsageSegmentContext } from '../common/enums/usage-segment-context.enum';
import { UsageSegmentKind } from '../common/enums/usage-segment-kind.enum';
import type { SubmitUsageSegmentsDto } from './dto/submit-usage-segments.dto';
import type { UsageSegmentItemDto } from './dto/usage-segment-item.dto';
import {
  capSegmentDurationMs,
  isNewAppSession,
  isValidIanaTimeZone,
  localDayKeyFromInstant,
} from './usage-tracking.logic';
import { UsageTrackingRepository } from './usage-tracking.repository';

@Injectable()
export class UsageTrackingService {
  constructor(
    private readonly appUserRepository: AppUserRepository,
    private readonly usageTrackingRepository: UsageTrackingRepository,
  ) {}

  async submitSegments(
    appUserId: string,
    dto: SubmitUsageSegmentsDto,
  ): Promise<void> {
    const timeZone = dto.ianaTimeZone.trim();
    if (!isValidIanaTimeZone(timeZone)) {
      throw new BadRequestException('Invalid ianaTimeZone');
    }
    const user = await this.appUserRepository.findById(appUserId);
    if (user == null) {
      throw new UnauthorizedException();
    }
    user.usageTimezone = timeZone;
    let latestAppEndedAt =
      await this.usageTrackingRepository.findLatestAppSegmentEndedAt(appUserId);
    let maxEndedAt = user.lastSeenAt;
    for (const item of dto.segments) {
      const sessionDelta = await this.ingestOneSegment(
        appUserId,
        timeZone,
        item,
        latestAppEndedAt,
      );
      if (
        item.kind === UsageSegmentKind.APP &&
        sessionDelta >= 0
      ) {
        latestAppEndedAt = new Date(item.endedAt);
      }
      const ended = new Date(item.endedAt);
      if (maxEndedAt == null || ended > maxEndedAt) {
        maxEndedAt = ended;
      }
    }
    if (maxEndedAt != null) {
      user.lastSeenAt = maxEndedAt;
    }
    await this.appUserRepository.save(user);
  }

  /** @returns session increment (0|1), or -1 if duplicate/skipped */
  private async ingestOneSegment(
    appUserId: string,
    timeZone: string,
    item: UsageSegmentItemDto,
    latestAppEndedAt: Date | null,
  ): Promise<number> {
    const existing =
      await this.usageTrackingRepository.findSegmentByClientEventId(
        appUserId,
        item.clientEventId,
      );
    if (existing != null) {
      return -1;
    }
    this.assertContext(item);
    const startedAt = new Date(item.startedAt);
    const endedAt = new Date(item.endedAt);
    const durationMs = capSegmentDurationMs(startedAt, endedAt);
    if (durationMs <= 0) {
      return -1;
    }
    const localDay = localDayKeyFromInstant(endedAt, timeZone);
    const appMsDelta =
      item.kind === UsageSegmentKind.APP ? durationMs : 0;
    const exerciseMsDelta =
      item.kind === UsageSegmentKind.EXERCISE ? durationMs : 0;
    const sessionDelta =
      item.kind === UsageSegmentKind.APP &&
      isNewAppSession(latestAppEndedAt, startedAt)
        ? 1
        : 0;
    await this.usageTrackingRepository.insertSegment({
      appUserId,
      clientEventId: item.clientEventId,
      kind: item.kind,
      context: item.context,
      contextId: item.contextId ?? null,
      startedAt,
      endedAt,
      durationMs,
      localDay,
    });
    await this.usageTrackingRepository.addDailyMs(
      appUserId,
      localDay,
      appMsDelta,
      exerciseMsDelta,
      sessionDelta,
    );
    return sessionDelta;
  }

  private assertContext(item: UsageSegmentItemDto): void {
    if (item.context === UsageSegmentContext.MND_EXERCISE) {
      if (item.contextId == null) {
        throw new BadRequestException('contextId is required for this context');
      }
      if (item.kind !== UsageSegmentKind.EXERCISE) {
        throw new BadRequestException('mnd segments must be exercise kind');
      }
      return;
    }
    if (item.context === UsageSegmentContext.FOREGROUND) {
      if (item.kind !== UsageSegmentKind.APP) {
        throw new BadRequestException('foreground segments must be app kind');
      }
      if (item.contextId != null) {
        throw new BadRequestException('contextId must be omitted for foreground');
      }
    }
  }
}
