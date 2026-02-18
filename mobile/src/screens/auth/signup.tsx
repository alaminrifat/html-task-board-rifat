import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, Briefcase } from 'lucide-react-native';

import type { AuthStackParamList } from '~/navigation/auth-stack';
import { useAuthStore } from '~/store/authStore';
import { registerSchema, type RegisterFormData } from '~/utils/validations/auth';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { ScreenWrapper } from '~/components/layout/screen-wrapper';
import { COLORS } from '~/lib/constants';

type SignupNav = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
type SignupRoute = NativeStackScreenProps<AuthStackParamList, 'Signup'>['route'];

export function SignupScreen() {
  const navigation = useNavigation<SignupNav>();
  const route = useRoute<SignupRoute>();
  const register = useAuthStore((s) => s.register);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const invitationToken = route.params?.invitationToken;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      jobTitle: '',
      password: '',
      confirmPassword: '',
      terms: false as unknown as true,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await register({
        name: data.fullName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        jobTitle: data.jobTitle,
        invitationToken,
      });
      navigation.navigate('Login');
    } catch (error: unknown) {
      const err = error as { message?: string };
      setServerError(err?.message || 'Registration failed. Please try again.');
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
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold" style={{ color: COLORS.primary }}>
              TaskBoard
            </Text>
            <Text className="text-sm text-muted mt-1">Create your account</Text>
          </View>

          {/* Card */}
          <View className="bg-white rounded-xl border border-border p-6">
            {serverError && (
              <View className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20">
                <Text className="text-sm text-danger">{serverError}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  icon={<User size={18} color={COLORS.muted} />}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.fullName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="Email address"
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

            <Controller
              control={control}
              name="jobTitle"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Job Title (Optional)"
                  placeholder="e.g. Product Manager"
                  icon={<Briefcase size={18} color={COLORS.muted} />}
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
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

            {/* Terms */}
            <Controller
              control={control}
              name="terms"
              render={({ field: { onChange, value } }) => (
                <View className="mb-4">
                  <View className="flex-row items-center">
                    <Switch
                      value={value as unknown as boolean}
                      onValueChange={onChange}
                      trackColor={{ false: COLORS.border, true: COLORS.primary }}
                      thumbColor="#FFFFFF"
                    />
                    <Text className="ml-2 text-sm text-secondary-700 flex-1">
                      I agree to the Terms of Service and Privacy Policy
                    </Text>
                  </View>
                  {errors.terms && (
                    <Text className="text-xs text-danger mt-1">{errors.terms.message}</Text>
                  )}
                </View>
              )}
            />

            <Button
              title={isSubmitting ? 'Creating account...' : 'Sign Up'}
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              fullWidth
              size="lg"
            />
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-6 mb-4">
            <Text className="text-xs text-muted">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-xs font-medium" style={{ color: COLORS.primary }}>
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
