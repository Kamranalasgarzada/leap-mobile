import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { useAppColors } from '../../src/hooks/useAppColors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function TeacherTabsLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const c = useAppColors();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Redirect href="/auth/login" />;
  if (user?.role !== 'TEACHER') return <Redirect href="/tabs/home" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.tabBar, borderTopColor: c.tabBarBorder, borderTopWidth: 1,
          paddingBottom: insets.bottom, height: 60 + insets.bottom,
        },
        tabBarActiveTintColor: c.primary, tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: t('tabs.home'), tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="class-groups" options={{ title: t('tabs.classGroups'), tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="school" color={color} size={size} /> }} />
      <Tabs.Screen name="study-groups" options={{ title: t('tabs.studyGroups'), tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="message-text" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle" color={color} size={size} /> }} />
      {/* Hidden tabs - content accessed from group detail */}
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="courses" options={{ href: null }} />
    </Tabs>
  );
}
