import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Title,
  Card,
  Group,
  Button,
  Textarea,
  LoadingOverlay,
  Alert,
  Text
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCheck, IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import { CompactTaskInput } from '../components/CompactTaskInput';
import { CalendarEventsList } from '../components/CalendarEventsList';
import { AsanaTasksList } from '../components/AsanaTasksList';
import { useDailyReportStore } from '../stores/dailyReportStore';
import { DailyReport, CreateTaskData } from '../types/dailyReport';

export function DailyReportInputPage() {
  const navigate = useNavigate();
  const { date } = useParams<{ date?: string }>();
  
  const { 
    currentReport, 
    isLoading, 
    error, 
    loadReportByDate, 
    saveReport, 
    clearError
  } = useDailyReportStore();

  const [reportDate, setReportDate] = useState<Date>(new Date());
  const [remarks, setRemarks] = useState('');
  const [tasks, setTasks] = useState<CreateTaskData[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // ローカルタイムゾーンで今日の日付文字列を取得
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 初期化
  useEffect(() => {
    try {
      setInitError(null);
      console.log('DailyReportInputPage initializing with date:', date);
      
      const targetDate = date || formatDateString(new Date());
      console.log('Target date:', targetDate);
      
      // 日付文字列のバリデーション
      if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        throw new Error(`無効な日付形式: ${targetDate}`);
      }
      
      // 日付文字列から正しくDateオブジェクトを作成（ローカルタイムゾーン）
      const [year, month, day] = targetDate.split('-').map(Number);
      const parsedDate = new Date(year, month - 1, day);
      
      // 日付の妥当性チェック
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`無効な日付: ${targetDate}`);
      }
      
      console.log('Parsed date:', parsedDate);
      setReportDate(parsedDate);
      
      if (date) {
        console.log('Loading report for date:', date);
        loadReportByDate(date);
      }
    } catch (error) {
      console.error('DailyReportInputPage initialization error:', error);
      setInitError(error instanceof Error ? error.message : '初期化エラーが発生しました');
    }
  }, [date, loadReportByDate]);

  // 取得した日報データを form に設定
  useEffect(() => {
    if (currentReport) {
      setRemarks(currentReport.remarks || '');
      setTasks(currentReport.tasks || []);
    } else {
      // 新規作成の場合は空の配列で初期化
      setTasks([]);
    }
  }, [currentReport]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      clearError();

      // バリデーション
      const validTasks = tasks.filter(task => task.taskName && task.taskName.trim());
      if (validTasks.length === 0) {
        notifications.show({
          title: 'エラー',
          message: '少なくとも1つのタスク名を入力してください',
          color: 'red',
        });
        return;
      }

      const report: DailyReport = {
        reportDate: formatDateString(reportDate),
        remarks: remarks.trim(),
        tasks: validTasks
      };

      await saveReport(report);
      
      notifications.show({
        title: '保存完了',
        message: '日報を保存しました',
        color: 'green',
      });

      // レポート一覧画面にナビゲート（タイムスタンプを使って強制リフレッシュ）
      navigate('/reports', { 
        replace: true,
        state: { shouldRefresh: true, timestamp: Date.now() }
      });
    } catch (error) {
      notifications.show({
        title: 'エラー',
        message: '日報の保存に失敗しました',
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = () => {
    return tasks.some(task => task.taskName && task.taskName.trim());
  };

  // カレンダーからタスクを追加
  const handleAddTasksFromCalendar = (calendarTasks: CreateTaskData[]) => {
    setTasks(prevTasks => [...prevTasks, ...calendarTasks]);
  };

  return (
    <Container size="lg">
      <LoadingOverlay visible={isLoading} />
      
      <Group justify="space-between" mb="xl">
        <Title order={1}>日報入力</Title>
        <Button 
          variant="subtle" 
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate('/reports')}
        >
          一覧に戻る
        </Button>
      </Group>

      {(error || initError) && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color="red" 
          mb="md"
          onClose={() => {
            clearError();
            setInitError(null);
          }}
          withCloseButton
        >
          {error || initError}
        </Alert>
      )}

      {initError && (
        <Container size="sm" py="xl">
          <Text ta="center" c="dimmed">
            ページの読み込み中にエラーが発生しました。
          </Text>
          <Group justify="center" mt="md">
            <Button onClick={() => window.location.reload()}>
              ページを再読み込み
            </Button>
          </Group>
        </Container>
      )}

      {!initError && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
        <Card withBorder p="lg">
          <Title order={3} mb="md">基本情報</Title>
          
          <DateInput
            label="日付"
            value={reportDate}
            onChange={(value) => value && setReportDate(value)}
            required
            locale="ja"
            mb="md"
          />
        </Card>

        <CalendarEventsList 
          date={formatDateString(reportDate)}
          onAddTasksFromCalendar={handleAddTasksFromCalendar}
        />

        <AsanaTasksList 
          date={formatDateString(reportDate)}
          onAddTasksFromAsana={handleAddTasksFromCalendar}
        />

        <Card withBorder p="lg">
          <CompactTaskInput 
            tasks={tasks} 
            onTasksChange={setTasks}
            currentDate={formatDateString(reportDate)}
          />
        </Card>

        <Card withBorder p="lg">
          <Textarea
            label="備考・報告事項"
            placeholder="1日の振り返りや特記事項があれば記入してください"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={4}
          />
        </Card>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            * タスク名は必須項目です
          </Text>
          
          <Button
            leftSection={<IconCheck size={16} />}
            onClick={handleSave}
            loading={isSaving}
            disabled={!isFormValid()}
            size="md"
          >
            日報を保存
          </Button>
        </Group>
        </div>
      )}
    </Container>
  );
}