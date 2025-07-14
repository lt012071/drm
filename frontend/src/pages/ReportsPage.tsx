import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Container,
  Title,
  Card,
  Group,
  Button,
  SegmentedControl,
  ActionIcon,
  LoadingOverlay,
  Alert,
  Text
} from '@mantine/core';
import { 
  IconChevronLeft, 
  IconChevronRight,
  IconAlertCircle,
  IconList,
  IconCalendar
} from '@tabler/icons-react';

import { useDailyReportStore } from '../stores/dailyReportStore';
import { CalendarView } from '../components/CalendarView';
import { ReportListView } from '../components/ReportListView';

export function ReportsPage() {
  const { 
    reports, 
    isLoading, 
    error, 
    loadReports, 
    clearError,
    forceRefresh
  } = useDailyReportStore();
  
  const location = useLocation();
  const [viewType, setViewType] = useState<'list' | 'calendar'>('calendar');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // 初期データ読み込み & 画面遷移時の再読み込み
  useEffect(() => {
    loadReportsData();
  }, [currentMonth, location.pathname]);

  // 日報保存後のリフレッシュ処理
  useEffect(() => {
    if (location.state?.shouldRefresh) {
      console.log('Forcing data refresh after report save...');
      // forceRefreshを使って確実にデータを再取得
      forceRefresh(currentMonth.getFullYear(), currentMonth.getMonth());
      // stateをクリア
      window.history.replaceState({}, document.title);
    }
  }, [location.state, currentMonth, forceRefresh]);

  // ページがフォーカスされた時にデータ再読み込み
  useEffect(() => {
    const handleFocus = () => {
      loadReportsData();
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        loadReportsData();
      }
    });
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [currentMonth]);

  // ローカルタイムゾーンで日付文字列を取得
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadReportsData = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // 月初と月末
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const start = formatDateString(startDate);
    const end = formatDateString(endDate);
    
    
    loadReports(start, end);
  };


  const handlePrevMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  const resetToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  return (
    <Container size="xl">
      <LoadingOverlay visible={isLoading} />
      
      <Group justify="space-between" mb="xl">
        <Title order={1}>日報管理</Title>
        
        <Group>
          <SegmentedControl
            value={viewType}
            onChange={(value) => setViewType(value as 'list' | 'calendar')}
            data={[
              {
                label: (
                  <Group gap="xs">
                    <IconList size={16} />
                    <Text size="sm">リスト</Text>
                  </Group>
                ),
                value: 'list'
              },
              {
                label: (
                  <Group gap="xs">
                    <IconCalendar size={16} />
                    <Text size="sm">カレンダー</Text>
                  </Group>
                ),
                value: 'calendar'
              }
            ]}
          />
        </Group>
      </Group>

      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color="red" 
          mb="md"
          onClose={clearError}
          withCloseButton
        >
          {error}
        </Alert>
      )}

      {/* 月移動コントロール */}
      <Card withBorder p="md" mb="md">
        <Group justify="space-between">
          <Group>
            <ActionIcon variant="light" onClick={handlePrevMonth}>
              <IconChevronLeft size={16} />
            </ActionIcon>
            
            <Text size="lg" fw={600}>
              {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
            </Text>
            
            <ActionIcon variant="light" onClick={handleNextMonth}>
              <IconChevronRight size={16} />
            </ActionIcon>
          </Group>
          
          <Group>
            <Button
              variant="subtle"
              size="sm"
              onClick={resetToCurrentMonth}
            >
              今月に戻る
            </Button>
          </Group>
        </Group>
      </Card>

      {/* ビュー表示 */}
      {viewType === 'calendar' ? (
        <CalendarView
          reports={reports}
          isLoading={isLoading}
          currentMonth={currentMonth}
        />
      ) : (
        <ReportListView
          reports={reports}
          isLoading={isLoading}
          currentMonth={currentMonth}
        />
      )}
    </Container>
  );
}