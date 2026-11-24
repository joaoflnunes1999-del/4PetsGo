import { Redirect } from 'expo-router';

import { useAppStore } from '@/store/useAppStore';

export default function Index() {
  const role = useAppStore((s) => s.role);
  if (!role) return <Redirect href="/welcome" />;
  return <Redirect href={role === 'sitter' ? '/missions' : '/pets'} />;
}
