import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { colors } from '@/theme';

type FeatherName = ComponentProps<typeof Feather>['name'];
type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type IconName = FeatherName | `mci:${MciName}`;

type Props = { name: IconName; size?: number; color?: keyof typeof colors | string };

/** One icon entry point. Prefix with `mci:` for MaterialCommunityIcons (animals, paws), otherwise Feather. */
export function Icon({ name, size = 20, color = 'text' }: Props) {
  const tint = color in colors ? colors[color as keyof typeof colors] : color;
  if (name.startsWith('mci:')) {
    return <MaterialCommunityIcons name={name.slice(4) as MciName} size={size} color={tint} />;
  }
  return <Feather name={name as FeatherName} size={size} color={tint} />;
}
