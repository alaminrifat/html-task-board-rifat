import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, type TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { COLORS } from '~/lib/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  icon,
  isPassword = false,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-secondary-800 mb-1.5">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center border rounded-lg px-3 bg-white ${
          error
            ? 'border-danger'
            : isFocused
              ? 'border-primary'
              : 'border-border'
        }`}
      >
        {icon && <View className="mr-2">{icon}</View>}
        <TextInput
          className="flex-1 py-3 text-base text-secondary-800"
          placeholderTextColor={COLORS.muted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={20} color={COLORS.muted} />
            ) : (
              <Eye size={20} color={COLORS.muted} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-xs text-danger mt-1">{error}</Text>
      )}
    </View>
  );
}
