import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LoadingOverlay, Center, Text } from '@mantine/core'
import { useAuthStore } from '../stores/authStore'
import { notifications } from '@mantine/notifications'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setToken } = useAuthStore()

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (token) {
      try {
        setToken(token)
        notifications.show({
          title: 'ログイン成功',
          message: 'ログインしました。',
          color: 'green',
        })
        navigate('/dashboard')
      } catch (error) {
        console.error('Token setting error:', error)
        notifications.show({
          title: 'エラー',
          message: '認証に失敗しました。',
          color: 'red',
        })
        navigate('/login')
      }
    } else {
      notifications.show({
        title: 'エラー',
        message: '認証トークンが見つかりません。',
        color: 'red',
      })
      navigate('/login')
    }
  }, [searchParams, setToken, navigate])

  return (
    <Center h="100vh">
      <div>
        <LoadingOverlay visible={true} />
        <Text>認証処理中...</Text>
      </div>
    </Center>
  )
}