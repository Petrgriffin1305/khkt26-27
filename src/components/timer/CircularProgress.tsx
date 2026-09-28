import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/theme/colors';

interface CircularProgressProps {
  /** Progress value from 0 to 1 (e.g., 0.5 = 50%) */
  progress: number;
  /** Size of the circle (width & height) */
  size?: number;
  /** Stroke width of the progress ring */
  strokeWidth?: number;
  /** Color of the progress arc */
  progressColor?: string;
  /** Color of the background track */
  trackColor?: string;
  /** Content rendered in the center of the ring */
  children?: React.ReactNode;
}

/**
 * Circular progress ring built with react-native-svg.
 * Displays a progress arc around centered content (e.g., countdown timer).
 */
export function CircularProgress({
  progress,
  size = 260,
  strokeWidth = 12,
  progressColor = colors.accent,
  trackColor = colors.accentSoft,
  children,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const strokeDashoffset = circumference * (1 - clampedProgress);
  const center = size / 2;

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          // Start from top (rotate -90 degrees around center)
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      {/* Centered content */}
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
