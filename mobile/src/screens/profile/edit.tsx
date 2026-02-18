import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';

import type { ProfileStackParamList } from '~/navigation/profile-stack';
import { ScreenWrapper } from '~/components/layout/screen-wrapper';
import { Avatar } from '~/components/ui/avatar';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { userService } from '~/services/userService';
import { useAuthStore } from '~/store/authStore';
import { COLORS } from '~/lib/constants';

type ProfileEditNav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileEdit'>;

export function ProfileEditScreen() {
  const navigation = useNavigation<ProfileEditNav>();
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handlePickImage = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please grant access to your photo library to change your avatar.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setAvatarUri(asset.uri);

    // Upload immediately
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      const fileName = asset.uri.split('/').pop() || 'avatar.jpg';
      const fileType = asset.mimeType || 'image/jpeg';

      formData.append('avatar', {
        uri: asset.uri,
        name: fileName,
        type: fileType,
      } as any);

      await userService.uploadAvatar(formData);
      await refreshUser();
    } catch {
      Alert.alert('Error', 'Failed to upload avatar. Please try again.');
      setAvatarUri(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [refreshUser]);

  const handleSave = useCallback(async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation', 'Full name is required.');
      return;
    }

    setIsSaving(true);
    try {
      // The API uses firstName/lastName split -- let's split the fullName
      const parts = fullName.trim().split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      await userService.updateMe({
        firstName,
        lastName,
        jobTitle: jobTitle.trim() || undefined,
      });

      await refreshUser();
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [fullName, jobTitle, refreshUser, navigation]);

  const displayAvatarUrl = avatarUri || user?.avatarUrl;

  return (
    <ScreenWrapper safeArea={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View className="items-center pt-8 pb-6">
            <View className="relative">
              <Avatar
                name={user?.fullName}
                imageUrl={displayAvatarUrl ?? undefined}
                size="xl"
              />
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center border-2 border-white"
                style={{ backgroundColor: COLORS.primary }}
                activeOpacity={0.7}
              >
                <Camera size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
            {isUploadingAvatar && (
              <Text className="text-xs text-primary mt-2">Uploading avatar...</Text>
            )}
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7} className="mt-3">
              <Text className="text-sm font-medium" style={{ color: COLORS.primary }}>
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View className="px-6">
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <Input
              label="Job Title"
              placeholder="e.g. Software Engineer"
              value={jobTitle}
              onChangeText={setJobTitle}
              autoCapitalize="words"
            />
          </View>
        </ScrollView>

        {/* Sticky Save Button */}
        <View className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-border">
          <Button
            title={isSaving ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving || isUploadingAvatar}
            fullWidth
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
