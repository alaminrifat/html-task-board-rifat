import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';

import type { AuthStackParamList } from '~/navigation/auth-stack';
import { authService } from '~/services/authService';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '~/utils/validations/auth';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { ScreenWrapper } from '~/components/layout/screen-wrapper';
import { COLORS } from '~/lib/constants';

type ForgotNav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotNav>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await authService.forgotPassword({ email: data.email });
      setIsSuccess(true);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setServerError(err?.message || 'Failed to send reset email.');
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
          {/* Back */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="flex-row items-center mb-8"
          >
            <ArrowLeft size={20} color={COLORS.muted} />
            <Text className="text-sm text-muted ml-1">Back to Login</Text>
          </TouchableOpacity>

          <View className="bg-white rounded-xl border border-border p-6">
            <Text className="text-xl font-semibold text-secondary-800 mb-2">
              Forgot Password
            </Text>
            <Text className="text-sm text-muted mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            {isSuccess ? (
              <View className="items-center py-4">
                <CheckCircle size={48} color={COLORS.success} />
                <Text className="text-base font-medium text-secondary-800 mt-4 text-center">
                  Check your email
                </Text>
                <Text className="text-sm text-muted mt-2 text-center">
                  We've sent a password reset link to your email address.
                </Text>
                <Button
                  title="Back to Login"
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
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Email"
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      icon={<Mail size={18} color={COLORS.muted} />}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.email?.message}
                    />
                  )}
                />

                <Button
                  title={isSubmitting ? 'Sending...' : 'Send Reset Link'}
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
