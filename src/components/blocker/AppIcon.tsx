import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { resolveAppIcon } from './appIconMap';
import type { AppCategory } from '@/types';

interface AppIconProps {
  /** App identifier (matches keys in the brand icon map). */
  id?: string;
  name?: string;
  packageName?: string;
  category?: AppCategory;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
}

export function AppIcon({
  id,
  name,
  packageName,
  category,
  size = 'md',
  selected = false,
}: AppIconProps) {
  const sizeMap = {
    sm: { container: 40, iconSize: 20 },
    md: { container: 48, iconSize: 24 },
    lg: { container: 56, iconSize: 28 },
  };

  const { container, iconSize } = sizeMap[size];
  const spec = resolveAppIcon({ id, name, packageName, category });
  const IconComponent =
    spec.family === 'Ionicons' ? Ionicons : MaterialCommunityIcons;

  return (
    <View
      style={[
        styles.container,
        {
          width: container,
          height: container,
          borderRadius: container / 4,
          backgroundColor: selected ? '#FFFFFF' : `${spec.color}1A`,
        },
        selected && styles.selected,
      ]}
    >
      <IconComponent
        name={spec.name as any}
        size={iconSize}
        color={selected ? spec.color : spec.color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
