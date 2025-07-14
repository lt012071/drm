import { useState, useEffect } from 'react';
import {
  Card,
  Group,
  Button,
  Text,
  Badge,
  LoadingOverlay,
  Alert,
  Stack,
  ActionIcon,
  Tooltip,
  Collapse
} from '@mantine/core';
import { 
  IconCalendar, 
  IconRefresh, 
  IconClock, 
  IconPlus,
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

import { CalendarEvent } from '../types/googleCalendar';
import { CreateTaskData } from '../types/dailyReport';
import { GoogleCalendarService } from '../services/googleCalendarService';

interface CalendarEventsListProps {
  date: string;
  onAddTasksFromCalendar: (tasks: CreateTaskData[]) => void;
}

export function CalendarEventsList({ date, onAddTasksFromCalendar }: CalendarEventsListProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, { toggle }] = useDisclosure(false); // デフォルトで閉じている

  // カレンダー予定を読み込み
  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const calendarEvents = await GoogleCalendarService.getEventsForDate(date);
      setEvents(calendarEvents);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'カレンダー予定の取得に失敗しました';
      
      // 開発モードで404エラーの場合は無視
      if (errorMessage.includes('Route not found') || errorMessage.includes('404')) {
        console.log('開発モード: GoogleCalendar APIは無効化されています');
        setEvents([]);
        return;
      }
      
      setError(errorMessage);
      
      // アクセス権限エラーの場合はトークンリフレッシュを試行
      if (errorMessage.includes('アクセス権限が無効')) {
        try {
          await GoogleCalendarService.refreshToken();
          notifications.show({
            title: '情報',
            message: '認証情報を更新しました。もう一度お試しください。',
            color: 'blue',
          });
        } catch (refreshError) {
          notifications.show({
            title: 'エラー',
            message: '認証情報の更新に失敗しました。再度ログインしてください。',
            color: 'red',
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    loadEvents();
  }, [date]);

  // カレンダー予定をタスクに変換して追加
  const handleAddAllTasks = async () => {
    try {
      setIsLoading(true);
      const result = await GoogleCalendarService.convertEventsToTasks(date);
      
      if (result.data.length === 0) {
        notifications.show({
          title: '情報',
          message: 'この日には予定がありません',
          color: 'blue',
        });
        return;
      }

      onAddTasksFromCalendar(result.data);
      
      notifications.show({
        title: '追加完了',
        message: `${result.data.length}件の予定をタスクとして追加しました`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'エラー',
        message: 'タスクの追加に失敗しました',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 個別の予定をタスクに追加
  const handleAddSingleTask = (event: CalendarEvent) => {
    const task: CreateTaskData = {
      taskName: event.summary,
      taskType: guessTaskType(event.summary, event.description),
      workHours: GoogleCalendarService.getEventDurationInHours(event),
      memo: '', // 予定の詳細は反映しない
      googleCalendarEventId: event.id,
    };

    onAddTasksFromCalendar([task]);
    
    notifications.show({
      title: '追加完了',
      message: `「${event.summary}」をタスクとして追加しました`,
      color: 'green',
    });
  };

  // タスク種別を推測（フロントエンド用簡易版）
  const guessTaskType = (summary: string, description?: string): CreateTaskData['taskType'] => {
    const text = (summary + ' ' + (description || '')).toLowerCase();
    
    if (text.includes('ミーティング') || text.includes('会議') || text.includes('meeting') ||
        text.includes('打ち合わせ') || text.includes('幹部会') || text.includes('朝礼') ||
        text.includes('定例') || text.includes('進捗共有') || text.includes('mtg') || text.includes('面談')) {
      return '会議';
    }
    if (text.includes('開発') || text.includes('実装')) {
      return '新規開発';
    }
    if (text.includes('レビュー') || text.includes('確認')) {
      return '定型業務';
    }
    if (text.includes('緊急') || text.includes('バグ')) {
      return '突発的な作業';
    }
    return 'その他';
  };

  return (
    <Card withBorder p="md">
      <LoadingOverlay visible={isLoading} />
      
      <Group justify="space-between" mb="md">
        <Group>
          <IconCalendar size={20} />
          <Text fw={600}>Googleカレンダー予定</Text>
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={toggle}
          >
            {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </ActionIcon>
        </Group>
        
        <Group>
          <Tooltip label="予定を再読み込み">
            <ActionIcon
              variant="light"
              onClick={loadEvents}
              disabled={isLoading}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Collapse in={expanded}>
        <Stack gap="sm">
          {error && (
            <Alert 
              icon={<IconAlertCircle size={16} />} 
              color="red" 
              mb="md"
            >
              {error}
            </Alert>
          )}

          {events.length > 0 && (
            <Group justify="flex-end" mb="sm">
              <Button
                size="sm"
                leftSection={<IconPlus size={16} />}
                onClick={handleAddAllTasks}
                disabled={isLoading}
              >
                全て追加
              </Button>
            </Group>
          )}

          {events.length === 0 && !isLoading && !error && (
            <Text c="dimmed" ta="center" py="md">
              この日には予定がありません
            </Text>
          )}

          <Stack gap="sm">
            {events.map((event) => (
              <Card key={event.id} withBorder p="sm" bg="gray.0">
                <Group justify="space-between" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Group mb="xs">
                      <Text fw={500} size="sm">
                        {event.summary}
                      </Text>
                      <Badge size="xs" color="blue">
                        {guessTaskType(event.summary, event.description)}
                      </Badge>
                    </Group>
                    
                    <Group gap="md" mb="xs">
                      <Group gap="xs">
                        <IconClock size={14} color="gray" />
                        <Text size="xs" c="dimmed">
                          {GoogleCalendarService.formatEventTime(event)}
                        </Text>
                      </Group>
                      
                      <Text size="xs" c="dimmed">
                        {GoogleCalendarService.getEventDurationInHours(event)}時間
                      </Text>
                    </Group>
                    
                    {event.description && (
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {event.description}
                      </Text>
                    )}
                  </div>
                  
                  <Tooltip label="タスクとして追加">
                    <ActionIcon
                      size="sm"
                      variant="light"
                      color="green"
                      onClick={() => handleAddSingleTask(event)}
                    >
                      <IconPlus size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Card>
            ))}
          </Stack>
        </Stack>
      </Collapse>
    </Card>
  );
}