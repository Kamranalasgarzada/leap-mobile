import { Stack } from 'expo-router';
import { useAppColors } from '../../src/hooks/useAppColors';

export default function CourseLayout() {
  const c = useAppColors();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }} />;
}
