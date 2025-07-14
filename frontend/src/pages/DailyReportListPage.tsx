import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Card,
  Group,
  Button,
  Table,
  Badge,
  Text,
  Select,
  LoadingOverlay,
  Alert,
  ActionIcon,
  Modal
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { 
  IconPlus, 
  IconEye, 
  IconEdit, 
  IconTrash, 
  IconAlertCircle,
  IconCalendar
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import { useDailyReportStore } from '../stores/dailyReportStore';
import { TASK_TYPE_COLORS } from '../types/dailyReport';

export function DailyReportListPage() {
  const navigate = useNavigate();
  
  const { 
    reports, 
    isLoading, 
    error, 
    loadReports, 
    deleteReport, 
    clearError 
  } = useDailyReportStore();

  const [dateRange, setDateRange] = useState<'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  // 初期データ読み込み
  useEffect(() => {
    loadReportsData();
  }, [dateRange, startDate, endDate]);

  const loadReportsData = () => {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    loadReports(start, end);
  };

  const handleDateRangeChange = (value: string | null) => {
    if (!value) return;
    
    const range = value as 'week' | 'month' | 'custom';
    setDateRange(range);
    
    const now = new Date();
    
    switch (range) {
      case 'week': {
        const monday = new Date(now);
        monday.setDate(now.getDate() - now.getDay() + 1);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        setStartDate(monday);
        setEndDate(sunday);
        break;
      }
        
      case 'month': {
        setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
        setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        break;
      }
        
      case 'custom':
        // カスタムの場合は現在の値をそのまま使用
        break;
    }
  };

  const handleDelete = async () => {
    if (!reportToDelete) return;
    
    try {
      await deleteReport(reportToDelete);
      notifications.show({
        title: '削除完了',
        message: '日報を削除しました',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'エラー',
        message: '日報の削除に失敗しました',
        color: 'red',
      });
    } finally {
      setDeleteModalOpen(false);
      setReportToDelete(null);
    }
  };

  const openDeleteModal = (reportId: string) => {
    setReportToDelete(reportId);
    setDeleteModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const getTotalHours = (tasks: any[]) => {
    return tasks.reduce((total, task) => total + task.workHours, 0);
  };

  return (
    <Container size="xl">
      <LoadingOverlay visible={isLoading} />
      
      <Group justify="space-between" mb="xl">
        <Title order={1}>日報一覧</Title>
        <Button 
          leftSection={<IconPlus size={16} />}
          onClick={() => navigate('/reports/new')}
        >
          新規作成
        </Button>
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

      <Card withBorder p="lg" mb="xl">
        <Title order={3} mb="md">表示期間</Title>
        
        <Group>
          <Select
            label="期間"
            value={dateRange}
            onChange={handleDateRangeChange}
            data={[
              { value: 'week', label: '今週' },
              { value: 'month', label: '今月' },
              { value: 'custom', label: 'カスタム' }
            ]}
            w={120}
          />
          
          {dateRange === 'custom' && (
            <>
              <DateInput
                label="開始日"
                value={startDate}
                onChange={(value) => value && setStartDate(value)}
                locale="ja"
              />
              
              <DateInput
                label="終了日"
                value={endDate}
                onChange={(value) => value && setEndDate(value)}
                locale="ja"
              />
              
              <Button
                leftSection={<IconCalendar size={16} />}
                onClick={loadReportsData}
                mt="auto"
              >
                更新
              </Button>
            </>
          )}
        </Group>
      </Card>

      {reports.length === 0 ? (
        <Card withBorder p="xl">
          <div style={{ textAlign: 'center' }}>
            <Text size="lg" c="dimmed" mb="md">
              この期間に日報がありません
            </Text>
            <Button 
              leftSection={<IconPlus size={16} />}
              onClick={() => navigate('/reports/new')}
            >
              最初の日報を作成
            </Button>
          </div>
        </Card>
      ) : (
        <Card withBorder p="lg">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>日付</Table.Th>
                <Table.Th>タスク数</Table.Th>
                <Table.Th>合計時間</Table.Th>
                <Table.Th>主なタスク種別</Table.Th>
                <Table.Th>操作</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {reports.map((report) => {
                const totalHours = getTotalHours(report.tasks);
                const taskTypes = [...new Set(report.tasks.map(t => t.taskType))];
                
                return (
                  <Table.Tr key={report.id}>
                    <Table.Td>
                      <Text fw={500}>{formatDate(report.reportDate)}</Text>
                    </Table.Td>
                    <Table.Td>
                      {report.tasks.length} 件
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{totalHours.toFixed(1)} 時間</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {taskTypes.slice(0, 3).map((type) => (
                          <Badge 
                            key={type}
                            color={TASK_TYPE_COLORS[type] || 'gray'}
                            variant="light"
                            size="sm"
                          >
                            {type}
                          </Badge>
                        ))}
                        {taskTypes.length > 3 && (
                          <Text size="xs" c="dimmed">
                            +{taskTypes.length - 3}
                          </Text>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => navigate(`/reports/${report.reportDate}/view`)}
                          title="詳細表示"
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                        
                        <ActionIcon
                          variant="light"
                          color="orange"
                          onClick={() => navigate(`/reports/${report.reportDate}/edit`)}
                          title="編集"
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => report.id && openDeleteModal(report.id)}
                          title="削除"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* 削除確認モーダル */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="日報削除の確認"
        centered
      >
        <Text mb="md">
          この日報を削除しますか？この操作は取り消せません。
        </Text>
        
        <Group justify="flex-end">
          <Button 
            variant="subtle"
            onClick={() => setDeleteModalOpen(false)}
          >
            キャンセル
          </Button>
          
          <Button 
            color="red"
            onClick={handleDelete}
          >
            削除
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}