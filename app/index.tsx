import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { LoadingScreen } from '../src/components/LoadingScreen';
import { getRoleHome } from '../src/utils/roleRoutes';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Redirect href={getRoleHome(user?.role)} />;
  return <Redirect href="/auth/login" />;
}
