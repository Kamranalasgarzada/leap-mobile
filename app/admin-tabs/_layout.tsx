import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { useAppColors } from '../../src/hooks/useAppColors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function AdminTabsLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const c = useAppColors();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Redirect href="/auth/login" />;
  if (user?.role !== 'ADMIN') return <Redirect href="/tabs/home" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.tabBar, borderTopColor: c.tabBarBorder, borderTopWidth: 1,
          paddingBottom: insets.bottom, height: 60 + insets.bottom,
        },
        tabBarActiveTintColor: c.primary, tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: t('tabs.dashboard'), tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard" color={color} size={size} /> }} />
      <Tabs.Screen name="users" options={{ title: t('tabs.users'), tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group" color={color} size={size} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Bildirişlər', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="bell" color={color} size={size} /> }} />
      <Tabs.Screen name="finance" options={{ title: t('tabs.finance'), tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cash-multiple" color={color} size={size} /> }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle" color={color} size={size} /> }} />
    </Tabs>
  );
}
