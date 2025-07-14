import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '../../test/utils'
import { CompactTaskInput } from '../CompactTaskInput'
import type { CreateTaskData } from '../../types/dailyReport'

describe('CompactTaskInput', () => {
  const mockTasks: CreateTaskData[] = [
    {
      taskName: 'テストタスク',
      taskType: '新規開発',
      workHours: 2.0,
      memo: 'テストメモ'
    }
  ]

  const mockOnTasksChange = vi.fn()
  const currentDate = '2025-07-07'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('コンポーネントが正常にレンダリングされる', () => {
    render(
      <CompactTaskInput
        tasks={mockTasks}
        onTasksChange={mockOnTasksChange}
        currentDate={currentDate}
      />
    )

    // タスク一覧のタイトルが表示される
    expect(screen.getByText('タスク一覧')).toBeInTheDocument()
    
    // 新規タスク追加フォームが表示される
    expect(screen.getByPlaceholderText('新しいタスク名を入力')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /追加/i })).toBeInTheDocument()
  })

  it('既存タスクの情報が表示される', () => {
    render(
      <CompactTaskInput
        tasks={mockTasks}
        onTasksChange={mockOnTasksChange}
        currentDate={currentDate}
      />
    )

    // 既存タスクの情報が表示される
    expect(screen.getByDisplayValue('テストタスク')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2')).toBeInTheDocument()
    expect(screen.getByDisplayValue('テストメモ')).toBeInTheDocument()
  })

  it('タスクが空の場合は新規作成フォームのみ表示される', () => {
    render(
      <CompactTaskInput
        tasks={[]}
        onTasksChange={mockOnTasksChange}
        currentDate={currentDate}
      />
    )

    // タスク一覧のタイトルが表示される
    expect(screen.getByText('タスク一覧')).toBeInTheDocument()
    
    // 新規タスク追加フォームが表示される
    expect(screen.getByPlaceholderText('新しいタスク名を入力')).toBeInTheDocument()
    
    // 統計情報は表示されない（タスクが0件のため）
    expect(screen.queryByText(/合計:/)).not.toBeInTheDocument()
  })

  it('複数のタスクがある場合、統計情報が表示される', () => {
    const multipleTasks: CreateTaskData[] = [
      {
        taskName: 'タスク1',
        taskType: '新規開発',
        workHours: 3.0,
        memo: 'メモ1'
      },
      {
        taskName: 'タスク2',
        taskType: '定型業務',
        workHours: 2.5,
        memo: 'メモ2'
      }
    ]

    render(
      <CompactTaskInput
        tasks={multipleTasks}
        onTasksChange={mockOnTasksChange}
        currentDate={currentDate}
      />
    )

    // 統計情報が表示される
    expect(screen.getByText('合計: 5.5時間')).toBeInTheDocument()
    expect(screen.getByText('タスク数: 2件')).toBeInTheDocument()
  })

  it('追加ボタンが正しく表示される', () => {
    render(
      <CompactTaskInput
        tasks={[]}
        onTasksChange={mockOnTasksChange}
        currentDate={currentDate}
      />
    )

    const addButton = screen.getByRole('button', { name: /追加/i })
    expect(addButton).toBeInTheDocument()
    expect(addButton).toBeDisabled() // タスク名が空の場合は無効
  })
})