import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '~/screens/auth/login';
import { SignupScreen } from '~/screens/auth/signup';
import { ForgotPasswordScreen } from '~/screens/auth/forgot-password';
import { ResetPasswordScreen } from '~/screens/auth/reset-password';

export type AuthStackParamList = {
  Login: undefined;
  Signup: { invitationToken?: string } | undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}
