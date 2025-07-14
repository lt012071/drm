import { 
  Card, 
  TextInput, 
  Select, 
  NumberInput, 
  Textarea, 
  Button, 
  Group, 
  ActionIcon,
  Badge
} from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { Task, TASK_TYPES, TASK_TYPE_COLORS } from '../types/dailyReport';

interface TaskFormProps {
  tasks: Task[];
  onChange: (tasks: Task[]) => void;
  readonly?: boolean;
}

export function TaskForm({ tasks, onChange, readonly = false }: TaskFormProps) {
  const addTask = () => {
    const newTask: Task = {
      taskName: '',
      taskType: '新規開発',
      workHours: 0,
      memo: ''
    };
    onChange([...tasks, newTask]);
  };

  const updateTask = (index: number, field: keyof Task, value: any) => {
    const updatedTasks = [...tasks];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };
    onChange(updatedTasks);
  };

  const removeTask = (index: number) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    onChange(updatedTasks);
  };

  const getTotalHours = () => {
    return tasks.reduce((total, task) => total + (task.workHours || 0), 0);
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <h3>タスク一覧</h3>
        {!readonly && (
          <Button leftSection={<IconPlus size={16} />} onClick={addTask} size="sm">
            タスクを追加
          </Button>
        )}
      </Group>

      {tasks.map((task, index) => (
        <Card key={index} withBorder p="md" mb="md">
          <Group justify="space-between" align="flex-start" mb="sm">
            <Group align="center">
              <Badge 
                color={TASK_TYPE_COLORS[task.taskType] || 'gray'} 
                variant="light"
              >
                {task.taskType}
              </Badge>
              <span>タスク {index + 1}</span>
            </Group>
            {!readonly && (
              <ActionIcon 
                color="red" 
                variant="light" 
                onClick={() => removeTask(index)}
                disabled={tasks.length === 1}
              >
                <IconTrash size={16} />
              </ActionIcon>
            )}
          </Group>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <TextInput
              label="タスク名"
              placeholder="タスク名を入力してください"
              value={task.taskName}
              onChange={(e) => updateTask(index, 'taskName', e.target.value)}
              required
              readOnly={readonly}
            />

            <Group grow>
              <Select
                label="種別"
                data={TASK_TYPES.map(type => ({ value: type, label: type }))}
                value={task.taskType}
                onChange={(value) => updateTask(index, 'taskType', value)}
                required
                readOnly={readonly}
              />

              <NumberInput
                label="作業時間（時間）"
                value={task.workHours}
                onChange={(value) => updateTask(index, 'workHours', value || 0)}
                min={0}
                max={24}
                step={0.5}
                decimalScale={1}
                required
                readOnly={readonly}
              />
            </Group>

            <Textarea
              label="メモ"
              placeholder="作業内容の詳細や特記事項"
              value={task.memo || ''}
              onChange={(e) => updateTask(index, 'memo', e.target.value)}
              rows={2}
              readOnly={readonly}
            />
          </div>
        </Card>
      ))}

      {tasks.length === 0 && !readonly && (
        <Card withBorder p="md" mb="md">
          <div style={{ textAlign: 'center', color: '#666' }}>
            <p>タスクが登録されていません</p>
            <Button leftSection={<IconPlus size={16} />} onClick={addTask}>
              最初のタスクを追加
            </Button>
          </div>
        </Card>
      )}

      <Card withBorder p="md" bg="gray.0">
        <Group justify="space-between">
          <span style={{ fontWeight: 600 }}>合計作業時間</span>
          <span style={{ fontWeight: 600, fontSize: '1.1em' }}>
            {getTotalHours().toFixed(1)} 時間
          </span>
        </Group>
      </Card>
    </div>
  );
}