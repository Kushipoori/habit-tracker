import type { DateKey } from './dates';

/** How often a habit should be done. Weekday numbers follow JS: 0 = Sunday … 6 = Saturday. */
export type Schedule =
  | { kind: 'daily' }
  | { kind: 'weekdays'; days: number[] }
  | { kind: 'perWeek'; times: number };

export interface TimeOfDay {
  hour: number; // 0–23
  minute: number; // 0–59
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  schedule: Schedule;
  /** When you plan to do it, or null for "any time". */
  time: TimeOfDay | null;
  /** Send a notification at `time` on scheduled days. */
  remind: boolean;
  createdAt: DateKey;
  /** Days the habit was done, as YYYY-MM-DD, sorted ascending, no duplicates. */
  completions: DateKey[];
}

/** The editable fields of a habit (what the add/edit form produces). */
export type HabitInput = Pick<Habit, 'name' | 'color' | 'schedule' | 'time' | 'remind'>;
