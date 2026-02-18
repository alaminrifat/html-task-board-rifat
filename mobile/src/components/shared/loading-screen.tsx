import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '~/lib/constants';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text className="text-sm text-muted mt-3">{message}</Text>
    </View>
  );
}
