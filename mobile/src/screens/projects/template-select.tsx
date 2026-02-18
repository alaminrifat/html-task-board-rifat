import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LayoutGrid, Minus, Paintbrush, CheckCircle } from 'lucide-react-native';

import type { ProjectStackParamList } from '~/navigation/project-stack';
import { Card } from '~/components/ui/card';
import { COLORS } from '~/lib/constants';

type Nav = NativeStackNavigationProp<ProjectStackParamList, 'TemplateSelect'>;

interface TemplateOption {
  key: 'DEFAULT' | 'MINIMAL' | 'CUSTOM';
  title: string;
  description: string;
  columns: string[];
  icon: React.ReactNode;
  color: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    key: 'DEFAULT',
    title: 'Default',
    description: 'A classic Kanban board with 4 columns for a complete workflow.',
    columns: ['To Do', 'In Progress', 'Review', 'Done'],
    icon: <LayoutGrid size={28} color={COLORS.primary} />,
    color: COLORS.primary,
  },
  {
    key: 'MINIMAL',
    title: 'Minimal',
    description: 'A simple 2-column board for straightforward task tracking.',
    columns: ['To Do', 'Done'],
    icon: <Minus size={28} color={COLORS.success} />,
    color: COLORS.success,
  },
  {
    key: 'CUSTOM',
    title: 'Custom',
    description: 'Start with an empty board and add your own columns.',
    columns: [],
    icon: <Paintbrush size={28} color={COLORS.warning} />,
    color: COLORS.warning,
  },
];

export function TemplateSelectScreen() {
  const navigation = useNavigation<Nav>();

  const handleSelect = (template: string) => {
    navigation.navigate({
      name: 'NewProject',
      params: { template },
      merge: true,
    });
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text className="text-sm text-muted mb-4">
        Choose a template to get started quickly, or create a custom board from
        scratch.
      </Text>

      {TEMPLATES.map((template) => (
        <TouchableOpacity
          key={template.key}
          onPress={() => handleSelect(template.key)}
          activeOpacity={0.7}
          className="mb-4"
        >
          <Card>
            <View className="flex-row items-start">
              {/* Icon */}
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: `${template.color}15` }}
              >
                {template.icon}
              </View>

              {/* Content */}
              <View className="flex-1">
                <Text className="text-base font-semibold text-secondary-800 mb-1">
                  {template.title}
                </Text>
                <Text className="text-sm text-muted mb-3">
                  {template.description}
                </Text>

                {/* Column Preview */}
                {template.columns.length > 0 ? (
                  <View className="flex-row flex-wrap">
                    {template.columns.map((col, idx) => (
                      <View
                        key={col}
                        className="flex-row items-center mr-3 mb-1"
                      >
                        <View
                          className="w-2 h-2 rounded-full mr-1.5"
                          style={{ backgroundColor: template.color }}
                        />
                        <Text className="text-xs text-muted">{col}</Text>
                        {idx < template.columns.length - 1 && (
                          <Text className="text-xs text-border ml-2">→</Text>
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="text-xs text-muted italic">
                    No columns - you'll add them yourself
                  </Text>
                )}
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
