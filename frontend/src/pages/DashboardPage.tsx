import { Container, Title, Text, Card, Group, Badge } from '@mantine/core'
import { IconPlus, IconList, IconChartBar } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red'
      case 'developer':
        return 'blue'
      case 'member':
      default:
        return 'gray'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理者'
      case 'developer':
        return '開発者'
      case 'member':
      default:
        return 'メンバー'
    }
  }

  return (
    <Container>
      <Title order={1} mb="md">
        ダッシュボード
      </Title>
      
      <Text c="dimmed" mb="xl">
        日報管理システムへようこそ
      </Text>

      {user && (
        <Card withBorder p="lg" mb="xl">
          <Group justify="space-between" mb="xs">
            <Text fw={500}>ユーザー情報</Text>
            <Badge color={getRoleBadgeColor(user.role)}>
              {getRoleLabel(user.role)}
            </Badge>
          </Group>
          
          <Text size="sm" c="dimmed" mb="xs">
            名前: {user.name}
          </Text>
          
          <Text size="sm" c="dimmed">
            メール: {user.email}
          </Text>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <Card withBorder p="lg" style={{ cursor: 'pointer' }} onClick={() => navigate('/reports/new')}>
          <Group justify="center" mb="md">
            <IconPlus size={48} color="#228be6" />
          </Group>
          <Title order={4} ta="center" mb="xs">新しい日報を作成</Title>
          <Text size="sm" c="dimmed" ta="center">
            今日の作業内容を記録しましょう
          </Text>
        </Card>

        <Card withBorder p="lg" style={{ cursor: 'pointer' }} onClick={() => navigate('/reports')}>
          <Group justify="center" mb="md">
            <IconList size={48} color="#40c057" />
          </Group>
          <Title order={4} ta="center" mb="xs">日報一覧</Title>
          <Text size="sm" c="dimmed" ta="center">
            過去の日報を閲覧・編集できます
          </Text>
        </Card>

        <Card withBorder p="lg" style={{ cursor: 'pointer', opacity: 0.6 }}>
          <Group justify="center" mb="md">
            <IconChartBar size={48} color="#fd7e14" />
          </Group>
          <Title order={4} ta="center" mb="xs">レポート分析</Title>
          <Text size="sm" c="dimmed" ta="center">
            作業時間の統計・分析（実装予定）
          </Text>
        </Card>
      </div>

      <Card withBorder p="lg" mt="xl">
        <Title order={3} mb="md">今後の機能予定</Title>
        <ul>
          <li>Googleカレンダー連携</li>
          <li>Asana連携</li>
          <li>詳細なレポート機能</li>
          <li>MCPサーバーとの連携</li>
        </ul>
      </Card>
    </Container>
  )
}