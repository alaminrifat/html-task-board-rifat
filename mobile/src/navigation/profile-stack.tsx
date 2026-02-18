import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '~/lib/constants';

import { ProfileScreen } from '~/screens/profile/view';
import { ProfileEditScreen } from '~/screens/profile/edit';
import { ChangePasswordScreen } from '~/screens/profile/change-password';
import { NotificationSettingsScreen } from '~/screens/profile/notification-settings';

export type ProfileStackParamList = {
  ProfileView: undefined;
  ProfileEdit: undefined;
  ChangePassword: undefined;
  NotificationSettings: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.secondary,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { paddingTop: 8, backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="ProfileView"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
}
