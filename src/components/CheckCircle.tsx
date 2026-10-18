import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../theme';

interface Props {
  done: boolean;
  color: string;
  onPress: () => void;
  label: string;
}

export function CheckCircle({ done, color, onPress, label }: Props) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.circle,
        { borderColor: done ? color : t.faint, backgroundColor: done ? color : 'transparent' },
        pressed && { transform: [{ scale: 0.92 }] },
      ]}
    >
      {done && <Text style={styles.tick}>✓</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: -1 },
});
