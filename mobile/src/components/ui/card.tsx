import React from 'react';
import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined';
}

export function Card({ children, variant = 'default', className = '', ...props }: CardProps) {
  const baseClasses = 'rounded-xl p-4';
  const variantClasses = {
    default: 'bg-white shadow-sm',
    outlined: 'bg-white border border-border',
  }[variant];

  return (
    <View className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </View>
  );
}
