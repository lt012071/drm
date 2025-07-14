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
  Select,
  Checkbox,
  Box,
  Collapse,
  Modal,
  TextInput,
  Tabs,
} from '@mantine/core';
import { 
  IconBuildingBank, 
  IconRefresh, 
  IconPlus,
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
  IconExternalLink,
  IconSearch,
  IconCalendar,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';

import { 
  AsanaService, 
  AsanaWorkspace, 
  AsanaProject, 
  AsanaTask 
} from '../services/asanaService';
import { CreateTaskData } from '../types/dailyReport';

interface AsanaTasksListProps {
  date: string;
  onAddTasksFromAsana: (tasks: CreateTaskData[]) => void;
}

export function AsanaTasksList({ date, onAddTasksFromAsana }: AsanaTasksListProps) {
  const [workspaces, setWorkspaces] = useState<AsanaWorkspace[]>([]);
  const [projects, setProjects] = useState<AsanaProject[]>([]);
  const [tasks, setTasks] = useState<AsanaTask[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, { toggle }] = useDisclosure(false); // デフォルトで閉じている
  const [authModalOpened, { open: openAuthModal, close: closeAuthModal }] = useDisclosure(false);
  const [involvedTasks, setInvolvedTasks] = useState<AsanaTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'text' | 'url'>('text');
  const [searchResults, setSearchResults] = useState<AsanaTask[]>([]);

  // Asana認証状態をチェック
  useEffect(() => {
    checkAuthStatus();
    
    // URLパラメータでasana=connectedが来た場合は認証完了として扱う
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('asana') === 'connected') {
      console.log('Asana認証完了を検知しました');
      // 少し待ってから認証状態を再確認
      setTimeout(() => {
        checkAuthStatus();
      }, 1000);
      // URLパラメータをクリア
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Asana認証状態をチェック中...');
      const isAuthenticated = await AsanaService.checkAuthStatus();
      console.log('Asana認証状態:', isAuthenticated);
      setNeedsAuth(!isAuthenticated);
      if (isAuthenticated) {
        console.log('認証済み - ワークスペースを読み込みます');
        loadWorkspaces();
      } else {
        console.log('認証が必要です');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // OAuth2使用時は認証が必要
      if (error instanceof Error && (
        error.message === 'NEEDS_AUTH' || 
        error.message.includes('アクセストークンが見つかりません') ||
        error.message.includes('認証') ||
        error.message.includes('401') ||
        error.message.includes('Unauthorized')
      )) {
        console.log('認証が必要です:', error.message);
        setNeedsAuth(true);
      } else {
        // その他のエラーも認証が必要として扱う
        console.log('その他のエラー（認証必要）:', error instanceof Error ? error.message : error);
        setNeedsAuth(true);
      }
    }
  };

  // ワークスペースを読み込み
  const loadWorkspaces = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const workspacesData = await AsanaService.getWorkspaces();
      setWorkspaces(workspacesData);
      
      // デフォルトで最初のワークスペースを選択
      if (workspacesData.length > 0) {
        setSelectedWorkspace(workspacesData[0].gid);
        await loadProjects(workspacesData[0].gid);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ワークスペースの取得に失敗しました';
      
      if (errorMessage === 'NEEDS_AUTH') {
        setNeedsAuth(true);
        return;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // プロジェクトを読み込み
  const loadProjects = async (workspaceGid: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const projectsData = await AsanaService.getProjects(workspaceGid);
      setProjects(projectsData);
      setSelectedProject('');
      setTasks([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'プロジェクトの取得に失敗しました';
      
      if (errorMessage === 'NEEDS_AUTH') {
        setNeedsAuth(true);
        return;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // タスクを読み込み
  const loadTasks = async (useMyTasks = false) => {
    if (!selectedWorkspace || (!selectedProject && !useMyTasks)) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let tasksData: AsanaTask[];
      
      if (useMyTasks) {
        tasksData = await AsanaService.getMyTasks(selectedWorkspace, date, date);
      } else {
        tasksData = await AsanaService.getProjectTasks(selectedProject, date, date);
      }
      
      setTasks(tasksData);
      setSelectedTaskIds([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'タスクの取得に失敗しました';
      
      if (errorMessage === 'NEEDS_AUTH') {
        setNeedsAuth(true);
        return;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Asana認証を開始
  const startAuthentication = async () => {
    try {
      const { authUrl } = await AsanaService.startAuthentication();
      window.open(authUrl, '_blank');
      closeAuthModal();
      
      notifications.show({
        title: '認証開始',
        message: 'Asana認証ページを開きました。認証完了後、ページを再読み込みしてください。',
        color: 'blue',
      });
    } catch (error) {
      notifications.show({
        title: 'エラー',
        message: '認証の開始に失敗しました',
        color: 'red',
      });
    }
  };

  // 選択されたタスクを日報に追加
  const handleAddSelectedTasks = async () => {
    if (selectedTaskIds.length === 0) {
      notifications.show({
        title: '選択エラー',
        message: 'タスクを選択してください',
        color: 'yellow',
      });
      return;
    }

    try {
      setIsLoading(true);
      const result = await AsanaService.convertTasksToReportTasks(selectedTaskIds);
      
      onAddTasksFromAsana(result.data);
      setSelectedTaskIds([]);
      
      notifications.show({
        title: '追加完了',
        message: `${result.data.length}件のタスクを日報に追加しました`,
        color: 'green',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'タスクの追加に失敗しました';
      
      if (errorMessage === 'NEEDS_AUTH') {
        setNeedsAuth(true);
        return;
      }
      
      notifications.show({
        title: 'エラー',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // タスクの選択状態を切り替え
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  // 全タスクの選択状態を切り替え
  const toggleAllTasks = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map(task => task.gid));
    }
  };

  // その日に関わったタスクを取得
  const loadInvolvedTasks = async () => {
    if (!selectedWorkspace) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tasksData = await AsanaService.getTasksInvolvedToday(selectedWorkspace, date);
      setInvolvedTasks(tasksData);
      setSelectedTaskIds([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '関わったタスクの取得に失敗しました';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // タスクを検索
  const searchTasks = async () => {
    if (!selectedWorkspace || !searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tasksData = await AsanaService.searchTasks(selectedWorkspace, searchQuery, searchType);
      setSearchResults(tasksData);
      setSelectedTaskIds([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'タスクの検索に失敗しました';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 個別タスク追加のエラーハンドリング関数
  const handleTaskAddError = (error: any, _taskName: string) => {
    console.error('タスク追加エラー:', error);
    if (error.message?.includes('認証') || error.message?.includes('401')) {
      setNeedsAuth(true);
      notifications.show({
        title: '認証エラー',
        message: 'Asana認証が必要です。再度認証を行ってください。',
        color: 'red',
      });
    } else {
      notifications.show({
        title: 'エラー',
        message: `タスクの追加に失敗しました: ${error.message}`,
        color: 'red',
      });
    }
  };

  // 複数タスク追加のエラーハンドリング関数
  const handleBulkTaskAddError = (error: any, _taskCount: number) => {
    console.error('タスク追加エラー:', error);
    if (error.message?.includes('認証') || error.message?.includes('401')) {
      setNeedsAuth(true);
      notifications.show({
        title: '認証エラー',
        message: 'Asana認証が必要です。再度認証を行ってください。',
        color: 'red',
      });
    } else {
      notifications.show({
        title: 'エラー',
        message: `タスクの追加に失敗しました: ${error.message}`,
        color: 'red',
      });
    }
  };

  if (needsAuth) {
    return (
      <Card withBorder p="md">
        <Group justify="space-between" mb="md">
          <Group>
            <IconBuildingBank size={20} />
            <Text fw={600}>Asanaタスク</Text>
          </Group>
        </Group>
        
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color="blue" 
          mb="md"
        >
          Asanaと連携するには認証が必要です
        </Alert>
        
        <Group>
          <Button
            leftSection={<IconExternalLink size={16} />}
            onClick={openAuthModal}
            variant="light"
          >
            Asana認証を開始
          </Button>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={checkAuthStatus}
            variant="outline"
            size="sm"
          >
            認証状態を確認
          </Button>
        </Group>
        
        <Modal opened={authModalOpened} onClose={closeAuthModal} title="Asana認証">
          <Stack>
            <Text>Asanaアカウントと連携してタスクを取得します。</Text>
            <Text size="sm" c="dimmed">
              認証後、新しいタブでAsanaのログインページが開きます。
            </Text>
            <Group justify="flex-end">
              <Button variant="subtle" onClick={closeAuthModal}>
                キャンセル
              </Button>
              <Button onClick={startAuthentication}>
                認証を開始
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Card>
    );
  }

  return (
    <Card withBorder p="md">
      <LoadingOverlay visible={isLoading} />
      
      <Group justify="space-between" mb="md">
        <Group>
          <IconBuildingBank size={20} />
          <Text fw={600}>Asanaタスク</Text>
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={toggle}
          >
            {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </ActionIcon>
        </Group>
        
        <Group>
          <Tooltip label="認証状態を確認">
            <ActionIcon
              variant="light"
              onClick={checkAuthStatus}
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

          {/* ワークスペース選択 */}
          <Select
            label="ワークスペース"
            placeholder="ワークスペースを選択"
            value={selectedWorkspace}
            onChange={(value) => {
              setSelectedWorkspace(value || '');
              if (value) {
                loadProjects(value);
              }
            }}
            data={workspaces.map(ws => ({
              value: ws.gid,
              label: ws.name
            }))}
            disabled={isLoading}
          />

          {selectedWorkspace && (
            <Tabs defaultValue="project" w="100%">
              <Tabs.List>
                <Tabs.Tab value="project" leftSection={<IconBuildingBank size={16} />}>
                  プロジェクト
                </Tabs.Tab>
                <Tabs.Tab value="involved" leftSection={<IconCalendar size={16} />}>
                  関わったタスク
                </Tabs.Tab>
                <Tabs.Tab value="search" leftSection={<IconSearch size={16} />}>
                  検索
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="project" pt="md">
                <Stack gap="md">
                  {/* プロジェクト選択 */}
                  <Select
                    label="プロジェクト"
                    placeholder="プロジェクトを選択（または自分のタスクを取得）"
                    value={selectedProject}
                    onChange={(value) => {
                      setSelectedProject(value || '');
                      if (value) {
                        loadTasks(false);
                      }
                    }}
                    data={projects.map(proj => ({
                      value: proj.gid,
                      label: proj.name
                    }))}
                    disabled={isLoading || !selectedWorkspace}
                  />

                  {/* タスク取得ボタン */}
                  <Group>
                    <Button
                      size="sm"
                      onClick={() => loadTasks(false)}
                      disabled={isLoading || !selectedProject}
                    >
                      プロジェクトタスクを取得
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      onClick={() => loadTasks(true)}
                      disabled={isLoading || !selectedWorkspace}
                    >
                      自分のタスクを取得
                    </Button>
                  </Group>

                  {/* タスク一覧 */}
                  {tasks.length > 0 && (
                    <Box>
                      <Group justify="space-between" mb="xs">
                        <Group>
                          <Checkbox
                            checked={selectedTaskIds.length === tasks.length && tasks.length > 0}
                            indeterminate={selectedTaskIds.length > 0 && selectedTaskIds.length < tasks.length}
                            onChange={toggleAllTasks}
                          />
                          <Text size="sm" fw={500}>
                            タスク ({selectedTaskIds.length}/{tasks.length}件選択)
                          </Text>
                        </Group>
                        {selectedTaskIds.length > 0 && (
                          <Button
                            size="sm"
                            leftSection={<IconPlus size={16} />}
                            onClick={handleAddSelectedTasks}
                            disabled={isLoading}
                          >
                            選択したタスクを追加
                          </Button>
                        )}
                      </Group>

                      <Stack gap="xs">
                        {tasks.map((task) => (
                          <Card key={task.gid} withBorder p="sm" bg="gray.0">
                            <Group justify="space-between" align="flex-start">
                              <Group align="flex-start" style={{ flex: 1 }}>
                                <Checkbox
                                  checked={selectedTaskIds.includes(task.gid)}
                                  onChange={() => toggleTaskSelection(task.gid)}
                                />
                                <div style={{ flex: 1 }}>
                                  <Group mb="xs">
                                    <Text fw={500} size="sm">
                                      {task.name}
                                    </Text>
                                    {task.completed && (
                                      <Badge size="xs" color="green">
                                        完了
                                      </Badge>
                                    )}
                                  </Group>
                                  
                                  {task.notes && (
                                    <Text size="xs" c="dimmed" lineClamp={2}>
                                      {task.notes}
                                    </Text>
                                  )}
                                  
                                  {task.projects && task.projects.length > 0 && (
                                    <Group gap="xs" mt="xs">
                                      {task.projects.map((project) => (
                                        <Badge key={project.gid} size="xs" variant="outline">
                                          {project.name}
                                        </Badge>
                                      ))}
                                    </Group>
                                  )}
                                </div>
                              </Group>
                              <Tooltip label="このタスクを追加">
                                <ActionIcon
                                  variant="light"
                                  color="gray"
                                  size="sm"
                                  onClick={() => {
                                    AsanaService.convertTasksToReportTasks([task.gid]).then(result => {
                                      onAddTasksFromAsana(result.data);
                                      notifications.show({
                                        title: '追加完了',
                                        message: `「${task.name}」を日報に追加しました`,
                                        color: 'green',
                                      });
                                    }).catch(error => handleTaskAddError(error, task.name));
                                  }}
                                  disabled={isLoading}
                                >
                                  <IconPlus size={14} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {tasks.length === 0 && selectedWorkspace && (
                    <Text c="dimmed" ta="center" py="md">
                      タスクを取得してください
                    </Text>
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="involved" pt="md">
                <Stack gap="md">
                  <Group>
                    <Button
                      variant="light"
                      size="sm"
                      leftSection={<IconCalendar size={16} />}
                      onClick={loadInvolvedTasks}
                      disabled={isLoading}
                    >
                      {date}に関わったタスクを取得
                    </Button>
                  </Group>

                  {involvedTasks.length > 0 && (
                    <Box>
                      <Group justify="space-between" mb="md">
                        <Text size="sm" fw={500}>
                          関わったタスク ({involvedTasks.length}件)
                        </Text>
                        <Button
                          size="sm"
                          leftSection={<IconPlus size={16} />}
                          onClick={() => {
                            const taskIds = involvedTasks.map(t => t.gid);
                            AsanaService.convertTasksToReportTasks(taskIds).then(result => {
                              onAddTasksFromAsana(result.data);
                              notifications.show({
                                title: '追加完了',
                                message: `${result.data.length}件のタスクを日報に追加しました`,
                                color: 'green',
                              });
                            }).catch(error => handleBulkTaskAddError(error, involvedTasks.length));
                          }}
                          disabled={isLoading || involvedTasks.length === 0}
                        >
                          すべて追加
                        </Button>
                      </Group>

                      <Stack gap="xs">
                        {involvedTasks.map((task) => (
                          <Card key={task.gid} withBorder p="sm" bg="blue.0">
                            <Group justify="space-between" align="flex-start">
                              <div style={{ flex: 1 }}>
                                <Group mb="xs">
                                  <Text fw={500} size="sm">
                                    {task.name}
                                  </Text>
                                  {task.completed && (
                                    <Badge size="xs" color="green">
                                      完了
                                    </Badge>
                                  )}
                                </Group>
                                
                                {task.notes && (
                                  <Text size="xs" c="dimmed" lineClamp={2}>
                                    {task.notes}
                                  </Text>
                                )}
                                
                                {task.projects && task.projects.length > 0 && (
                                  <Group gap="xs" mt="xs">
                                    {task.projects.map((project) => (
                                      <Badge key={project.gid} size="xs" variant="outline">
                                        {project.name}
                                      </Badge>
                                    ))}
                                  </Group>
                                )}
                              </div>
                              <Tooltip label="このタスクを追加">
                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  size="sm"
                                  onClick={() => {
                                    AsanaService.convertTasksToReportTasks([task.gid]).then(result => {
                                      onAddTasksFromAsana(result.data);
                                      notifications.show({
                                        title: '追加完了',
                                        message: `「${task.name}」を日報に追加しました`,
                                        color: 'green',
                                      });
                                    }).catch(error => handleTaskAddError(error, task.name));
                                  }}
                                  disabled={isLoading}
                                >
                                  <IconPlus size={14} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {involvedTasks.length === 0 && selectedWorkspace && (
                    <Text c="dimmed" ta="center" py="md">
                      関わったタスクを取得してください
                    </Text>
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="search" pt="md">
                <Stack gap="md">
                  <Group>
                    <TextInput
                      placeholder="タスクを検索..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.currentTarget.value)}
                      style={{ flex: 1 }}
                    />
                    <Select
                      value={searchType}
                      onChange={(value) => setSearchType(value as 'text' | 'url' || 'text')}
                      data={[
                        { value: 'text', label: 'テキスト' },
                        { value: 'url', label: 'URL' },
                      ]}
                      w={100}
                    />
                    <Button
                      variant="light"
                      size="sm"
                      leftSection={<IconSearch size={16} />}
                      onClick={searchTasks}
                      disabled={isLoading || !searchQuery.trim()}
                    >
                      検索
                    </Button>
                  </Group>

                  {searchResults.length > 0 && (
                    <Box>
                      <Group justify="space-between" mb="md">
                        <Text size="sm" fw={500}>
                          検索結果 ({searchResults.length}件)
                        </Text>
                        <Button
                          size="sm"
                          leftSection={<IconPlus size={16} />}
                          onClick={() => {
                            const taskIds = searchResults.map(t => t.gid);
                            AsanaService.convertTasksToReportTasks(taskIds).then(result => {
                              onAddTasksFromAsana(result.data);
                              notifications.show({
                                title: '追加完了',
                                message: `${result.data.length}件のタスクを日報に追加しました`,
                                color: 'green',
                              });
                            }).catch(error => handleBulkTaskAddError(error, involvedTasks.length));
                          }}
                          disabled={isLoading || searchResults.length === 0}
                        >
                          すべて追加
                        </Button>
                      </Group>

                      <Stack gap="xs">
                        {searchResults.map((task) => (
                          <Card key={task.gid} withBorder p="sm" bg="yellow.0">
                            <Group justify="space-between" align="flex-start">
                              <div style={{ flex: 1 }}>
                                <Group mb="xs">
                                  <Text fw={500} size="sm">
                                    {task.name}
                                  </Text>
                                  {task.completed && (
                                    <Badge size="xs" color="green">
                                      完了
                                    </Badge>
                                    )}
                                </Group>
                                
                                {task.notes && (
                                  <Text size="xs" c="dimmed" lineClamp={2}>
                                    {task.notes}
                                  </Text>
                                )}
                                
                                {task.projects && task.projects.length > 0 && (
                                  <Group gap="xs" mt="xs">
                                    {task.projects.map((project) => (
                                      <Badge key={project.gid} size="xs" variant="outline">
                                        {project.name}
                                      </Badge>
                                    ))}
                                  </Group>
                                )}
                              </div>
                              <Tooltip label="このタスクを追加">
                                <ActionIcon
                                  variant="light"
                                  color="orange"
                                  size="sm"
                                  onClick={() => {
                                    AsanaService.convertTasksToReportTasks([task.gid]).then(result => {
                                      onAddTasksFromAsana(result.data);
                                      notifications.show({
                                        title: '追加完了',
                                        message: `「${task.name}」を日報に追加しました`,
                                        color: 'green',
                                      });
                                    }).catch(error => handleTaskAddError(error, task.name));
                                  }}
                                  disabled={isLoading}
                                >
                                  <IconPlus size={14} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {searchResults.length === 0 && searchQuery && (
                    <Text c="dimmed" ta="center" py="md">
                      検索結果がありません
                    </Text>
                  )}
                </Stack>
              </Tabs.Panel>
            </Tabs>
          )}
        </Stack>
      </Collapse>
    </Card>
  );
}