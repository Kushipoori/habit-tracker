import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type DateKey, formatTime } from '../dates';
import { isDoneOn, scheduleLabel, streakLabel, streaks, weekProgress } from '../logic';
import { useTheme } from '../theme';
import type { Habit } from '../types';
import { CheckCircle } from './CheckCircle';

interface Props {
  habit: Habit;
  today: DateKey;
  onOpen: () => void;
  onToggle: () => void;
  dimmed?: boolean;
}

export function HabitCard({ habit, today, onOpen, onToggle, dimmed }: Props) {
  const t = useTheme();
  const done = isDoneOn(habit, today);
  const streak = streaks(habit, today);

  let detail = scheduleLabel(habit.schedule);
  if (habit.schedule.kind === 'perWeek') {
    const { count, target } = weekProgress(habit, today);
    detail = count >= target ? `${count}/${target} this week ✓` : `${count}/${target} this week`;
  }

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: t.card, borderColor: t.border, opacity: dimmed ? 0.6 : 1 },
        pressed && { backgroundColor: t.subtle },
      ]}
    >
      <View style={[styles.bar, { backgroundColor: habit.color }]} />
      <View style={styles.body}>
        {habit.time && (
          <Text style={[styles.time, { color: habit.color }]}>
            {formatTime(habit.time.hour, habit.time.minute)}
          </Text>
        )}
        <Text style={[styles.name, { color: t.text }]} numberOfLines={2}>
          {habit.name}
        </Text>
        <Text style={[styles.meta, { color: t.muted }]} numberOfLines={1}>
          {streakLabel(streak)} · {detail}
        </Text>
      </View>
      {!dimmed && (
        <CheckCircle
          done={done}
          color={habit.color}
          onPress={onToggle}
          label={`Mark ${habit.name} ${done ? 'not done' : 'done'} today`}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingRight: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  bar: { width: 5, alignSelf: 'stretch', borderRadius: 3, marginLeft: 8, marginRight: 12 },
  body: { flex: 1, marginRight: 12 },
  time: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3, marginBottom: 2 },
  name: { fontSize: 17, fontWeight: '600' },
  meta: { fontSize: 13, marginTop: 3 },
});
