import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

interface AppIconProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
}

export function AppIcon({ icon, size = 'md', selected = false }: AppIconProps) {
  const sizeMap = {
    sm: { container: 40, fontSize: 20 },
    md: { container: 48, fontSize: 24 },
    lg: { container: 56, fontSize: 28 },
  };

  const { container, fontSize } = sizeMap[size];

  return (
    <View
      style={[
        styles.container,
        { width: container, height: container, borderRadius: container / 4 },
        selected && styles.selected,
      ]}
    >
      <Text style={{ fontSize }}>{icon}</Text>
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
    backgroundColor: colors.accent,
  },
});
