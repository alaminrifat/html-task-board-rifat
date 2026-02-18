import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, ActivityIndicator } from 'react-native';
import { COLORS } from '~/lib/constants';

export function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: COLORS.primary }}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: 'center',
        }}
      >
        <Text
          className="text-5xl font-bold tracking-tighter"
          style={{ color: '#FFFFFF' }}
        >
          TaskBoard
        </Text>
        <View className="mt-6">
          <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
        </View>
      </Animated.View>
    </View>
  );
}
