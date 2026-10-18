import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Habit } from './types';

const KEY = 'habit-tracker/v1';

export async function loadHabits(): Promise<Habit[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.habits) ? (parsed.habits as Habit[]) : [];
  } catch {
    // Keep the unreadable copy instead of silently overwriting it on the next save.
    await AsyncStorage.setItem(`${KEY}/corrupt-${Date.now()}`, raw);
    return [];
  }
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({ version: 1, habits }));
}
