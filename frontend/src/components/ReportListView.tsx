import { useNavigate } from 'react-router-dom';
import {
  Card,
  Group,
  Text,
  Badge,
  Stack,
  ActionIcon,
  Tooltip,
  LoadingOverlay,
  Center
} from '@mantine/core';
import { IconPlus, IconEdit, IconEye } from '@tabler/icons-react';
import { DailyReport, TASK_TYPE_COLORS } from '../types/dailyReport';

interface ReportListViewProps {
  reports: DailyReport[];
  isLoading: boolean;
  currentMonth: Date;
}

export function ReportListView({ reports, isLoading, currentMonth }: ReportListViewProps) {
  const navigate = useNavigate();

  // ローカルタイムゾーンで日付文字列を取得
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 月の全日付を生成
  const generateMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = formatDateString(new Date());
    
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = formatDateString(date);
      const report = reports.find(r => r.reportDate === dateString);
      const isToday = dateString === today;
      
      
      days.push({
        date,
        dateString,
        report,
        isToday
      });
    }
    
    return days.reverse(); // 新しい順
  };

  const monthDays = generateMonthDays();

  const handleDateClick = (dateString: string, report?: DailyReport) => {
    if (report) {
      navigate(`/reports/${dateString}/edit`);
    } else {
      navigate(`/reports/${dateString}/edit`);
    }
  };

  const getTotalHours = (tasks: any[]) => {
    if (!tasks || !Array.isArray(tasks)) return 0;
    return tasks.reduce((total, task) => total + (Number(task.workHours) || 0), 0);
  };

  const getTaskTypeStats = (tasks: any[]) => {
    const stats: { [key: string]: number } = {};
    if (!tasks || !Array.isArray(tasks)) return stats;
    
    tasks.forEach(task => {
      const type = task.taskType || 'その他';
      const hours = Number(task.workHours) || 0;
      stats[type] = (stats[type] || 0) + hours;
    });
    return stats;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  return (
    <Card withBorder p="lg">
      <LoadingOverlay visible={isLoading} />
      

      {monthDays.length === 0 ? (
        <Center py="xl">
          <Text c="dimmed">この月の日報はありません</Text>
        </Center>
      ) : (
        <Stack gap="sm">
          {monthDays.map((day) => (
            <Card
              key={day.dateString}
              withBorder
              p="md"
              style={{
                cursor: 'pointer',
                backgroundColor: day.isToday ? '#e3f2fd' : 
                               day.report ? 'white' : '#fafafa',
                borderColor: day.isToday ? '#1976d2' : undefined,
                borderStyle: day.report ? 'solid' : 'dashed',
                borderWidth: day.isToday ? 2 : 1
              }}
              onClick={() => handleDateClick(day.dateString, day.report)}
            >
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Group mb="xs">
                    <Text
                      fw={600}
                      c={day.isToday ? 'blue' : 'dark'}
                    >
                      {formatDate(day.date)}
                    </Text>
                    
                    {day.isToday && (
                      <Badge size="sm" color="blue" variant="light">
                        今日
                      </Badge>
                    )}
                    
                    {day.report ? (
                      <Badge size="sm" color="green" variant="light">
                        提出済み
                      </Badge>
                    ) : (
                      <Badge size="sm" color="gray" variant="light">
                        未提出
                      </Badge>
                    )}
                  </Group>

                  {day.report ? (
                    <div>
                      <Group mb="xs">
                        <Text size="sm" fw={500}>
                          合計: {getTotalHours(day.report.tasks).toFixed(1)}時間
                        </Text>
                        <Text size="sm" c="dimmed">
                          {day.report.tasks.length}件のタスク
                        </Text>
                      </Group>
                      
                      {/* 種別ごとの作業時間 */}
                      <Stack gap="xs" mb="xs">
                        {(() => {
                          const tasks = day.report.tasks || [];
                          const stats = getTaskTypeStats(tasks);
                          const entries = Object.entries(stats);
                          
                          
                          if (entries.length === 0) {
                            return []; // 空配列を返してmapが動作しないようにする
                          }
                          
                          return entries;
                        })().map(([type, hours]) => (
                          <Group 
                            key={type} 
                            gap="xs" 
                            align="center"
                          >
                            <Badge
                              size="sm"
                              color={TASK_TYPE_COLORS[type as keyof typeof TASK_TYPE_COLORS] || 'gray'}
                              variant="light"
                            >
                              {type}
                            </Badge>
                            <Text size="sm" fw={500}>
                              {hours.toFixed(1)}h
                            </Text>
                          </Group>
                        ))}
                      </Stack>
                      
                      {day.report.remarks && (
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {day.report.remarks}
                        </Text>
                      )}
                    </div>
                  ) : (
                    <Text size="sm" c="dimmed" fs="italic">
                      クリックして日報を作成
                    </Text>
                  )}
                </div>

                <Group gap="xs">
                  {day.report && (
                    <Tooltip label="詳細表示">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/reports/${day.dateString}/view`);
                        }}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                  
                  <Tooltip label={day.report ? "編集" : "作成"}>
                    <ActionIcon
                      variant="light"
                      color={day.report ? "orange" : "green"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDateClick(day.dateString, day.report);
                      }}
                    >
                      {day.report ? <IconEdit size={16} /> : <IconPlus size={16} />}
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Card>
  );
}