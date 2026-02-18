import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronRight,
  Edit3,
  Lock,
  Bell,
  Info,
  LogOut,
} from 'lucide-react-native';

import type { ProfileStackParamList } from '~/navigation/profile-stack';
import { ScreenWrapper } from '~/components/layout/screen-wrapper';
import { Header } from '~/components/layout/header';
import { Avatar } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { useAuthStore } from '~/store/authStore';
import { COLORS } from '~/lib/constants';

type ProfileViewNav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileView'>;

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  showChevron?: boolean;
  danger?: boolean;
}

function MenuItem({ icon, label, onPress, showChevron = true, danger = false }: MenuItemProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center py-3.5 px-4 border-b border-border"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="mr-3">{icon}</View>
      <Text
        className={`flex-1 text-base ${
          danger ? 'text-danger font-medium' : 'text-secondary-800'
        }`}
      >
        {label}
      </Text>
      {showChevron && <ChevronRight size={18} color={COLORS.muted} />}
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<ProfileViewNav>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }, [logout]);

  const handleEditProfile = useCallback(() => {
    navigation.navigate('ProfileEdit');
  }, [navigation]);

  const handleChangePassword = useCallback(() => {
    navigation.navigate('ChangePassword');
  }, [navigation]);

  const handleNotificationSettings = useCallback(() => {
    navigation.navigate('NotificationSettings');
  }, [navigation]);

  const handleAbout = useCallback(() => {
    Alert.alert(
      'TaskBoard Mobile',
      'Version 1.0.0\n\nA collaborative project management application.',
    );
  }, []);

  return (
    <ScreenWrapper>
      <Header title="Profile" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <View className="items-center pt-8 pb-6 bg-white border-b border-border">
          <Avatar
            name={user?.fullName}
            imageUrl={user?.avatarUrl}
            size="xl"
          />
          <Text className="text-xl font-bold text-secondary-800 mt-4">
            {user?.fullName || 'User'}
          </Text>
          <Text className="text-sm text-muted mt-1">{user?.email || ''}</Text>
          {user?.jobTitle && (
            <Text className="text-sm text-muted mt-0.5">{user.jobTitle}</Text>
          )}
        </View>

        {/* Menu Items */}
        <View className="mt-4 mx-4">
          <Card variant="outlined" className="p-0 overflow-hidden">
            <MenuItem
              icon={<Edit3 size={20} color={COLORS.primary} />}
              label="Edit Profile"
              onPress={handleEditProfile}
            />
            <MenuItem
              icon={<Lock size={20} color={COLORS.muted} />}
              label="Change Password"
              onPress={handleChangePassword}
            />
            <MenuItem
              icon={<Bell size={20} color={COLORS.muted} />}
              label="Notification Settings"
              onPress={handleNotificationSettings}
            />
            <MenuItem
              icon={<Info size={20} color={COLORS.muted} />}
              label="About"
              onPress={handleAbout}
              showChevron={false}
            />
          </Card>
        </View>

        {/* Logout Button */}
        <View className="mt-8 mx-4">
          <Button
            title="Log Out"
            onPress={handleLogout}
            variant="danger"
            fullWidth
            size="lg"
            icon={<LogOut size={18} color="#FFF" />}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
