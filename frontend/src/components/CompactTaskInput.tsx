import { useState } from 'react';
import {
  Group,
  TextInput,
  NumberInput,
  Select,
  Button,
  ActionIcon,
  Stack,
  Card,
  Text,
  Badge
} from '@mantine/core';
import { IconPlus, IconTrash, IconCopy } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { CreateTaskData, TASK_TYPES, TASK_TYPE_COLORS } from '../types/dailyReport';
import { DailyReportService } from '../services/dailyReportService';

interface CompactTaskInputProps {
  tasks: CreateTaskData[];
  onTasksChange: (tasks: CreateTaskData[]) => void;
  currentDate: string; // YYYY-MM-DD形式の日付
}

export function CompactTaskInput({ tasks, onTasksChange, currentDate }: CompactTaskInputProps) {
  const [newTask, setNewTask] = useState<CreateTaskData>({
    taskName: '',
    taskType: 'その他',
    workHours: 0,
    memo: ''
  });
  const [isLoadingPreviousTasks, setIsLoadingPreviousTasks] = useState(false);

  const addTask = () => {
    if (!newTask.taskName.trim()) return;
    
    onTasksChange([...tasks, { ...newTask }]);
    setNewTask({
      taskName: '',
      taskType: 'その他',
      workHours: 0,
      memo: ''
    });
  };

  const removeTask = (index: number) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    onTasksChange(updatedTasks);
  };

  const updateTask = (index: number, updatedTask: CreateTaskData) => {
    const updatedTasks = tasks.map((task, i) => 
      i === index ? updatedTask : task
    );
    onTasksChange(updatedTasks);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTask();
    }
  };

  // 前回のタスクをコピー
  const copyPreviousTasks = async () => {
    try {
      setIsLoadingPreviousTasks(true);
      
      const result = await DailyReportService.getPreviousTasks(currentDate);
      
      if (result.data.length === 0) {
        notifications.show({
          title: '情報',
          message: result.message || '前日のタスクが見つかりません',
          color: 'blue',
        });
        return;
      }

      // 既存のタスクに前日のタスクを追加
      onTasksChange([...tasks, ...result.data]);
      
      notifications.show({
        title: 'コピー完了',
        message: `${result.previousDate}から${result.copiedTaskCount}件のタスクをコピーしました`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'エラー',
        message: '前日のタスクの取得に失敗しました',
        color: 'red',
      });
    } finally {
      setIsLoadingPreviousTasks(false);
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Text size="lg" fw={600}>タスク一覧</Text>
        <Button
          size="sm"
          variant="light"
          leftSection={<IconCopy size={14} />}
          onClick={copyPreviousTasks}
          loading={isLoadingPreviousTasks}
        >
          前回のタスクをコピー
        </Button>
      </Group>
      
      {/* 既存タスク一覧 */}
      {tasks.map((task, index) => (
        <Card key={index} withBorder p="sm" bg="#f8f9fa">
          <Group gap="sm" align="flex-start">
            <Stack gap={4} style={{ flex: 1 }}>
              {/* タスク名と種別 */}
              <Group gap="sm">
                <TextInput
                  placeholder="タスク名"
                  value={task.taskName}
                  onChange={(e) => updateTask(index, { ...task, taskName: e.target.value })}
                  style={{ flex: 1 }}
                  size="sm"
                />
                <Select
                  value={task.taskType}
                  onChange={(value) => updateTask(index, { ...task, taskType: (value as CreateTaskData['taskType']) || 'その他' })}
                  data={TASK_TYPES}
                  size="sm"
                  w={120}
                />
                <NumberInput
                  placeholder="時間"
                  value={task.workHours}
                  onChange={(value) => updateTask(index, { ...task, workHours: Number(value) || 0 })}
                  min={0}
                  max={24}
                  step={0.5}
                  w={80}
                  size="sm"
                  decimalScale={1}
                />
              </Group>
              
              {/* メモ */}
              <TextInput
                placeholder="メモ（任意）"
                value={task.memo || ''}
                onChange={(e) => updateTask(index, { ...task, memo: e.target.value })}
                size="sm"
              />
            </Stack>
            
            <ActionIcon
              color="red"
              variant="light"
              onClick={() => removeTask(index)}
              size="sm"
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        </Card>
      ))}

      {/* 新規タスク追加フォーム */}
      <Card withBorder p="sm" style={{ borderStyle: 'dashed' }}>
        <Stack gap="sm">
          <Group gap="sm">
            <TextInput
              placeholder="新しいタスク名を入力"
              value={newTask.taskName}
              onChange={(e) => setNewTask({ ...newTask, taskName: e.target.value })}
              onKeyPress={handleKeyPress}
              style={{ flex: 1 }}
              size="sm"
            />
            <Select
              value={newTask.taskType}
              onChange={(value) => setNewTask({ ...newTask, taskType: (value as CreateTaskData['taskType']) || 'その他' })}
              data={TASK_TYPES}
              size="sm"
              w={120}
            />
            <NumberInput
              placeholder="時間"
              value={newTask.workHours}
              onChange={(value) => setNewTask({ ...newTask, workHours: Number(value) || 0 })}
              min={0}
              max={24}
              step={0.5}
              w={80}
              size="sm"
              decimalScale={1}
            />
          </Group>
          
          <Group gap="sm">
            <TextInput
              placeholder="メモ（任意）"
              value={newTask.memo || ''}
              onChange={(e) => setNewTask({ ...newTask, memo: e.target.value })}
              onKeyPress={handleKeyPress}
              style={{ flex: 1 }}
              size="sm"
            />
            <Button
              leftSection={<IconPlus size={14} />}
              onClick={addTask}
              disabled={!newTask.taskName.trim()}
              size="sm"
            >
              追加
            </Button>
          </Group>
        </Stack>
      </Card>

      {/* タスク統計 */}
      {tasks.length > 0 && (
        <Card withBorder p="sm" bg="#f0f7ff">
          <Group gap="md">
            <Text size="sm" fw={500}>
              合計: {tasks.reduce((sum, task) => sum + (Number(task.workHours) || 0), 0).toFixed(1)}時間
            </Text>
            <Text size="sm" fw={500}>
              タスク数: {tasks.length}件
            </Text>
            <Group gap="xs">
              {[...new Set(tasks.map(t => t.taskType))].map(type => (
                <Badge
                  key={type}
                  size="sm"
                  color={TASK_TYPE_COLORS[type as keyof typeof TASK_TYPE_COLORS] || 'gray'}
                  variant="light"
                >
                  {type}
                </Badge>
              ))}
            </Group>
          </Group>
        </Card>
      )}
    </Stack>
  );
}