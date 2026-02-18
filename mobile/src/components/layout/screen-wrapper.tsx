import React from 'react';
import { View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenWrapperProps extends ViewProps {
  children: React.ReactNode;
  safeArea?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenWrapper({
  children,
  safeArea = true,
  edges = ['top'],
  className = '',
  ...props
}: ScreenWrapperProps) {
  if (safeArea) {
    return (
      <SafeAreaView edges={edges} className={`flex-1 bg-background ${className}`} {...props}>
        {children}
      </SafeAreaView>
    );
  }

  return (
    <View className={`flex-1 bg-background ${className}`} {...props}>
      {children}
    </View>
  );
}
