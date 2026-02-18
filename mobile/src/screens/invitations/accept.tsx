import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  Mail,
  CheckCircle,
  XCircle,
  UserPlus,
  AlertTriangle,
} from 'lucide-react-native';

import type { ProjectStackParamList } from '~/navigation/project-stack';
import { ScreenWrapper } from '~/components/layout/screen-wrapper';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Avatar } from '~/components/ui/avatar';
import { memberService } from '~/services/memberService';
import type { Invitation } from '~/types';
import { COLORS } from '~/lib/constants';

type InvitationAcceptNav = NativeStackNavigationProp<ProjectStackParamList, 'InvitationAccept'>;
type InvitationAcceptRoute = RouteProp<ProjectStackParamList, 'InvitationAccept'>;

type ScreenState = 'loading' | 'ready' | 'accepting' | 'declining' | 'accepted' | 'declined' | 'error';

export function InvitationAcceptScreen() {
  const navigation = useNavigation<InvitationAcceptNav>();
  const route = useRoute<InvitationAcceptRoute>();
  const { token } = route.params;

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const result = await memberService.getInvitationByToken(token);
        setInvitation(result);
        setScreenState('ready');
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Failed to load invitation details.';
        setErrorMessage(message);
        setScreenState('error');
      }
    };
    fetchInvitation();
  }, [token]);

  const handleAccept = useCallback(async () => {
    setScreenState('accepting');
    try {
      await memberService.acceptInvitation(token);
      setScreenState('accepted');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to accept invitation.';
      setErrorMessage(message);
      setScreenState('error');
    }
  }, [token]);

  const handleDecline = useCallback(async () => {
    setScreenState('declining');
    try {
      await memberService.declineInvitation(token);
      setScreenState('declined');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to decline invitation.';
      setErrorMessage(message);
      setScreenState('error');
    }
  }, [token]);

  const handleGoToProject = useCallback(() => {
    if (invitation?.projectId) {
      navigation.replace('Board', {
        projectId: invitation.projectId,
        projectTitle: invitation.project?.title || 'Project',
      });
    } else {
      navigation.replace('ProjectList');
    }
  }, [invitation, navigation]);

  const handleGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('ProjectList');
    }
  }, [navigation]);

  // --- Loading State ---
  if (screenState === 'loading') {
    return (
      <ScreenWrapper safeArea={false}>
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="text-sm text-muted mt-4">Loading invitation...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // --- Error State ---
  if (screenState === 'error') {
    return (
      <ScreenWrapper safeArea={false}>
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: '#FEE2E2' }}
          >
            <AlertTriangle size={32} color={COLORS.danger} />
          </View>
          <Text className="text-lg font-semibold text-secondary-800 text-center mb-2">
            Something went wrong
          </Text>
          <Text className="text-sm text-muted text-center mb-6">{errorMessage}</Text>
          <Button title="Go Back" onPress={handleGoBack} variant="primary" />
        </View>
      </ScreenWrapper>
    );
  }

  // --- Accepted State ---
  if (screenState === 'accepted') {
    return (
      <ScreenWrapper safeArea={false}>
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: '#D1FAE5' }}
          >
            <CheckCircle size={32} color={COLORS.success} />
          </View>
          <Text className="text-xl font-bold text-secondary-800 text-center mb-2">
            Invitation Accepted
          </Text>
          <Text className="text-sm text-muted text-center mb-6">
            You have joined{' '}
            <Text className="font-semibold text-secondary-800">
              {invitation?.project?.title || 'the project'}
            </Text>
            . You can now access the project board.
          </Text>
          <Button title="Go to Project" onPress={handleGoToProject} variant="primary" size="lg" />
        </View>
      </ScreenWrapper>
    );
  }

  // --- Declined State ---
  if (screenState === 'declined') {
    return (
      <ScreenWrapper safeArea={false}>
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <XCircle size={32} color={COLORS.muted} />
          </View>
          <Text className="text-xl font-bold text-secondary-800 text-center mb-2">
            Invitation Declined
          </Text>
          <Text className="text-sm text-muted text-center mb-6">
            You have declined the invitation to{' '}
            <Text className="font-semibold text-secondary-800">
              {invitation?.project?.title || 'the project'}
            </Text>
            .
          </Text>
          <Button title="Go Back" onPress={handleGoBack} variant="outline" size="lg" />
        </View>
      </ScreenWrapper>
    );
  }

  // --- Ready State (invitation details with Accept/Decline) ---
  const isProcessing = screenState === 'accepting' || screenState === 'declining';

  return (
    <ScreenWrapper safeArea={false}>
      <View className="flex-1 justify-center px-6">
        <Card variant="outlined" className="p-6">
          {/* Header Icon */}
          <View className="items-center mb-6">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: COLORS.primaryLight }}
            >
              <Mail size={28} color={COLORS.primary} />
            </View>
            <Text className="text-xl font-bold text-secondary-800 text-center">
              Project Invitation
            </Text>
          </View>

          {/* Project Name */}
          <View className="items-center mb-6 py-4 bg-background rounded-lg">
            <Text className="text-xs text-muted uppercase tracking-wide mb-1">Project</Text>
            <Text className="text-lg font-semibold text-secondary-800 text-center">
              {invitation?.project?.title || 'Unknown Project'}
            </Text>
          </View>

          {/* Inviter Info */}
          <View className="flex-row items-center mb-6 px-2">
            <Avatar
              name={invitation?.inviter?.fullName}
              size="md"
            />
            <View className="ml-3">
              <Text className="text-xs text-muted">Invited by</Text>
              <Text className="text-sm font-semibold text-secondary-800">
                {invitation?.inviter?.fullName || 'Unknown'}
              </Text>
              <Text className="text-xs text-muted">
                {invitation?.inviter?.email || ''}
              </Text>
            </View>
          </View>

          {/* Invitation Status */}
          {invitation?.status === 'PENDING' && (
            <View className="flex-row items-center justify-center mb-2 py-2 bg-warning/10 rounded-lg">
              <UserPlus size={14} color={COLORS.warning} />
              <Text className="text-xs font-medium text-warning ml-1">
                Pending - Awaiting your response
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <Button
                title={screenState === 'declining' ? 'Declining...' : 'Decline'}
                onPress={handleDecline}
                variant="outline"
                fullWidth
                size="lg"
                loading={screenState === 'declining'}
                disabled={isProcessing}
              />
            </View>
            <View className="flex-1">
              <Button
                title={screenState === 'accepting' ? 'Accepting...' : 'Accept'}
                onPress={handleAccept}
                variant="primary"
                fullWidth
                size="lg"
                loading={screenState === 'accepting'}
                disabled={isProcessing}
              />
            </View>
          </View>
        </Card>
      </View>
    </ScreenWrapper>
  );
}
