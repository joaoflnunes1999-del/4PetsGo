import { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { colors, fontFamily } from '@/theme';

const icon = (name: IconName) =>
  function TabIcon({ color }: { color: unknown }) {
    return <Icon name={name} size={22} color={String(color)} />;
  };

export default function TabsLayout() {
  const role = useAppStore((s) => s.role);
  const isOwner = role !== 'sitter';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fontFamily.bodyMedium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="pets" options={{ title: 'Mes animaux', tabBarIcon: icon('mci:paw'), href: isOwner ? undefined : null }} />
      <Tabs.Screen name="search" options={{ title: 'Rechercher', tabBarIcon: icon('search'), href: isOwner ? undefined : null }} />
      <Tabs.Screen name="missions" options={{ title: isOwner ? 'Missions' : 'Demandes', tabBarIcon: icon('calendar') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: icon('user') }} />
    </Tabs>
  );
}
