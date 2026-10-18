import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type DateKey, MONTHS, WEEK_ORDER, WEEKDAY_SHORT, fromKey, toKey } from '../dates';
import { isScheduledOn, startKey } from '../logic';
import { useTheme } from '../theme';
import type { Habit } from '../types';

interface Props {
  habit: Habit;
  today: DateKey;
  onToggle: (day: DateKey) => void;
}

export function MonthCalendar({ habit, today, onToggle }: Props) {
  const t = useTheme();
  const now = fromKey(today);
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const isCurrentMonth = month.y === now.getFullYear() && month.m === now.getMonth();
  const done = new Set(habit.completions);
  const start = startKey(habit);

  const first = new Date(month.y, month.m, 1);
  const leading = (first.getDay() + 6) % 7; // Monday-first grid
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();

  const cells: (DateKey | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toKey(new Date(month.y, month.m, d)));
  while (cells.length % 7 !== 0) cells.push(null);

  const shift = (delta: number) => {
    const d = new Date(month.y, month.m + delta, 1);
    setMonth({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <View style={[styles.wrap, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={styles.header}>
        <Pressable onPress={() => shift(-1)} hitSlop={12} accessibilityLabel="Previous month">
          <Text style={[styles.arrow, { color: t.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: t.text }]}>
          {MONTHS[month.m]} {month.y}
        </Text>
        <Pressable
          onPress={() => shift(1)}
          disabled={isCurrentMonth}
          hitSlop={12}
          accessibilityLabel="Next month"
        >
          <Text style={[styles.arrow, { color: isCurrentMonth ? t.faint : t.text }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        {WEEK_ORDER.map((d) => (
          <Text key={d} style={[styles.weekday, { color: t.muted }]}>
            {WEEKDAY_SHORT[d].slice(0, 2)}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((key, i) => {
          if (!key) return <View key={`blank-${i}`} style={styles.cell} />;

          const isFuture = key > today;
          const isDone = done.has(key);
          const scheduled = isScheduledOn(habit.schedule, key);
          const missed =
            !isDone && !isFuture && key < today && key >= start &&
            scheduled && habit.schedule.kind !== 'perWeek';
          const isToday = key === today;

          return (
            <View key={key} style={styles.cell}>
              <Pressable
                disabled={isFuture}
                onPress={() => onToggle(key)}
                accessibilityLabel={`${key}${isDone ? ', done' : ''}`}
                style={[
                  styles.day,
                  isDone && { backgroundColor: habit.color },
                  missed && { borderWidth: 1.5, borderColor: t.border },
                  isToday && !isDone && { borderWidth: 2, borderColor: habit.color },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: isDone ? '#FFFFFF' : isFuture || !scheduled ? t.faint : t.text },
                    isToday && { fontWeight: '700' },
                  ]}
                >
                  {fromKey(key).getDate()}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const CELL_WIDTH = '14.2857%';

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  arrow: { fontSize: 28, lineHeight: 30, paddingHorizontal: 8 },
  title: { fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row' },
  weekday: { width: CELL_WIDTH, textAlign: 'center', fontSize: 12, marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_WIDTH, aspectRatio: 1, padding: 3 },
  day: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 14 },
});
