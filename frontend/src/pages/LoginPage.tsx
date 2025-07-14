import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Container, Paper, Title, Text, Button, Alert, Center } from '@mantine/core'
import { IconBrandGoogle, IconAlertCircle } from '@tabler/icons-react'
import { useAuthStore } from '../stores/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isAuthenticated } = useAuthStore()
  
  const error = searchParams.get('error')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'auth_failed':
        return '認証に失敗しました。再度お試しください。'
      case 'no_user':
        return 'ユーザー情報の取得に失敗しました。'
      case 'server_error':
        return 'サーバーエラーが発生しました。しばらく時間をおいてお試しください。'
      default:
        return null
    }
  }

  return (
    <Container size={420} my={40}>
      <Center>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <Title order={2} ta="center" mb="md">
            日報管理システム
          </Title>
          
          <Text c="dimmed" size="sm" ta="center" mb="lg">
            Googleアカウントでログインしてください
          </Text>

          {error && (
            <Alert 
              icon={<IconAlertCircle size={16} />} 
              color="red" 
              mb="md"
            >
              {getErrorMessage(error)}
            </Alert>
          )}

          <Button
            fullWidth
            leftSection={<IconBrandGoogle size={16} />}
            variant="default"
            onClick={login}
            size="md"
          >
            Googleでログイン
          </Button>
        </Paper>
      </Center>
    </Container>
  )
}