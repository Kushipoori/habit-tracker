import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Header } from '../components/Header';
import { MonthCalendar } from '../components/MonthCalendar';
import { formatTime } from '../dates';
import { completionRate, scheduleLabel, streaks } from '../logic';
import { useHabits } from '../store';
import { useTheme } from '../theme';
import type { Habit } from '../types';

interface Props {
  habit: Habit;
  onBack: () => void;
  onEdit: () => void;
}

export function HabitDetailScreen({ habit, onBack, onEdit }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { today, toggleDay } = useHabits();

  const s = streaks(habit, today);
  const rate = completionRate(habit, today);
  const unit = (n: number) => `${s.unit}${n === 1 ? '' : 's'}`;
  const ratePct = rate.total === 0 ? '—' : `${Math.round((rate.done / rate.total) * 100)}%`;

  const tiles = [
    { label: 'Current streak', value: String(s.current), sub: unit(s.current) },
    { label: 'Best streak', value: String(s.best), sub: unit(s.best) },
    { label: 'Total check-ins', value: String(habit.completions.length), sub: 'all time' },
    { label: rate.label, value: ratePct, sub: rate.total ? `${rate.done} of ${rate.total}` : 'not enough data' },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <Header left={{ label: '‹ Back', onPress: onBack }} right={{ label: 'Edit', onPress: onEdit }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
        <View style={styles.titleRow}>
          <View style={[styles.dot, { backgroundColor: habit.color }]} />
          <Text style={[styles.name, { color: t.text }]}>{habit.name}</Text>
        </View>
        <Text style={[styles.meta, { color: t.muted }]}>
          {scheduleLabel(habit.schedule)}
          {habit.time
            ? ` · ${formatTime(habit.time.hour, habit.time.minute)}${habit.remind ? ' · Reminder on' : ''}`
            : ' · Any time'}
        </Text>

        <View style={styles.tiles}>
          {tiles.map((tile) => (
            <View
              key={tile.label}
              style={[styles.tile, { backgroundColor: t.card, borderColor: t.border }]}
            >
              <Text style={[styles.tileLabel, { color: t.muted }]}>{tile.label}</Text>
              <Text style={[styles.tileValue, { color: t.text }]}>{tile.value}</Text>
              <Text style={[styles.tileSub, { color: t.muted }]}>{tile.sub}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.section, { color: t.muted }]}>HISTORY</Text>
        <MonthCalendar habit={habit} today={today} onToggle={(day) => toggleDay(habit.id, day)} />
        <Text style={[styles.hint, { color: t.muted }]}>
          Tap any past day to add or remove a check-in.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 10 },
  name: { flex: 1, fontSize: 28, fontWeight: '800' },
  meta: { fontSize: 14, marginTop: 6 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20 },
  tile: {
    width: '48.5%',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 10,
  },
  tileLabel: { fontSize: 13, fontWeight: '500' },
  tileValue: { fontSize: 30, fontWeight: '800', marginTop: 6 },
  tileSub: { fontSize: 12, marginTop: 2 },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: 14, marginBottom: 10 },
  hint: { fontSize: 13, marginTop: 10, textAlign: 'center' },
});
