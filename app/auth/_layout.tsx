import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { useAppColors } from '../../src/hooks/useAppColors';
import { getRoleHome } from '../../src/utils/roleRoutes';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const c = useAppColors();
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Redirect href={getRoleHome(user?.role)} />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }} />
  );
}
