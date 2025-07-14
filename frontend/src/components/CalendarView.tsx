import { useNavigate } from 'react-router-dom';
import {
  Card,
  Group,
  Text,
  Badge,
  Grid,
  Stack,
  Box,
  LoadingOverlay
} from '@mantine/core';
import { DailyReport, TASK_TYPE_COLORS } from '../types/dailyReport';

interface CalendarViewProps {
  reports: DailyReport[];
  isLoading: boolean;
  currentMonth: Date;
}

export function CalendarView({ reports, isLoading, currentMonth }: CalendarViewProps) {
  const navigate = useNavigate();
  
  // ローカルタイムゾーンで日付文字列を取得
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // カレンダーのグリッドデータを生成
  const generateCalendarGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // 月の最初の日
    const firstDay = new Date(year, month, 1);
    
    // カレンダー表示用の開始日（月初の週の月曜日）
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 月曜日を週初にする
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    // 6週間分の日付を生成
    const calendarDays = [];
    const currentDate = new Date(startDate);
    const today = formatDateString(new Date());
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const dateString = formatDateString(currentDate);
        const report = reports.find(r => r.reportDate === dateString);
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = dateString === today;
        
        
        weekDays.push({
          date: new Date(currentDate),
          dateString,
          report,
          isCurrentMonth,
          isToday
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      calendarDays.push(weekDays);
    }
    
    return calendarDays;
  };

  const calendarGrid = generateCalendarGrid();
  const weekdays = ['月', '火', '水', '木', '金', '土', '日'];

  const handleDateClick = (dateString: string, report?: DailyReport) => {
    if (report) {
      // 既存の日報がある場合は編集画面
      navigate(`/reports/${dateString}/edit`);
    } else {
      // 新規作成画面
      navigate(`/reports/${dateString}/edit`);
    }
  };


  const getTotalHours = (tasks: any[]) => {
    return tasks.reduce((total, task) => total + (Number(task.workHours) || 0), 0);
  };

  const getTaskTypeStats = (tasks: any[]) => {
    const stats: { [key: string]: number } = {};
    tasks.forEach(task => {
      const type = task.taskType || 'その他';
      const hours = Number(task.workHours) || 0;
      stats[type] = (stats[type] || 0) + hours;
    });
    return Object.entries(stats)
      .sort(([,a], [,b]) => b - a); // 時間の多い順（全て表示）
  };

  return (
    <Card withBorder p="lg">
      <LoadingOverlay visible={isLoading} />

      {/* 曜日ヘッダー */}
      <Grid mb="xs">
        {weekdays.map(day => (
          <Grid.Col key={day} span={12/7}>
            <Text ta="center" size="sm" fw={600} c="dimmed">
              {day}
            </Text>
          </Grid.Col>
        ))}
      </Grid>

      {/* カレンダーグリッド */}
      <Stack gap="xs">
        {calendarGrid.map((week, weekIndex) => (
          <Grid key={weekIndex} gutter="xs">
            {week.map((day, dayIndex) => (
              <Grid.Col key={dayIndex} span={12/7}>
                <Card
                  withBorder
                  p="xs"
                  style={{
                    minHeight: '80px',
                    cursor: 'pointer',
                    backgroundColor: day.isToday ? '#e3f2fd' : 
                                   day.report ? '#f5f5f5' : 'white',
                    opacity: day.isCurrentMonth ? 1 : 0.5,
                    borderColor: day.isToday ? '#1976d2' : undefined
                  }}
                  onClick={() => handleDateClick(day.dateString, day.report)}
                >
                  <Stack gap="xs">
                    {/* 日付 */}
                    <Group justify="space-between" align="flex-start">
                      <Text
                        size="sm"
                        fw={day.isToday ? 600 : 400}
                        c={day.isToday ? 'blue' : day.isCurrentMonth ? 'dark' : 'dimmed'}
                      >
                        {day.date.getDate()}
                      </Text>
                      
                      {day.isCurrentMonth && (
                        <Badge 
                          size="xs" 
                          color={day.report ? "green" : "gray"} 
                          variant={day.report ? "filled" : "light"}
                        >
                          {day.report ? "提出済" : "未提出"}
                        </Badge>
                      )}
                    </Group>

                    {/* 日報概要 */}
                    {day.report && (
                      <Box>
                        <Text size="xs" fw={500} mb={2}>
                          合計: {getTotalHours(day.report.tasks).toFixed(1)}h
                        </Text>
                        
                        <Stack gap={1}>
                          {getTaskTypeStats(day.report.tasks).map(([type, hours]) => (
                            <Group key={type} gap={4} justify="space-between">
                              <Badge
                                size="xs"
                                color={TASK_TYPE_COLORS[type as keyof typeof TASK_TYPE_COLORS] || 'gray'}
                                variant="light"
                              >
                                {type}
                              </Badge>
                              <Text size="xs" fw={500}>
                                {hours.toFixed(1)}h
                              </Text>
                            </Group>
                          ))}
                        </Stack>
                        
                        {Object.keys(getTaskTypeStats(day.report.tasks)).length < day.report.tasks.length && (
                          <Text size="xs" c="dimmed" mt={2}>
                            {day.report.tasks.length}件のタスク
                          </Text>
                        )}
                      </Box>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        ))}
      </Stack>
    </Card>
  );
}