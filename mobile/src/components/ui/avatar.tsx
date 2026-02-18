import React from 'react';
import { View, Text, Image } from 'react-native';
import { COLORS } from '~/lib/constants';

interface AvatarProps {
  name?: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = {
  sm: { container: 32, text: 12 },
  md: { container: 40, text: 14 },
  lg: { container: 56, text: 20 },
  xl: { container: 80, text: 28 },
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorForName(name?: string): string {
  if (!name) return COLORS.muted;
  const colors = ['#4A90D9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, imageUrl, size = 'md' }: AvatarProps) {
  const { container, text } = SIZES[size];

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{
          width: container,
          height: container,
          borderRadius: container / 2,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: container,
        height: container,
        borderRadius: container / 2,
        backgroundColor: getColorForName(name),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: text, fontWeight: '600' }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
