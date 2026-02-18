import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react-native';

import type { ProjectStackParamList } from '~/navigation/project-stack';
import {
  dashboardService,
  type CalendarEvent,
} from '~/services/dashboardService';
import { Card } from '~/components/ui/card';
import { PriorityBadge } from '~/components/ui/badge';
import { EmptyState } from '~/components/ui/empty-state';
import { COLORS, PRIORITY_COLORS } from '~/lib/constants';

type Route = RouteProp<ProjectStackParamList, 'Calendar'>;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function CalendarScreen() {
  const route = useRoute<Route>();
  const { projectId } = route.params;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const fetchCalendar = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dashboardService.calendar(projectId, {
        month: month + 1, // API expects 1-indexed
        year,
      });
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Failed to fetch calendar:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, month, year]);

  useEffect(() => {
    fetchCalendar();
    setSelectedDay(null);
  }, [fetchCalendar]);

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  // Map events to day numbers
  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    for (const event of events) {
      const date = new Date(event.dueDate);
      if (date.getMonth() === month && date.getFullYear() === year) {
        const day = date.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(event);
      }
    }
    return map;
  }, [events, month, year]);

  const selectedDayEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];

  // Build calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays: (number | null)[] = [];
  // Leading empty cells
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }
  // Trailing empty cells to complete the grid
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null);
  }

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Month Navigation */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-border">
        <TouchableOpacity onPress={handlePrevMonth} className="p-2">
          <ChevronLeft size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-secondary-800">
          {monthLabel}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} className="p-2">
          <ChevronRight size={22} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="items-center py-12">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          {/* Weekday Headers */}
          <View className="flex-row bg-white px-2 py-2 border-b border-border">
            {WEEKDAYS.map((day) => (
              <View key={day} className="flex-1 items-center">
                <Text className="text-xs font-medium text-muted">{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="bg-white px-2 pb-2">
            {Array.from(
              { length: calendarDays.length / 7 },
              (_, weekIdx) => (
                <View key={weekIdx} className="flex-row">
                  {calendarDays
                    .slice(weekIdx * 7, (weekIdx + 1) * 7)
                    .map((day, cellIdx) => {
                      const dayEvents = day ? eventsByDay[day] || [] : [];
                      const isSelected = day === selectedDay;
                      const todayHighlight = day ? isToday(day) : false;

                      return (
                        <TouchableOpacity
                          key={`${weekIdx}-${cellIdx}`}
                          className={`flex-1 items-center py-2 min-h-[52px] border-b border-r border-gray-100 ${
                            isSelected ? 'bg-primary/10' : ''
                          }`}
                          onPress={() => day && setSelectedDay(day)}
                          disabled={!day}
                        >
                          {day && (
                            <>
                              <View
                                className={`w-7 h-7 rounded-full items-center justify-center ${
                                  todayHighlight ? 'bg-primary' : ''
                                }`}
                              >
                                <Text
                                  className={`text-sm ${
                                    todayHighlight
                                      ? 'text-white font-bold'
                                      : 'text-secondary-800'
                                  }`}
                                >
                                  {day}
                                </Text>
                              </View>
                              {/* Event dots */}
                              {dayEvents.length > 0 && (
                                <View className="flex-row mt-1">
                                  {dayEvents.slice(0, 3).map((ev, i) => (
                                    <View
                                      key={ev.id}
                                      className="w-1.5 h-1.5 rounded-full mx-0.5"
                                      style={{
                                        backgroundColor:
                                          PRIORITY_COLORS[
                                            ev.priority as keyof typeof PRIORITY_COLORS
                                          ] || COLORS.muted,
                                      }}
                                    />
                                  ))}
                                  {dayEvents.length > 3 && (
                                    <Text className="text-[8px] text-muted ml-0.5">
                                      +{dayEvents.length - 3}
                                    </Text>
                                  )}
                                </View>
                              )}
                            </>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                </View>
              ),
            )}
          </View>

          {/* Selected Day Tasks */}
          {selectedDay !== null && (
            <View className="px-4 py-4">
              <Text className="text-base font-semibold text-secondary-800 mb-3">
                Tasks for{' '}
                {new Date(year, month, selectedDay).toLocaleDateString(
                  'en-US',
                  {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  },
                )}
              </Text>

              {selectedDayEvents.length === 0 ? (
                <View className="items-center py-8">
                  <CalendarDays size={32} color={COLORS.muted} />
                  <Text className="text-sm text-muted mt-2">
                    No tasks due this day
                  </Text>
                </View>
              ) : (
                selectedDayEvents.map((event) => (
                  <Card key={event.id} className="mb-2">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 mr-3">
                        <Text
                          className="text-sm font-medium text-secondary-800"
                          numberOfLines={1}
                        >
                          {event.title}
                        </Text>
                        <Text className="text-xs text-muted mt-0.5">
                          {event.columnTitle}
                        </Text>
                      </View>
                      <PriorityBadge
                        priority={
                          event.priority as
                            | 'LOW'
                            | 'MEDIUM'
                            | 'HIGH'
                            | 'URGENT'
                        }
                      />
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
