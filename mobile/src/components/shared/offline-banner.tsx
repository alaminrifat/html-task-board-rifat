import React from 'react';
import { View, Text } from 'react-native';
import { WifiOff } from 'lucide-react-native';

export function OfflineBanner() {
  return (
    <View className="bg-warning flex-row items-center justify-center py-2 px-4">
      <WifiOff size={14} color="#FFFFFF" />
      <Text className="text-xs font-medium text-white ml-2">
        You're offline. Some features may be unavailable.
      </Text>
    </View>
  );
}
