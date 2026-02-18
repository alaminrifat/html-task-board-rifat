import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Switch, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { Bell, Clock, Mail } from 'lucide-react-native';

import { ScreenWrapper } from '~/components/layout/screen-wrapper';
import { Header } from '~/components/layout/header';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { userService } from '~/services/userService';
import { useAuthStore } from '~/store/authStore';
import { COLORS } from '~/lib/constants';

type DigestFrequency = 'OFF' | 'DAILY' | 'WEEKLY';

const DIGEST_OPTIONS: { value: DigestFrequency; label: string; description: string }[] = [
  { value: 'OFF', label: 'Off', description: 'No email digests' },
  { value: 'DAILY', label: 'Daily', description: 'Receive a daily summary' },
  { value: 'WEEKLY', label: 'Weekly', description: 'Receive a weekly summary' },
];

export function NotificationSettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState<DigestFrequency>('OFF');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setPushEnabled(user.pushEnabled ?? true);
      setDigestFrequency((user.digestFrequency as DigestFrequency) ?? 'OFF');
    }
  }, [user]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await userService.updateNotifications({
        pushEnabled,
        digestFrequency,
      });
      await refreshUser();
      Toast.show({
        type: 'success',
        text1: 'Settings Saved',
        text2: 'Your notification preferences have been updated.',
      });
    } catch {
      Alert.alert('Error', 'Failed to update notification settings.');
    } finally {
      setIsSaving(false);
    }
  }, [pushEnabled, digestFrequency, refreshUser]);

  return (
    <ScreenWrapper>
      <Header title="Notification Settings" showBack />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Push Notifications */}
        <Card variant="outlined" className="mb-4">
          <View className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center flex-1 mr-4">
              <Bell size={20} color={COLORS.primary} />
              <View className="ml-3 flex-1">
                <Text className="text-base font-medium text-secondary-800">
                  Push Notifications
                </Text>
                <Text className="text-sm text-muted mt-0.5">
                  Receive push notifications for task updates, mentions, and assignments.
                </Text>
              </View>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Email Digest */}
        <Text className="text-sm font-semibold text-secondary-600 uppercase tracking-wide mb-2 ml-1">
          Email Digest
        </Text>
        <Card variant="outlined" className="mb-6">
          {DIGEST_OPTIONS.map((option, index) => {
            const isSelected = digestFrequency === option.value;
            return (
              <View
                key={option.value}
                className={`flex-row items-center justify-between p-4 ${
                  index < DIGEST_OPTIONS.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <View className="flex-row items-center flex-1 mr-4">
                  {option.value === 'OFF' ? (
                    <Mail size={18} color={COLORS.muted} />
                  ) : (
                    <Clock size={18} color={COLORS.muted} />
                  )}
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium text-secondary-800">
                      {option.label}
                    </Text>
                    <Text className="text-sm text-muted mt-0.5">
                      {option.description}
                    </Text>
                  </View>
                </View>
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    isSelected ? 'border-primary' : 'border-border'
                  }`}
                >
                  {isSelected && (
                    <View
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS.primary }}
                    />
                  )}
                </View>
                <View className="absolute inset-0">
                  <Text
                    className="flex-1"
                    onPress={() => setDigestFrequency(option.value)}
                    style={{ opacity: 0 }}
                  >
                    select
                  </Text>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Save Button */}
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </ScreenWrapper>
  );
}
