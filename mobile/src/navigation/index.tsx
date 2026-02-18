import React from 'react';
import { useAuthStore } from '~/store/authStore';
import { AuthStack } from './auth-stack';
import { AppTabs } from './app-tabs';
import { SplashScreen } from '~/screens/splash';

export function RootNavigator() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isLoading) {
    return <SplashScreen />;
  }

  return isAuthenticated ? <AppTabs /> : <AuthStack />;
}
