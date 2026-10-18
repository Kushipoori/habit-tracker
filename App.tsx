import { type ReactNode, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { BackHandler, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HabitDetailScreen } from './src/screens/HabitDetailScreen';
import { HabitFormScreen } from './src/screens/HabitFormScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { HabitsProvider, useHabits } from './src/store';
import { useTheme } from './src/theme';

type Route =
  | { name: 'today' }
  | { name: 'detail'; habitId: string }
  | { name: 'form'; habitId?: string };

export default function App() {
  return (
    <SafeAreaProvider>
      <HabitsProvider>
        <Root />
      </HabitsProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const t = useTheme();
  const { ready, habits, addHabit, updateHabit, deleteHabit } = useHabits();
  const [route, setRoute] = useState<Route>({ name: 'today' });

  const goBack = () => {
    if (route.name === 'form' && route.habitId) setRoute({ name: 'detail', habitId: route.habitId });
    else setRoute({ name: 'today' });
  };

  // Android hardware back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.name === 'today') return false;
      goBack();
      return true;
    });
    return () => sub.remove();
  });

  let screen: ReactNode = null;
  if (!ready) {
    screen = null;
  } else if (route.name === 'detail') {
    const habit = habits.find((h) => h.id === route.habitId);
    screen = habit ? (
      <HabitDetailScreen
        habit={habit}
        onBack={goBack}
        onEdit={() => setRoute({ name: 'form', habitId: habit.id })}
      />
    ) : null;
  } else if (route.name === 'form') {
    const habit = route.habitId ? habits.find((h) => h.id === route.habitId) : undefined;
    screen = (
      <HabitFormScreen
        key={route.habitId ?? 'new'}
        habit={habit}
        onCancel={goBack}
        onSave={(input) => {
          if (habit) {
            updateHabit(habit.id, input);
            setRoute({ name: 'detail', habitId: habit.id });
          } else {
            addHabit(input);
            setRoute({ name: 'today' });
          }
        }}
        onDelete={
          habit
            ? () => {
                deleteHabit(habit.id);
                setRoute({ name: 'today' });
              }
            : undefined
        }
      />
    );
  }

  if (ready && screen === null) {
    screen = (
      <TodayScreen
        onOpenHabit={(id) => setRoute({ name: 'detail', habitId: id })}
        onAddHabit={() => setRoute({ name: 'form' })}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style="auto" />
      {screen}
    </View>
  );
}
