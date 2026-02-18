import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, CheckCircle } from 'lucide-react-native';

import type { AuthStackParamList } from '~/navigation/auth-stack';
import { authService } from '~/services/authService';
import { resetPasswordSchema, type ResetPasswordFormData } from '~/utils/validations/auth';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { ScreenWrapper } from '~/components/layout/screen-wrapper';
import { COLORS } from '~/lib/constants';

type ResetNav = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetRoute = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>['route'];

export function ResetPasswordScreen() {
  const navigation = useNavigation<ResetNav>();
  const route = useRoute<ResetRoute>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { token } = route.params;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await authService.resetPassword({ token, password: data.password });
      setIsSuccess(true);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setServerError(err?.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
        >
          <View className="bg-white rounded-xl border border-border p-6">
            <Text className="text-xl font-semibold text-secondary-800 mb-2">
              Reset Password
            </Text>
            <Text className="text-sm text-muted mb-6">
              Enter your new password below.
            </Text>

            {isSuccess ? (
              <View className="items-center py-4">
                <CheckCircle size={48} color={COLORS.success} />
                <Text className="text-base font-medium text-secondary-800 mt-4 text-center">
                  Password reset successful
                </Text>
                <Text className="text-sm text-muted mt-2 text-center">
                  You can now login with your new password.
                </Text>
                <Button
                  title="Go to Login"
                  onPress={() => navigation.navigate('Login')}
                  variant="primary"
                  fullWidth
                  style={{ marginTop: 24 }}
                />
              </View>
            ) : (
              <>
                {serverError && (
                  <View className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20">
                    <Text className="text-sm text-danger">{serverError}</Text>
                  </View>
                )}

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="New Password"
                      placeholder="Minimum 8 characters"
                      isPassword
                      icon={<Lock size={18} color={COLORS.muted} />}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.password?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Confirm Password"
                      placeholder="Re-enter your password"
                      isPassword
                      icon={<Lock size={18} color={COLORS.muted} />}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.confirmPassword?.message}
                    />
                  )}
                />

                <Button
                  title={isSubmitting ? 'Resetting...' : 'Reset Password'}
                  onPress={handleSubmit(onSubmit)}
                  loading={isSubmitting}
                  fullWidth
                  size="lg"
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
