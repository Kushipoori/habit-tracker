import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';

interface Action {
  label: string;
  onPress: () => void;
  bold?: boolean;
}

interface Props {
  left?: Action;
  title?: string;
  right?: Action;
}

/** Simple top bar: text button on each side and an optional centered title. */
export function Header({ left, title, right }: Props) {
  const t = useTheme();
  const button = (a: Action | undefined, align: 'left' | 'right') => (
    <View style={[styles.side, { alignItems: align === 'left' ? 'flex-start' : 'flex-end' }]}>
      {a && (
        <Pressable onPress={a.onPress} hitSlop={12}>
          <Text style={[styles.action, { color: t.accent, fontWeight: a.bold ? '700' : '500' }]}>
            {a.label}
          </Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={styles.bar}>
      {button(left, 'left')}
      <Text style={[styles.title, { color: t.text }]} numberOfLines={1}>
        {title ?? ''}
      </Text>
      {button(right, 'right')}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 16 },
  side: { width: 90 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
  action: { fontSize: 17 },
});
