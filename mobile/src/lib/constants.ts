export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:3000';

export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
};

export const COLORS = {
  primary: '#4A90D9',
  primaryDark: '#2B73BE',
  primaryLight: '#EBF2FB',
  secondary: '#1E293B',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  muted: '#6B7280',
  text: '#1E293B',
  textSecondary: '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
} as const;

export const PRIORITY_COLORS = {
  URGENT: '#EF4444',
  HIGH: '#F59E0B',
  MEDIUM: '#3B82F6',
  LOW: '#10B981',
  NONE: '#6B7280',
} as const;

export const PROJECT_STATUS_COLORS = {
  ACTIVE: '#10B981',
  COMPLETED: '#3B82F6',
  ARCHIVED: '#6B7280',
} as const;
