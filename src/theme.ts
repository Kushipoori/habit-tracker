import { useColorScheme } from 'react-native';

export const HABIT_COLORS = [
  '#E8590C', // orange
  '#2F9E44', // green
  '#1C7ED6', // blue
  '#AE3EC9', // purple
  '#E03131', // red
  '#0C8599', // teal
  '#F08C00', // amber
  '#5C7CFA', // indigo
];

const light = {
  bg: '#F6F4EF',
  card: '#FFFFFF',
  text: '#1F1D1A',
  muted: '#77716A',
  faint: '#B9B2A8',
  border: '#E6E1D8',
  subtle: '#EFEBE4',
  accent: '#E8590C',
  onAccent: '#FFFFFF',
  danger: '#C92A2A',
};

const dark: typeof light = {
  bg: '#141311',
  card: '#1E1C19',
  text: '#F2EFEA',
  muted: '#A39C93',
  faint: '#5E5851',
  border: '#2E2B27',
  subtle: '#272421',
  accent: '#FF7A33',
  onAccent: '#1A0F08',
  danger: '#FF6B6B',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
