import { type ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { todayKey, type DateKey } from './dates';
import { toggleCompletion } from './logic';
import { syncReminders } from './notifications';
import { loadHabits, saveHabits } from './storage';
import type { Habit, HabitInput } from './types';

interface HabitsContextValue {
  ready: boolean;
  habits: Habit[];
  today: DateKey;
  addHabit: (input: HabitInput) => void;
  updateHabit: (id: string, input: HabitInput) => void;
  deleteHabit: (id: string) => void;
  toggleDay: (id: string, day: DateKey) => void;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** Today's date key, refreshed at midnight and whenever the app comes back to the foreground. */
function useToday(): DateKey {
  const [today, setToday] = useState(todayKey());

  useEffect(() => {
    const refresh = () => setToday(todayKey());
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });

    let timer: ReturnType<typeof setTimeout>;
    const scheduleMidnight = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      timer = setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, next.getTime() - now.getTime());
    };
    scheduleMidnight();

    return () => {
      sub.remove();
      clearTimeout(timer);
    };
  }, []);

  return today;
}

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [ready, setReady] = useState(false);
  const current = useRef<Habit[]>([]);
  const today = useToday();

  useEffect(() => {
    loadHabits()
      .then((loaded) => {
        current.current = loaded;
        setHabits(loaded);
        void syncReminders(loaded);
      })
      .catch((e) => console.warn('Could not load habits', e))
      .finally(() => setReady(true));
  }, []);

  const commit = useCallback((next: Habit[], remindersChanged: boolean) => {
    current.current = next;
    setHabits(next);
    saveHabits(next).catch((e) => console.warn('Could not save habits', e));
    if (remindersChanged) void syncReminders(next);
  }, []);

  const addHabit = useCallback(
    (input: HabitInput) => {
      const habit: Habit = { ...input, id: newId(), createdAt: todayKey(), completions: [] };
      commit([...current.current, habit], true);
    },
    [commit],
  );

  const updateHabit = useCallback(
    (id: string, input: HabitInput) => {
      commit(current.current.map((h) => (h.id === id ? { ...h, ...input } : h)), true);
    },
    [commit],
  );

  const deleteHabit = useCallback(
    (id: string) => {
      commit(current.current.filter((h) => h.id !== id), true);
    },
    [commit],
  );

  const toggleDay = useCallback(
    (id: string, day: DateKey) => {
      commit(current.current.map((h) => (h.id === id ? toggleCompletion(h, day) : h)), false);
    },
    [commit],
  );

  return (
    <HabitsContext.Provider value={{ ready, habits, today, addHabit, updateHabit, deleteHabit, toggleDay }}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits(): HabitsContextValue {
  const value = useContext(HabitsContext);
  if (!value) throw new Error('useHabits must be used inside <HabitsProvider>');
  return value;
}
