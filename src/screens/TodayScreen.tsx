import { type DimensionValue, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HabitCard } from '../components/HabitCard';
import { formatLong } from '../dates';
import { splitForToday, todayProgress } from '../logic';
import { useHabits } from '../store';
import { useTheme } from '../theme';

interface Props {
  onOpenHabit: (id: string) => void;
  onAddHabit: () => void;
}

export function TodayScreen({ onOpenHabit, onAddHabit }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { habits, today, toggleDay } = useHabits();

  const { due, later } = splitForToday(habits, today);
  const progress = todayProgress(due, today);
  const allDone = progress.total > 0 && progress.done === progress.total;
  const fillWidth: DimensionValue = `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%`;

  return (
    <View style={[styles.screen, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 110,
          paddingHorizontal: 16,
        }}
      >
        <Text style={[styles.date, { color: t.muted }]}>{formatLong(today)}</Text>
        <Text style={[styles.title, { color: t.text }]}>Today</Text>

        {habits.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[styles.emptyTitle, { color: t.text }]}>Start with one small habit</Text>
            <Text style={[styles.emptyText, { color: t.muted }]}>
              Something you can do in two minutes — a glass of water, ten push-ups, one page of a book.
            </Text>
            <Pressable
              onPress={onAddHabit}
              style={[styles.emptyButton, { backgroundColor: t.accent }]}
            >
              <Text style={[styles.emptyButtonText, { color: t.onAccent }]}>Add your first habit</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {progress.total > 0 && (
              <View style={styles.progressWrap}>
                <Text style={[styles.progressText, { color: t.text }]}>
                  {allDone ? 'All done for today 🎉' : `${progress.done} of ${progress.total} done`}
                </Text>
                <View style={[styles.track, { backgroundColor: t.subtle }]}>
                  <View
                    style={[
                      styles.fill,
                      { backgroundColor: t.accent, width: fillWidth },
                    ]}
                  />
                </View>
              </View>
            )}

            {due.map((h) => (
              <HabitCard
                key={h.id}
                habit={h}
                today={today}
                onOpen={() => onOpenHabit(h.id)}
                onToggle={() => toggleDay(h.id, today)}
              />
            ))}

            {later.length > 0 && (
              <>
                <Text style={[styles.section, { color: t.muted }]}>NOT SCHEDULED TODAY</Text>
                {later.map((h) => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    today={today}
                    dimmed
                    onOpen={() => onOpenHabit(h.id)}
                    onToggle={() => toggleDay(h.id, today)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {habits.length > 0 && (
        <Pressable
          onPress={onAddHabit}
          accessibilityLabel="Add habit"
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: t.accent, bottom: insets.bottom + 24 },
            pressed && { transform: [{ scale: 0.95 }] },
          ]}
        >
          <Text style={[styles.fabText, { color: t.onAccent }]}>＋ New habit</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  date: { fontSize: 14, fontWeight: '500' },
  title: { fontSize: 34, fontWeight: '800', marginTop: 2, marginBottom: 16 },
  progressWrap: { marginBottom: 18 },
  progressText: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: 18, marginBottom: 10 },
  empty: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 24, marginTop: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyText: { fontSize: 15, lineHeight: 21, marginTop: 8 },
  emptyButton: { marginTop: 20, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  emptyButtonText: { fontSize: 16, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 20,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { fontSize: 16, fontWeight: '700' },
});
