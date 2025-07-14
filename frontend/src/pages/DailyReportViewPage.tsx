import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Title,
  Card,
  Group,
  Button,
  Text,
  LoadingOverlay,
  Alert
} from '@mantine/core';
import { IconArrowLeft, IconEdit, IconAlertCircle } from '@tabler/icons-react';

import { TaskForm } from '../components/TaskForm';
import { useDailyReportStore } from '../stores/dailyReportStore';

export function DailyReportViewPage() {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();
  
  const { 
    currentReport, 
    isLoading, 
    error, 
    loadReportByDate, 
    clearError 
  } = useDailyReportStore();

  useEffect(() => {
    if (date) {
      loadReportByDate(date);
    }
  }, [date, loadReportByDate]);

  if (!date) {
    return (
      <Container>
        <Alert color="red">
          日付が指定されていません
        </Alert>
      </Container>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <Container size="lg">
      <LoadingOverlay visible={isLoading} />
      
      <Group justify="space-between" mb="xl">
        <Title order={1}>日報詳細</Title>
        <Group>
          {currentReport && (
            <Button 
              leftSection={<IconEdit size={16} />}
              onClick={() => navigate(`/reports/${date}/edit`)}
            >
              編集
            </Button>
          )}
          <Button 
            variant="subtle" 
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/reports')}
          >
            一覧に戻る
          </Button>
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

      {!currentReport && !isLoading && (
        <Card withBorder p="lg">
          <div style={{ textAlign: 'center' }}>
            <Text size="lg" c="dimmed" mb="md">
              {formatDate(date)} の日報がありません
            </Text>
            <Button 
              leftSection={<IconEdit size={16} />}
              onClick={() => navigate(`/reports/${date}/edit`)}
            >
              日報を作成
            </Button>
          </div>
        </Card>
      )}

      {currentReport && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <Card withBorder p="lg">
            <Title order={3} mb="md">基本情報</Title>
            
            <Group mb="md">
              <Text fw={600}>日付:</Text>
              <Text>{formatDate(currentReport.reportDate)}</Text>
            </Group>
            
            {currentReport.remarks && (
              <>
                <Text fw={600} mb="xs">備考・報告事項:</Text>
                <Card bg="gray.0" p="md">
                  <Text style={{ whiteSpace: 'pre-wrap' }}>
                    {currentReport.remarks}
                  </Text>
                </Card>
              </>
            )}
          </Card>

          <Card withBorder p="lg">
            <TaskForm 
              tasks={currentReport.tasks} 
              onChange={() => {}} 
              readonly={true}
            />
          </Card>

          <Card withBorder p="md" bg="blue.0">
            <Group justify="space-between">
              <div>
                <Text fw={600}>作成日時</Text>
                <Text size="sm" c="dimmed">
                  {new Date(currentReport.createdAt!).toLocaleString('ja-JP')}
                </Text>
              </div>
              
              {currentReport.updatedAt !== currentReport.createdAt && (
                <div>
                  <Text fw={600}>更新日時</Text>
                  <Text size="sm" c="dimmed">
                    {new Date(currentReport.updatedAt!).toLocaleString('ja-JP')}
                  </Text>
                </div>
              )}
            </Group>
          </Card>
        </div>
      )}
    </Container>
  );
}