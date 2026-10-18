import { useState } from 'react';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Header } from '../components/Header';
import { WEEK_ORDER, WEEKDAY_SHORT, formatTime } from '../dates';
import { requestPermission } from '../notifications';
import { HABIT_COLORS, useTheme } from '../theme';
import type { Habit, HabitInput, Schedule, TimeOfDay } from '../types';

interface Props {
  habit?: Habit;
  onSave: (input: HabitInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

type Kind = Schedule['kind'];

const KIND_OPTIONS: { kind: Kind; label: string }[] = [
  { kind: 'daily', label: 'Every day' },
  { kind: 'weekdays', label: 'Specific days' },
  { kind: 'perWeek', label: 'Times a week' },
];

export function HabitFormScreen({ habit, onSave, onCancel, onDelete }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(habit?.name ?? '');
  const [color, setColor] = useState(habit?.color ?? HABIT_COLORS[0]);
  const [kind, setKind] = useState<Kind>(habit?.schedule.kind ?? 'daily');
  const [days, setDays] = useState<number[]>(
    habit?.schedule.kind === 'weekdays' ? habit.schedule.days : [1, 2, 3, 4, 5],
  );
  const [times, setTimes] = useState(habit?.schedule.kind === 'perWeek' ? habit.schedule.times : 3);
  const [time, setTime] = useState<TimeOfDay | null>(habit?.time ?? null);
  const [remind, setRemind] = useState(habit?.remind ?? false);
  const [showIosPicker, setShowIosPicker] = useState(false);

  const toggleDayOfWeek = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const setReminder = async (on: boolean) => {
    if (!on) {
      setRemind(false);
      return;
    }
    const granted = await requestPermission();
    if (granted) {
      setRemind(true);
    } else {
      Alert.alert(
        'Notifications are off',
        'Allow notifications for this app in your phone settings to get reminders.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open settings', onPress: () => void Linking.openSettings() },
        ],
      );
    }
  };

  const pickerValue = () => {
    const d = new Date();
    if (time) d.setHours(time.hour, time.minute, 0, 0);
    else d.setMinutes(0, 0, 0);
    return d;
  };

