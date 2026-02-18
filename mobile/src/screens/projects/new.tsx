import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  FileText,
  CalendarDays,
  LayoutTemplate,
  ChevronRight,
} from 'lucide-react-native';

import type { ProjectStackParamList } from '~/navigation/project-stack';
import { projectService } from '~/services/projectService';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { COLORS } from '~/lib/constants';

type Nav = NativeStackNavigationProp<ProjectStackParamList, 'NewProject'>;
type Route = RouteProp<ProjectStackParamList, 'NewProject'>;

const TEMPLATE_LABELS: Record<string, string> = {
  DEFAULT: 'Default (4 columns)',
  MINIMAL: 'Minimal (2 columns)',
  CUSTOM: 'Custom (empty board)',
};

export function NewProjectScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const selectedTemplate = route.params?.template || 'DEFAULT';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [showDateInput, setShowDateInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});

  const validate = (): boolean => {
    const newErrors: { title?: string } = {};
    if (!title.trim()) {
      newErrors.title = 'Project title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const project = await projectService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        template: selectedTemplate as 'DEFAULT' | 'MINIMAL' | 'CUSTOM',
        deadline: deadline || undefined,
      });

      navigation.replace('Board', {
        projectId: project.id,
        projectTitle: project.title,
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      Alert.alert('Error', err?.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (text: string) => {
    // Allow only digits and hyphens, auto-format YYYY-MM-DD
    const cleaned = text.replace(/[^0-9-]/g, '');
    setDeadline(cleaned);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Input
          label="Project Title"
          placeholder="Enter project title"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (errors.title) setErrors({});
          }}
          error={errors.title}
          icon={<FileText size={18} color={COLORS.muted} />}
        />

        {/* Description */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-secondary-800 mb-1.5">
            Description
          </Text>
          <View className="border border-border rounded-lg bg-white px-3">
            <Input
              placeholder="Describe your project (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />
          </View>
        </View>

        {/* Deadline */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-secondary-800 mb-1.5">
            Deadline
          </Text>
          <TouchableOpacity
            onPress={() => setShowDateInput(!showDateInput)}
            activeOpacity={0.7}
          >
            <Card variant="outlined">
              <View className="flex-row items-center">
                <CalendarDays size={18} color={COLORS.muted} />
                <Text
                  className={`flex-1 ml-3 text-sm ${
                    deadline ? 'text-secondary-800' : 'text-muted'
                  }`}
                >
                  {deadline || 'Set a deadline (optional)'}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
          {showDateInput && (
            <View className="mt-2">
              <Input
                placeholder="YYYY-MM-DD"
                value={deadline}
                onChangeText={handleDateChange}
                keyboardType="numeric"
                maxLength={10}
                icon={<CalendarDays size={18} color={COLORS.muted} />}
              />
            </View>
          )}
        </View>

        {/* Template Selection */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-secondary-800 mb-1.5">
            Board Template
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('TemplateSelect')}
            activeOpacity={0.7}
          >
            <Card variant="outlined">
              <View className="flex-row items-center">
                <LayoutTemplate size={18} color={COLORS.primary} />
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-medium text-secondary-800">
                    {TEMPLATE_LABELS[selectedTemplate] || selectedTemplate}
                  </Text>
                  <Text className="text-xs text-muted mt-0.5">
                    Tap to change template
                  </Text>
                </View>
                <ChevronRight size={18} color={COLORS.muted} />
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Create Button */}
        <Button
          title={isSubmitting ? 'Creating...' : 'Create Project'}
          onPress={handleCreate}
          loading={isSubmitting}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
