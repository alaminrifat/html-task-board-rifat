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
import { Mail, Lock } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';

import type { AuthStackParamList } from '~/navigation/auth-stack';
import { useAuthStore } from '~/store/authStore';
import { loginSchema, type LoginFormData } from '~/utils/validations/auth';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { ScreenWrapper } from '~/components/layout/screen-wrapper';
import { COLORS } from '~/lib/constants';

WebBrowser.maybeCompleteAuthSession();

type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<LoginNav>();
  const login = useAuthStore((s) => s.login);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await login(data.email, data.password);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setServerError(err?.message || 'Invalid credentials. Please try again.');
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
          {/* Logo */}
          <View className="items-center mb-10">
            <Text className="text-3xl font-bold" style={{ color: COLORS.primary }}>
              TaskBoard
            </Text>
          </View>

          {/* Card */}
          <View className="bg-white rounded-xl border border-border p-6">
            {/* Server Error */}
            {serverError && (
              <View className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20">
                <Text className="text-sm text-danger">{serverError}</Text>
              </View>
            )}

            {/* Email */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="Email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  icon={<Mail size={18} color={COLORS.muted} />}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            {/* Password */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Password"
                  isPassword
                  icon={<Lock size={18} color={COLORS.muted} />}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            {/* Forgot Password */}
            <View className="flex-row justify-end mb-4 -mt-2">
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text className="text-xs font-medium text-muted">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <Button
              title={isSubmitting ? 'Logging in...' : 'Login'}
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              fullWidth
              size="lg"
            />

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-border" />
              <Text className="mx-4 text-xs text-muted font-medium">Or continue with</Text>
              <View className="flex-1 h-px bg-border" />
            </View>

            {/* Google Button */}
            <Button
              title="Continue with Google"
              onPress={() => {
                // Google OAuth handled via expo-auth-session
              }}
              variant="outline"
              fullWidth
              size="lg"
            />
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-6 mb-4">
            <Text className="text-xs text-muted">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text className="text-xs font-medium" style={{ color: COLORS.primary }}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
