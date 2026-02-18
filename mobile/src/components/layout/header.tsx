import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, MoreVertical } from 'lucide-react-native';
import { COLORS } from '~/lib/constants';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  onMorePress?: () => void;
}

export function Header({ title, subtitle, showBack, onBack, rightAction, onMorePress }: HeaderProps) {
  const navigation = useNavigation();
  const handleBack = onBack || (showBack ? () => navigation.goBack() : undefined);

  return (
    <View className="flex-row items-center px-4 py-3 bg-white border-b border-border">
      {handleBack && (
        <TouchableOpacity onPress={handleBack} className="mr-3 p-1" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color={COLORS.secondary} />
        </TouchableOpacity>
      )}
      <View className="flex-1">
        <Text className="text-lg font-semibold text-secondary-800" numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-xs text-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightAction}
      {onMorePress && (
        <TouchableOpacity onPress={onMorePress} className="ml-2 p-1">
          <MoreVertical size={20} color={COLORS.muted} />
        </TouchableOpacity>
      )}
    </View>
  );
}
