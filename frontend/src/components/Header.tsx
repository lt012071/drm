import { Group, Text, Button, Avatar, Menu, Anchor } from '@mantine/core'
import { useAuthStore } from '../stores/authStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { IconLogout, IconUser } from '@tabler/icons-react'

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Text size="lg" fw={600}>
          日報管理システム
        </Text>
        
        {isAuthenticated && (
          <Group gap="sm" ml="lg">
            <Anchor
              component="button"
              fw={location.pathname === '/' || location.pathname === '/reports' ? 600 : 400}
              c={location.pathname === '/' || location.pathname === '/reports' ? 'blue' : 'dimmed'}
              onClick={() => navigate('/reports')}
              underline="never"
            >
              日報管理
            </Anchor>
            <Anchor
              component="button"
              fw={location.pathname === '/dashboard' ? 600 : 400}
              c={location.pathname === '/dashboard' ? 'blue' : 'dimmed'}
              onClick={() => navigate('/dashboard')}
              underline="never"
            >
              ダッシュボード
            </Anchor>
          </Group>
        )}
      </Group>

      {isAuthenticated && user ? (
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button variant="subtle" leftSection={
              <Avatar 
                src={user.avatar} 
                alt={user.name} 
                size="sm"
              />
            }>
              {user.name}
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>アカウント</Menu.Label>
            <Menu.Item leftSection={<IconUser size={14} />}>
              プロフィール
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item 
              leftSection={<IconLogout size={14} />}
              onClick={logout}
              color="red"
            >
              ログアウト
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ) : (
        <div />
      )}
    </Group>
  )
}