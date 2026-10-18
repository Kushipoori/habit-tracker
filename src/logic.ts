import { type DateKey, WEEK_ORDER, WEEKDAY_SHORT, addDays, weekStart, weekdayOf } from './dates';
import type { Habit, Schedule } from './types';

export function isScheduledOn(schedule: Schedule, key: DateKey): boolean {
  if (schedule.kind === 'weekdays') return schedule.days.includes(weekdayOf(key));
  return true; // daily, and "x times a week" can be done on any day
}

/** First day that counts for stats: creation day, or an earlier back-filled check-in. */
export function startKey(h: Habit): DateKey {
  const first = h.completions[0];
  return first !== undefined && first < h.createdAt ? first : h.createdAt;
}

export function isDoneOn(h: Habit, key: DateKey): boolean {
  return h.completions.includes(key);
}

export function toggleCompletion(h: Habit, key: DateKey): Habit {
  const has = h.completions.includes(key);
  const completions = has
    ? h.completions.filter((k) => k !== key)
    : [...h.completions, key].sort();
  return { ...h, completions };
}

function countInWeek(done: Set<DateKey>, monday: DateKey): number {
  let count = 0;
  for (let i = 0; i < 7; i++) if (done.has(addDays(monday, i))) count++;
  return count;
}

export function weekProgress(h: Habit, today: DateKey): { count: number; target: number } {
  const target = h.schedule.kind === 'perWeek' ? h.schedule.times : 7;
  return { count: countInWeek(new Set(h.completions), weekStart(today)), target };
}

export interface Streak {
  current: number;
  best: number;
  unit: 'day' | 'week';
}

/**
 * Daily / specific-days habits: a streak counts consecutive scheduled days that were done.
 * Days that aren't scheduled are skipped, and today doesn't break the streak until it's over.
 *
 * "x times a week" habits: a streak counts consecutive weeks (Mon–Sun) that hit the target.
 * The current week only adds to the streak once its target is met.
 */
export function streaks(h: Habit, today: DateKey): Streak {
  const done = new Set(h.completions);
  const start = startKey(h);

  if (h.schedule.kind === 'perWeek') {
    const target = h.schedule.times;
    const firstWeek = weekStart(start);
    const thisWeek = weekStart(today);

    let run = 0;
    let best = 0;
    for (let w = firstWeek; w <= thisWeek; w = addDays(w, 7)) {
      if (countInWeek(done, w) >= target) {
        run++;
        best = Math.max(best, run);
      } else if (w < thisWeek) {
        run = 0;
      }
    }

    let current = 0;
    let w = countInWeek(done, thisWeek) >= target ? thisWeek : addDays(thisWeek, -7);
    while (w >= firstWeek && countInWeek(done, w) >= target) {
      current++;
      w = addDays(w, -7);
    }
    return { current, best: Math.max(best, current), unit: 'week' };
  }

  let run = 0;
  let best = 0;
  for (let d = start; d <= today; d = addDays(d, 1)) {
    if (!isScheduledOn(h.schedule, d)) continue;
    if (done.has(d)) {
      run++;
      best = Math.max(best, run);
    } else if (d < today) {
      run = 0;
    }
  }

  let current = 0;
  let d = done.has(today) ? today : addDays(today, -1);
  while (d >= start) {
    if (isScheduledOn(h.schedule, d)) {
      if (!done.has(d)) break;
      current++;
    }
    d = addDays(d, -1);
  }
  return { current, best: Math.max(best, current), unit: 'day' };
}

export interface Rate {
  done: number;
  total: number;
  label: string;
}

/**
 * Daily / specific-days: share of scheduled days done in the last 30 days
 * (today only counts once it's done).
 * x times a week: weeks that hit the target, out of the last 8 weeks
 * (the current week only counts once it's hit).
 */
export function completionRate(h: Habit, today: DateKey): Rate {
  const done = new Set(h.completions);
  const start = startKey(h);

  if (h.schedule.kind === 'perWeek') {
    const target = h.schedule.times;
    const thisWeek = weekStart(today);
    let total = 0;
    let hit = 0;
    if (countInWeek(done, thisWeek) >= target) {
      total++;
      hit++;
    }
    for (let i = 1; total < 8; i++) {
      const w = addDays(thisWeek, -7 * i);
      if (addDays(w, 6) < start) break;
      total++;
      if (countInWeek(done, w) >= target) hit++;
    }
    return { done: hit, total, label: 'Weeks on target' };
  }

  let from = addDays(today, -29);
  if (from < start) from = start;
  let total = 0;
  let hit = 0;
  for (let d = from; d <= today; d = addDays(d, 1)) {
    if (!isScheduledOn(h.schedule, d)) continue;
    if (d === today && !done.has(d)) continue;
    total++;
    if (done.has(d)) hit++;
  }
  return { done: hit, total, label: 'Last 30 days' };
}

export function scheduleLabel(s: Schedule): string {
  if (s.kind === 'daily') return 'Every day';
  if (s.kind === 'perWeek') return `${s.times}× a week`;
  const days = [...s.days].sort((a, b) => WEEK_ORDER.indexOf(a) - WEEK_ORDER.indexOf(b));
  const key = days.join(',');
  if (key === '1,2,3,4,5') return 'Weekdays';
  if (key === '6,0') return 'Weekends';
  if (days.length === 7) return 'Every day';
  return days.map((d) => WEEKDAY_SHORT[d]).join(', ');
}

export function streakLabel(s: Streak): string {
  if (s.current === 0) return 'No streak yet';
  return `🔥 ${s.current} ${s.unit}${s.current === 1 ? '' : 's'}`;
}

/**
 * Splits habits for the Today screen.
 * `due`: what to work on today. `later`: specific-days habits not scheduled today.
 */
export function splitForToday(habits: Habit[], today: DateKey): { due: Habit[]; later: Habit[] } {
  const due: Habit[] = [];
  const later: Habit[] = [];
  for (const h of habits) {
    if (h.schedule.kind === 'weekdays' && !isScheduledOn(h.schedule, today)) later.push(h);
    else due.push(h);
  }
  return { due: sortByTime(due), later: sortByTime(later) };
}

/** Habits with a time first (earliest first), then "any time" habits in the order they were added. */
export function sortByTime(habits: Habit[]): Habit[] {
  const minutes = (h: Habit) => (h.time ? h.time.hour * 60 + h.time.minute : 24 * 60);
  return [...habits].sort((a, b) => minutes(a) - minutes(b));
}

/** Counts for the progress bar. A weekly habit already on target only counts if done today. */
export function todayProgress(due: Habit[], today: DateKey): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const h of due) {
    const doneToday = isDoneOn(h, today);
    if (h.schedule.kind === 'perWeek' && !doneToday) {
      const { count, target } = weekProgress(h, today);
      if (count >= target) continue;
    }
    total++;
    if (doneToday) done++;
  }
  return { done, total };
}
