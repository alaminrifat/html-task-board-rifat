import React from 'react';
import { View, Text } from 'react-native';
import { PRIORITY_COLORS } from '~/lib/constants';

interface BadgeProps {
  label: string;
  color?: string;
  variant?: 'filled' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({ label, color, variant = 'filled', size = 'sm' }: BadgeProps) {
  const bgColor = variant === 'filled' ? (color || '#E5E7EB') : 'transparent';
  const textColor = variant === 'filled' ? '#FFFFFF' : (color || '#6B7280');
  const borderColor = variant === 'outline' ? (color || '#E5E7EB') : 'transparent';

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const textSizeClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <View
      className={`rounded-full ${sizeClasses}`}
      style={{
        backgroundColor: bgColor,
        borderWidth: variant === 'outline' ? 1 : 0,
        borderColor,
      }}
    >
      <Text className={`font-medium ${textSizeClass}`} style={{ color: textColor }}>
        {label}
      </Text>
    </View>
  );
}

interface PriorityBadgeProps {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <Badge
      label={priority}
      color={PRIORITY_COLORS[priority]}
      variant="filled"
      size="sm"
    />
  );
}
