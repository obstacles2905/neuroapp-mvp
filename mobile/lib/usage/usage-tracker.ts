import {
  submitUsageSegments,
  type UsageSegmentContext,
  type UsageSegmentKind,
  type UsageSegmentPayload,
} from '@/lib/api/app-usage';

type OpenSegment = {
  kind: UsageSegmentKind;
  context: UsageSegmentContext;
  contextId?: string;
  startedAtMs: number;
};

const FLUSH_MAX_BATCH = 40;

function createClientEventId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID != null) {
    return g.crypto.randomUUID();
  }
  return `seg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function resolveDeviceIanaTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof tz === 'string' && tz.length > 0) {
      return tz;
    }
  } catch {
    /* ignore */
  }
  return 'UTC';
}

class UsageTracker {
  private readonly openByKey = new Map<string, OpenSegment>();
  private readonly pending: UsageSegmentPayload[] = [];
  private flushInFlight: Promise<void> | null = null;

  begin(
    key: string,
    kind: UsageSegmentKind,
    context: UsageSegmentContext,
    contextId?: string,
  ): void {
    this.end(key);
    this.openByKey.set(key, {
      kind,
      context,
      contextId,
      startedAtMs: Date.now(),
    });
  }

  end(key: string): void {
    const open = this.openByKey.get(key);
    if (open == null) {
      return;
    }
    this.openByKey.delete(key);
    const endedAtMs = Date.now();
    if (endedAtMs <= open.startedAtMs) {
      return;
    }
    this.pending.push({
      clientEventId: createClientEventId(),
      kind: open.kind,
      context: open.context,
      contextId: open.contextId,
      startedAt: new Date(open.startedAtMs).toISOString(),
      endedAt: new Date(endedAtMs).toISOString(),
    });
  }

  endAll(): void {
    for (const key of [...this.openByKey.keys()]) {
      this.end(key);
    }
  }

  async flush(): Promise<void> {
    this.endAll();
    if (this.pending.length === 0) {
      return;
    }
    if (this.flushInFlight != null) {
      await this.flushInFlight;
      if (this.pending.length === 0) {
        return;
      }
    }
    const batch = this.pending.splice(0, FLUSH_MAX_BATCH);
    const run = submitUsageSegments(resolveDeviceIanaTimeZone(), batch).then(
      () => undefined,
      () => {
        this.pending.unshift(...batch);
      },
    );
    this.flushInFlight = run;
    await run;
    this.flushInFlight = null;
    if (this.pending.length > 0) {
      await this.flush();
    }
  }
}

export const usageTracker = new UsageTracker();

export const USAGE_FOREGROUND_KEY = 'foreground';
export const USAGE_LESSON_KEY = 'lesson';
export const USAGE_MND_KEY = 'mnd';
