# Habits — a personal habit tracker

An Expo (React Native + TypeScript) Android app for tracking your own habits. There's no server and no account: everything stays on your phone.

**Features**
- **Today screen.** Tap the circle to check a habit off. A progress bar shows how much of today is done.
- **Streaks.** 🔥 current and best streaks. Days a habit isn't scheduled don't break its streak.
- **Custom schedules.** Every day, specific days (e.g. Mon/Wed/Fri), or *x* times a week.
- **A time for each habit.** Set when you'll do it (or leave it as "any time"). The Today list is ordered by time.
- **Reminders.** An optional notification at the habit's time. A specific-days habit is only reminded on its days.
- **History + stats.** A month calendar per habit (tap a past day to fix a missed check-in), plus best streak, total check-ins, and completion rate.

---

## 1. Set up (once)

You need [Node.js](https://nodejs.org) 20 or newer (LTS) on your laptop.

```bash
cd habit-tracker
npm install

# Move to the newest Expo SDK so it works with the current Expo Go app
npx expo install expo@latest
npx expo install --fix
```

## 2. Try it on your phone (dev mode)

1. Install **Expo Go** from the Play Store.
2. Run `npx expo start` and scan the QR code with Expo Go. Your phone and laptop need to be on the same Wi-Fi. If they can't be, use `npx expo start --tunnel`.

Code changes reload instantly. Reminders are best tested in the real APK (step 3), because Expo Go's notification support is limited.

## 3. Build an installable APK (free)

```bash
npm install -g eas-cli
eas login                                  # free Expo account
eas build -p android --profile preview
```

- The first time, accept the prompts to create the EAS project and to **generate a new Android keystore**. Expo stores that key, and every future build must be signed with it. If the key changes, updating the app wipes your data.
- Once the build finishes, open the link on your phone. Download the `.apk`, allow "install unknown apps" for your browser, and install it.
- **To update later:** build again and install the new APK over the old one. Your habits are kept.

If you'd rather build locally, you'll need Android Studio and the Android SDK. Then run `npx expo run:android --variant release`.

> Before your first build, you can change the app ID `com.personal.habittracker` in `app.json`. After the first build, keep it fixed.

---

## How the numbers work

| Schedule | Streak counts… | Completion rate |
|---|---|---|
| Every day | consecutive days done | scheduled days done in the last 30 days |
| Specific days | consecutive *scheduled* days done (other days are skipped) | same, counting only scheduled days |
| *x* times a week | consecutive weeks (Mon–Sun) that hit the target | weeks on target, out of the last 8 |

Today never breaks a streak while it's still in progress. Check-ins you back-fill on the calendar count too.

## Project layout

```
App.tsx                      screen switching + Android back button
src/types.ts                 Habit / Schedule / Reminder types
src/dates.ts                 local YYYY-MM-DD date helpers
src/logic.ts                 streaks, stats, schedule rules (pure functions)
src/storage.ts               saves habits with AsyncStorage
src/store.tsx                React context: habits + actions + "today"
src/notifications.ts         schedules reminders with expo-notifications
src/screens/                 Today, Habit detail, Add/Edit habit
src/components/              HabitCard, MonthCalendar, CheckCircle, Header
```

## Good to know

- **Your data lives only on the phone.** Uninstalling the app deletes it.
- Android's battery saver can make reminders arrive a few minutes late.
- A reminder still fires on a day you've already checked off.
