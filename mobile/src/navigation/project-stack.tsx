import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '~/lib/constants';

import { ProjectListScreen } from '~/screens/projects/list';
import { NewProjectScreen } from '~/screens/projects/new';
import { TemplateSelectScreen } from '~/screens/projects/template-select';
import { BoardScreen } from '~/screens/projects/board';
import { CalendarScreen } from '~/screens/projects/calendar';
import { ProjectDashboardScreen } from '~/screens/projects/dashboard';
import { ProjectSettingsScreen } from '~/screens/projects/settings';
import { TrashScreen } from '~/screens/projects/trash';
import { TaskDetailScreen } from '~/screens/tasks/task-detail';
import { InvitationAcceptScreen } from '~/screens/invitations/accept';

export type ProjectStackParamList = {
  ProjectList: undefined;
  NewProject: { template?: string } | undefined;
  TemplateSelect: undefined;
  Board: { projectId: string; projectTitle: string };
  Calendar: { projectId: string; projectTitle: string };
  ProjectDashboard: { projectId: string; projectTitle: string };
  ProjectSettings: { projectId: string; projectTitle: string };
  Trash: { projectId: string; projectTitle: string };
  TaskDetail: { projectId: string; taskId: string };
  InvitationAccept: { token: string };
};

const Stack = createNativeStackNavigator<ProjectStackParamList>();

export function ProjectStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.secondary,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { paddingTop: 8, backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="ProjectList"
        component={ProjectListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NewProject"
        component={NewProjectScreen}
        options={{ title: 'New Project' }}
      />
      <Stack.Screen
        name="TemplateSelect"
        component={TemplateSelectScreen}
        options={{ title: 'Choose Template' }}
      />
      <Stack.Screen
        name="Board"
        component={BoardScreen}
        options={({ route }) => ({ title: route.params.projectTitle })}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: 'Calendar' }}
      />
      <Stack.Screen
        name="ProjectDashboard"
        component={ProjectDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Stack.Screen
        name="ProjectSettings"
        component={ProjectSettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="Trash"
        component={TrashScreen}
        options={{ title: 'Trash' }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ title: 'Task' }}
      />
      <Stack.Screen
        name="InvitationAccept"
        component={InvitationAcceptScreen}
        options={{ title: 'Invitation' }}
      />
    </Stack.Navigator>
  );
}
