import type { AppTokens } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const DOW = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const;

const MONTHS_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
] as const;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function dayKeyUtc(year: number, month1: number, day: number): string {
  return `${year}-${pad2(month1)}-${pad2(day)}`;
}

function buildMonthGrid(year: number, month1: number): (number | null)[][] {
  const firstDow = new Date(Date.UTC(year, month1 - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month1, 0)).getUTCDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i += 1) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(d);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

type RowSeg = { start: number; end: number; first: number; last: number };

function rowSegments(
  row: (number | null)[],
  year: number,
  month1: number,
  active: Set<string>,
): RowSeg[] {
  const out: RowSeg[] = [];
  let c = 0;
  while (c < 7) {
    const d = row[c];
    if (d == null) {
      c += 1;
      continue;
    }
    const k = dayKeyUtc(year, month1, d);
    if (!active.has(k)) {
      c += 1;
      continue;
    }
    const startC = c;
    let endC = c;
    let lastD = d;
    let n = c + 1;
    while (n < 7) {
      const dn = row[n];
      if (dn == null) {
        break;
      }
      if (dn !== lastD + 1) {
        break;
      }
      if (!active.has(dayKeyUtc(year, month1, dn))) {
        break;
      }
      endC = n;
      lastD = dn;
      n += 1;
    }
    out.push({ start: startC, end: endC, first: d, last: lastD });
    c = endC + 1;
  }
  return out;
}

function leftConn(
  row: (number | null)[],
  col: number,
  y: number,
  m: number,
  d: number,
  active: Set<string>,
): boolean {
  if (d <= 1) {
    return false;
  }
  const prev = d - 1;
  if (col > 0 && row[col - 1] === prev) {
    return active.has(dayKeyUtc(y, m, prev));
  }
  return false;
}

function rightConn(
  row: (number | null)[],
  col: number,
  dim: number,
  y: number,
  m: number,
  d: number,
  active: Set<string>,
): boolean {
  if (d >= dim) {
    return false;
  }
  const next = d + 1;
  if (col < 6 && row[col + 1] === next) {
    return active.has(dayKeyUtc(y, m, next));
  }
  return false;
}

type Props = {
  year: number;
  month: number;
  activeDays: Set<string>;
  todayKey: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export function StreakMonthCalendar(props: Props) {
  const { year, month, activeDays, todayKey, onPrevMonth, onNextMonth } = props;
  const t = useAppTheme();
  const styles = useMemo(() => createStreakCalendarStyles(t), [t]);
  const rows = useMemo(
    () => buildMonthGrid(year, month),
    [year, month],
  );
  const dim = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const title = `${MONTHS_RU[month - 1]} ${String(year)}`;

  return (
    <View style={styles.wrap}>
      <View style={styles.monthHeader}>
        <Pressable
          accessibilityLabel="Предыдущий месяц"
          hitSlop={10}
          onPress={onPrevMonth}
        >
          <Text style={styles.monthNavIcon}>‹</Text>
        </Pressable>
        <Text style={styles.monthTitle}>{title}</Text>
        <Pressable
          accessibilityLabel="Следующий месяц"
          hitSlop={10}
          onPress={onNextMonth}
        >
          <Text style={styles.monthNavIcon}>›</Text>
        </Pressable>
      </View>
      <View style={styles.dowRow}>
        {DOW.map((l) => (
          <Text key={l} style={styles.dowText}>
            {l}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => {
        const segs = rowSegments(row, year, month, activeDays);
        return (
          <View key={String(ri)} style={styles.weekBlock}>
            <View style={styles.barRow}>
              {segs.map((seg) => {
                const lRound = !leftConn(row, seg.start, year, month, seg.first, activeDays);
                const rRound = !rightConn(row, seg.end, dim, year, month, seg.last, activeDays);
                const w = ((seg.end - seg.start + 1) / 7) * 100;
                const left = (seg.start / 7) * 100;
                return (
                  <View
                    key={`${String(seg.start)}-${String(seg.end)}`}
                    style={[
                      styles.segPill,
                      {
                        left: `${left}%`,
                        width: `${w}%`,
                        borderTopLeftRadius: lRound ? 4 : 0,
                        borderBottomLeftRadius: lRound ? 4 : 0,
                        borderTopRightRadius: rRound ? 4 : 0,
                        borderBottomRightRadius: rRound ? 4 : 0,
                      },
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.dayRow}>
              {row.map((d, ci) => {
                if (d == null) {
                  return (
                    <View key={`e-${String(ri)}-${String(ci)}`} style={styles.dayCell} />
                  );
                }
                const k = dayKeyUtc(year, month, d);
                const isFuture = k > todayKey;
                const isToday = k === todayKey;
                const isActive = activeDays.has(k) && !isFuture;
                return (
                  <View key={k} style={styles.dayCell}>
                    <View
                      style={[
                        styles.dayNumWrap,
                        isToday ? styles.dayToday : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNum,
                          isFuture ? styles.dayFuture : null,
                          isActive ? styles.dayActiveText : null,
                        ]}
                      >
                        {d}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function createStreakCalendarStyles(t: AppTokens) {
  return StyleSheet.create({
    barRow: {
      height: 7,
      marginBottom: 2,
      position: 'relative',
      width: '100%',
    },
    dayActiveText: {
      color: t.link,
      fontWeight: '800',
    },
    dayCell: {
      alignItems: 'center',
      flex: 1,
    },
    dayFuture: {
      color: t.textMuted,
    },
    dayNum: {
      color: t.text,
      fontSize: 14,
      fontWeight: '600',
    },
    dayNumWrap: {
      alignItems: 'center',
      borderRadius: 14,
      height: 28,
      justifyContent: 'center',
      minWidth: 28,
    },
    dayRow: {
      flexDirection: 'row',
      width: '100%',
    },
    dayToday: {
      backgroundColor: t.tintMuted,
      borderColor: t.tint,
      borderWidth: 1.5,
    },
    dowRow: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    dowText: {
      color: t.textSecondary,
      flex: 1,
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    monthHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    monthNavIcon: { color: t.tint, fontSize: 26, fontWeight: '600' },
    monthTitle: {
      color: t.text,
      flex: 1,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.2,
      textAlign: 'center',
    },
    segPill: {
      backgroundColor: t.tint,
      height: 7,
      position: 'absolute',
      top: 0,
    },
    weekBlock: { marginBottom: 2 },
    wrap: { width: '100%' },
  });
}