  const onTimePicked = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'ios') setShowIosPicker(false);
    if (event.type !== 'set' || !date) return;
    const isFirstTime = time === null;
    setTime({ hour: date.getHours(), minute: date.getMinutes() });
    // Picking a time for the first time also turns on the reminder (it can be switched off).
    if (isFirstTime && !remind) void setReminder(true);
  };

  const clearTime = () => {
    setTime(null);
    setRemind(false);
  };

  const pickTime = () => {
    const value = pickerValue();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value, mode: 'time', is24Hour: false, onChange: onTimePicked });
    } else {
      setShowIosPicker(true);
    }
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Give your habit a name');
      return;
    }
    if (kind === 'weekdays' && days.length === 0) {
      Alert.alert('Pick at least one day');
      return;
    }
    const schedule: Schedule =
      kind === 'weekdays'
        ? { kind, days: [...days].sort((a, b) => a - b) }
        : kind === 'perWeek'
          ? { kind, times }
          : { kind: 'daily' };
    onSave({ name: trimmed, color, schedule, time, remind: remind && time !== null });
  };

  const confirmDelete = () => {
    Alert.alert('Delete this habit?', 'Its whole history will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  const label = (text: string) => (
    <Text style={[styles.label, { color: t.muted }]}>{text}</Text>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: t.bg, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        left={{ label: 'Cancel', onPress: onCancel }}
        title={habit ? 'Edit habit' : 'New habit'}
        right={{ label: 'Save', onPress: save, bold: true }}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
      >
        {label('NAME')}
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Read 10 pages"
          placeholderTextColor={t.faint}
          autoFocus={!habit}
          maxLength={60}
          returnKeyType="done"
          style={[styles.input, { backgroundColor: t.card, borderColor: t.border, color: t.text }]}
        />

        {label('COLOR')}
        <View style={styles.colors}>
          {HABIT_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              accessibilityLabel={`Color ${c}`}
              style={[
                styles.swatch,
                { backgroundColor: c },
                color === c && { borderWidth: 3, borderColor: t.text },
              ]}
            />
          ))}
        </View>

        {label('HOW OFTEN')}
        <View style={[styles.segment, { backgroundColor: t.subtle }]}>
          {KIND_OPTIONS.map((o) => {
            const active = kind === o.kind;
            return (
              <Pressable
                key={o.kind}
                onPress={() => setKind(o.kind)}
                style={[styles.segmentItem, active && { backgroundColor: t.card }]}
              >
                <Text style={[styles.segmentText, { color: active ? t.text : t.muted }]}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {kind === 'weekdays' && (
          <View style={styles.days}>
            {WEEK_ORDER.map((d) => {
              const active = days.includes(d);
              return (
                <Pressable
                  key={d}
                  onPress={() => toggleDayOfWeek(d)}
                  style={[
                    styles.dayChip,
                    { borderColor: active ? color : t.border, backgroundColor: active ? color : t.card },
                  ]}
                >
                  <Text style={[styles.dayText, { color: active ? '#FFFFFF' : t.text }]}>
                    {WEEKDAY_SHORT[d].slice(0, 2)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {kind === 'perWeek' && (
          <View style={[styles.stepperRow, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[styles.rowText, { color: t.text }]}>Times per week</Text>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setTimes((n) => Math.max(1, n - 1))}
                style={[styles.stepButton, { backgroundColor: t.subtle }]}
                hitSlop={6}
              >
                <Text style={[styles.stepText, { color: t.text }]}>−</Text>
              </Pressable>
              <Text style={[styles.stepValue, { color: t.text }]}>{times}</Text>
              <Pressable
                onPress={() => setTimes((n) => Math.min(6, n + 1))}
                style={[styles.stepButton, { backgroundColor: t.subtle }]}
                hitSlop={6}
              >
                <Text style={[styles.stepText, { color: t.text }]}>+</Text>
              </Pressable>
            </View>
          </View>
        )}

        {label('TIME')}
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <Pressable onPress={pickTime} style={styles.cardRow}>
            <Text style={[styles.rowText, { color: t.text }]}>Do it at</Text>
            <Text style={[styles.rowValue, { color: time ? t.accent : t.muted }]}>
              {time ? formatTime(time.hour, time.minute) : 'Any time  ›'}
            </Text>
          </Pressable>
          {time ? (
            <>
              <View style={[styles.cardRow, styles.divider, { borderTopColor: t.border }]}>
                <Text style={[styles.rowText, { color: t.text }]}>Remind me</Text>
                <Switch
                  value={remind}
                  onValueChange={(v) => void setReminder(v)}
                  trackColor={{ true: color, false: t.border }}
                  thumbColor="#FFFFFF"
                />
              </View>
              {remind && kind === 'weekdays' && (
                <Text style={[styles.note, { color: t.muted }]}>Only on the days you picked.</Text>
              )}
              <Pressable
                onPress={clearTime}
                style={[styles.cardRow, styles.divider, { borderTopColor: t.border }]}
              >
                <Text style={[styles.rowText, { color: t.muted }]}>Remove time</Text>
              </Pressable>
            </>
          ) : (
            <Text style={[styles.note, { color: t.muted }]}>
              Set a time to order your Today list and get a reminder.
            </Text>
          )}
        </View>
        {showIosPicker && (
          <DateTimePicker value={pickerValue()} mode="time" display="spinner" onChange={onTimePicked} />
        )}

        {habit && onDelete && (
          <Pressable onPress={confirmDelete} style={styles.delete}>
            <Text style={[styles.deleteText, { color: t.danger }]}>Delete habit</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: 22, marginBottom: 8 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
  },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segmentText: { fontSize: 14, fontWeight: '600' },
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  dayChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontSize: 14, fontWeight: '600' },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 20, fontWeight: '600' },
  stepValue: { fontSize: 18, fontWeight: '700', width: 36, textAlign: 'center' },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, overflow: 'hidden' },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    minHeight: 52,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth },
  rowText: { fontSize: 16 },
  rowValue: { fontSize: 16, fontWeight: '600' },
  note: { fontSize: 13, paddingHorizontal: 14, paddingBottom: 12 },
  delete: { marginTop: 36, alignItems: 'center', paddingVertical: 12 },
  deleteText: { fontSize: 16, fontWeight: '600' },
});
