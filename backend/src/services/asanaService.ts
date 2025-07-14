import axios from 'axios';

export interface AsanaTask {
  gid: string;
  name: string;
  notes?: string;
  due_on?: string;
  due_at?: string;
  completed: boolean;
  created_at?: string;
  modified_at?: string;
  assignee?: {
    gid: string;
    name: string;
  };
  projects: Array<{
    gid: string;
    name: string;
  }>;
  tags: Array<{
    gid: string;
    name: string;
  }>;
}

export interface AsanaProject {
  gid: string;
  name: string;
  notes?: string;
  archived: boolean;
  color: string;
  current_status?: {
    color: string;
    text: string;
  };
}

export class AsanaService {
  private static readonly BASE_URL = 'https://app.asana.com/api/1.0';

  // Asana APIクライアントの設定
  private static createApiClient(userAccessToken?: string) {
    const usePersonalToken = process.env.ASANA_USE_PERSONAL_TOKEN === 'true';
    
    let token: string;
    if (usePersonalToken && process.env.ASANA_PERSONAL_ACCESS_TOKEN) {
      token = process.env.ASANA_PERSONAL_ACCESS_TOKEN;
      console.log('🔑 Personal Access Token使用中');
    } else if (userAccessToken) {
      token = userAccessToken;
      console.log('🔑 OAuth2トークン使用中');
    } else {
      throw new Error('Asanaアクセストークンが見つかりません。認証を行ってください。');
    }

    return axios.create({
      baseURL: this.BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // ユーザーの情報を取得
  static async getCurrentUser(accessToken?: string) {
    try {
      const client = this.createApiClient(accessToken);
      const response = await client.get('/users/me');
      return response.data.data;
    } catch (error) {
      console.error('Asana get current user error:', error);
      throw new Error('Asanaユーザー情報の取得に失敗しました');
    }
  }

  // ユーザーのワークスペース一覧を取得
  static async getWorkspaces(accessToken?: string) {
    try {
      const client = this.createApiClient(accessToken);
      const response = await client.get('/workspaces');
      return response.data.data;
    } catch (error) {
      console.error('Asana get workspaces error:', error);
      throw new Error('Asanaワークスペース一覧の取得に失敗しました');
    }
  }

  // 指定ワークスペースのプロジェクト一覧を取得
  static async getProjects(accessToken: string | undefined, workspaceGid: string): Promise<AsanaProject[]> {
    try {
      const client = this.createApiClient(accessToken);
      const response = await client.get(`/projects`, {
        params: {
          workspace: workspaceGid,
          archived: false,
          limit: 100,
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Asana get projects error:', error);
      throw new Error('Asanaプロジェクト一覧の取得に失敗しました');
    }
  }

  // 指定プロジェクトのタスク一覧を取得
  static async getTasksFromProject(
    accessToken: string | undefined, 
    projectGid: string,
    startDate?: string,
    endDate?: string
  ): Promise<AsanaTask[]> {
    try {
      const client = this.createApiClient(accessToken);
      
      const params: any = {
        project: projectGid,
        completed_since: 'now', // 現在時点で完了していないタスクも含む
        limit: 100,
        opt_fields: 'name,notes,due_on,due_at,completed,assignee.name,projects.name,tags.name'
      };

      // 期間指定がある場合
      if (startDate && endDate) {
        params.due_on_after = startDate;
        params.due_on_before = endDate;
      }

      const response = await client.get(`/tasks`, { params });
      return response.data.data;
    } catch (error) {
      console.error('Asana get tasks error:', error);
      throw new Error('Asanaタスク一覧の取得に失敗しました');
    }
  }

  // ユーザーに割り当てられたタスク一覧を取得
  static async getMyTasks(
    accessToken: string | undefined,
    workspaceGid: string,
    startDate?: string,
    endDate?: string
  ): Promise<AsanaTask[]> {
    try {
      const client = this.createApiClient(accessToken);
      
      const params: any = {
        assignee: 'me',
        workspace: workspaceGid,
        completed_since: 'now',
        limit: 100,
        opt_fields: 'name,notes,due_on,due_at,completed,assignee.name,projects.name,tags.name'
      };

      if (startDate && endDate) {
        params.due_on_after = startDate;
        params.due_on_before = endDate;
      }

      const response = await client.get(`/tasks`, { params });
      return response.data.data;
    } catch (error) {
      console.error('Asana get my tasks error:', error);
      throw new Error('自分のAsanaタスク取得に失敗しました');
    }
  }

  // Asanaタスクを日報タスク形式に変換
  static convertAsanaTasksToReportTasks(asanaTasks: AsanaTask[]) {
    return asanaTasks.map(task => ({
      taskName: task.name,
      taskType: this.guessTaskTypeFromAsana(task),
      workHours: 1.0, // デフォルト1時間（ユーザーが調整）
      memo: '', // メモ部分は空にする（ユーザーが入力）
      asanaTaskId: task.gid,
    }));
  }

  // Asanaタスクから日報のタスク種別を推測
  private static guessTaskTypeFromAsana(task: AsanaTask): string {
    const text = (task.name + ' ' + (task.notes || '')).toLowerCase();
    
    // タグベースの判定
    for (const tag of task.tags) {
      const tagName = tag.name.toLowerCase();
      if (tagName.includes('開発') || tagName.includes('dev')) {
        return '新規開発';
      }
      if (tagName.includes('会議') || tagName.includes('meeting')) {
        return '会議';
      }
      if (tagName.includes('バグ') || tagName.includes('bug')) {
        return '突発的な作業';
      }
    }

    // プロジェクト名ベースの判定
    for (const project of task.projects) {
      const projectName = project.name.toLowerCase();
      if (projectName.includes('開発') || projectName.includes('development')) {
        return '新規開発';
      }
      if (projectName.includes('運用') || projectName.includes('operation')) {
        return '定型業務';
      }
    }

    // タスク名・説明ベースの判定
    if (text.includes('開発') || text.includes('実装') || text.includes('コーディング')) {
      return '新規開発';
    }
    if (text.includes('会議') || text.includes('ミーティング') || text.includes('meeting')) {
      return '会議';
    }
    if (text.includes('レビュー') || text.includes('確認') || text.includes('テスト')) {
      return '定型業務';
    }
    if (text.includes('緊急') || text.includes('バグ') || text.includes('修正')) {
      return '突発的な作業';
    }
    
    return 'その他';
  }

  // タスクの詳細情報を取得
  static async getTaskDetail(accessToken: string | undefined, taskGid: string): Promise<AsanaTask> {
    try {
      const client = this.createApiClient(accessToken);
      const response = await client.get(`/tasks/${taskGid}`, {
        params: {
          opt_fields: 'name,notes,due_on,due_at,completed,assignee.name,projects.name,tags.name,created_at,modified_at'
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Asana get task detail error:', error);
      throw new Error('Asanaタスク詳細の取得に失敗しました');
    }
  }

  // その日に関わったタスクを取得（自分が作成・更新したタスクのみ）
  static async getTasksInvolvedToday(
    accessToken: string | undefined,
    workspaceGid: string,
    targetDate: string
  ): Promise<AsanaTask[]> {
    try {
      const client = this.createApiClient(accessToken);
      
      // 日本時間（JST）での開始・終了時刻を正しく設定
      const startTime = new Date(`${targetDate}T00:00:00+09:00`);
      const endTime = new Date(`${targetDate}T23:59:59+09:00`);
      
      console.log(`🔍 自分が関わったタスク検索: ${targetDate}`);
      console.log(`   開始時刻: ${startTime.toISOString()} (JST: ${startTime.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })})`);
      console.log(`   終了時刻: ${endTime.toISOString()} (JST: ${endTime.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })})`);
      
      // まず現在のユーザー情報を取得
      const currentUser = await client.get('/users/me');
      const currentUserId = currentUser.data.data.gid;
      console.log(`👤 現在のユーザーID: ${currentUserId}`);
      
      // 並列でタスクを取得（高速化）
      const allTasks: AsanaTask[] = [];
      
      console.log('🚀 高速検索開始: 複数のAPIコールを並列実行...');
      
      // 並列実行するAPIコール
      const searchPromises = [
        // 1. 自分が担当者のタスク（指定日以降に更新されたもののみ）
        client.get('/tasks', {
          params: {
            workspace: workspaceGid,
            assignee: 'me',
            completed_since: startTime.toISOString(),
            limit: 100,
            opt_fields: 'name,due_on,due_at,completed,assignee.name,projects.name,tags.name,created_at,modified_at'
          }
        }).then(response => ({ type: 'myTasks', data: response.data.data })),
        
        // 2. 指定日に修正されたタスク（ワークスペース全体）
        client.get('/tasks', {
          params: {
            workspace: workspaceGid,
            modified_since: startTime.toISOString(),
            limit: 150,
            opt_fields: 'name,due_on,due_at,completed,assignee.name,projects.name,tags.name,created_at,modified_at'
          }
        }).then(response => ({ type: 'modifiedTasks', data: response.data.data }))
      ];
      
      // 並列実行
      const results = await Promise.allSettled(searchPromises);
      
      // 結果を統合
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { type, data } = result.value;
          console.log(`✅ ${type}: ${data.length}件取得`);
          allTasks.push(...data);
        } else {
          console.error(`❌ 検索エラー (${index}):`, result.reason?.message || result.reason);
        }
      });
      
      // 重複を削除
      const uniqueTasks = allTasks.filter(
        (task, index, self) => index === self.findIndex(t => t.gid === task.gid)
      );
      
      console.log(`📋 重複除去後のタスク総数: ${uniqueTasks.length}件`);
      
      // 指定された日付に自分が関わったタスクをフィルタリング
      const involvedTasks = [];
      
      console.log(`\n📋 フィルタリング開始: ${uniqueTasks.length}件のタスクを検証中...`);
      
      for (const task of uniqueTasks) {
        let isInvolved = false;
        let reasons = [];
        
        console.log(`\n🔍 タスク検証: ${task.name} (ID: ${task.gid})`);
        console.log(`   作成日時: ${task.created_at || '不明'}`);
        console.log(`   更新日時: ${task.modified_at || '不明'}`);
        
        // 1. その日に自分が作成したタスク
        if (task.created_at) {
          const createdDate = new Date(task.created_at);
          console.log(`   作成日時チェック: ${createdDate.toISOString()} vs ${startTime.toISOString()} - ${endTime.toISOString()}`);
          if (createdDate >= startTime && createdDate <= endTime) {
            console.log(`   ✅ 作成日時が対象範囲内`);
            // タスクの詳細を取得して作成者を確認
            try {
              const taskDetail = await client.get(`/tasks/${task.gid}`, {
                params: {
                  opt_fields: 'created_by'
                }
              });
              
              const createdBy = taskDetail.data.data.created_by;
              console.log(`   作成者: ${createdBy?.gid || '不明'} (${createdBy?.name || '不明'})`);
              
              if (createdBy && createdBy.gid === currentUserId) {
                console.log(`   ✅ 自分が作成したタスク: ${task.name} (${createdDate.toISOString()})`);
                isInvolved = true;
                reasons.push('作成');
              } else {
                console.log(`   ❌ 自分が作成したタスクではない`);
              }
            } catch (error) {
              console.log(`   ❌ タスク ${task.gid} の作成者情報取得エラー:`, error.message);
            }
          } else {
            console.log(`   ❌ 作成日時が対象範囲外`);
          }
        }
        
        // 2. その日に自分が更新したタスク（コメント、担当者変更など）
        if (task.modified_at) {
          const modifiedDate = new Date(task.modified_at);
          console.log(`   更新日時チェック: ${modifiedDate.toISOString()} vs ${startTime.toISOString()} - ${endTime.toISOString()}`);
          if (modifiedDate >= startTime && modifiedDate <= endTime) {
            console.log(`   ✅ 更新日時が対象範囲内`);
            // タスクのストーリー（活動履歴）を取得して自分の更新を確認
            try {
              const stories = await client.get(`/tasks/${task.gid}/stories`, {
                params: {
                  opt_fields: 'type,text,created_at,created_by'
                }
              });
              
              console.log(`   ストーリー取得成功: ${stories.data.data.length}件`);
              
              // 指定日に自分が行った活動があるかチェック
              const myStoriesOnDate = stories.data.data.filter(story => {
                if (!story.created_by || story.created_by.gid !== currentUserId) {
                  return false;
                }
                
                const storyDate = new Date(story.created_at);
                return storyDate >= startTime && storyDate <= endTime;
              });
              
              console.log(`   自分の活動: ${myStoriesOnDate.length}件`);
              myStoriesOnDate.forEach((story, index) => {
                console.log(`     ${index + 1}. ${story.type} - ${story.text || '(テキストなし)'} (${story.created_at})`);
              });
              
              if (myStoriesOnDate.length > 0) {
                console.log(`   ✅ 自分が更新したタスク: ${task.name} (${modifiedDate.toISOString()})`);
                console.log(`   更新内容: ${myStoriesOnDate.length}件の活動`);
                isInvolved = true;
                reasons.push('更新');
              } else {
                console.log(`   ❌ 自分が行った活動がない`);
              }
            } catch (error) {
              console.log(`   ❌ タスク ${task.gid} のストーリー取得エラー:`, error.message);
              // ストーリーが取得できない場合は、修正日時のみで判定（フォールバック）
              console.log(`   ⚠️ フォールバック: 修正日時のみで判定 ${task.name}`);
              isInvolved = true;
              reasons.push('更新（推定）');
            }
          } else {
            console.log(`   ❌ 更新日時が対象範囲外`);
          }
        }
        
        if (isInvolved) {
          console.log(`   🎯 結果: このタスクは含まれます (理由: ${reasons.join(', ')})`);
          involvedTasks.push(task);
        } else {
          console.log(`   ❌ 結果: このタスクは含まれません`);
        }
      }
      
      console.log(`🎯 最終結果: ${involvedTasks.length}件の自分が関わったタスク`);
      
      // デバッグ：各タスクの詳細を表示
      involvedTasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.name} (作成: ${task.created_at}, 更新: ${task.modified_at})`);
      });
      
      return involvedTasks;
    } catch (error) {
      console.error('Asana get involved tasks error:', error);
      throw new Error('関わったタスクの取得に失敗しました');
    }
  }

  // 特定のタスクの詳細情報をデバッグ用に取得
  static async debugSpecificTask(
    accessToken: string | undefined,
    taskGid: string,
    targetDate: string
  ): Promise<any> {
    try {
      const client = this.createApiClient(accessToken);
      
      // 日本時間（JST）での開始・終了時刻を設定
      const startTime = new Date(`${targetDate}T00:00:00+09:00`);
      const endTime = new Date(`${targetDate}T23:59:59+09:00`);
      
      console.log(`🔍 特定タスクのデバッグ: ${taskGid} (対象日: ${targetDate})`);
      console.log(`   開始時刻: ${startTime.toISOString()}`);
      console.log(`   終了時刻: ${endTime.toISOString()}`);
      
      // 1. タスクの基本情報を取得
      const taskDetail = await client.get(`/tasks/${taskGid}`, {
        params: {
          opt_fields: 'name,notes,due_on,due_at,completed,assignee.name,projects.name,tags.name,created_at,modified_at,created_by'
        }
      });
      
      const task = taskDetail.data.data;
      console.log(`📋 タスク詳細:`, {
        name: task.name,
        created_at: task.created_at,
        modified_at: task.modified_at,
        created_by: task.created_by?.name || 'なし',
        assignee: task.assignee?.name || 'なし',
        projects: task.projects?.map(p => p.name) || [],
        completed: task.completed
      });
      
      // 2. 現在のユーザー情報を取得
      const currentUser = await client.get('/users/me');
      const currentUserId = currentUser.data.data.gid;
      console.log(`👤 現在のユーザーID: ${currentUserId}`);
      
      // 3. 作成日・更新日のチェック
      const createdDate = new Date(task.created_at);
      const modifiedDate = new Date(task.modified_at);
      
      const isCreatedToday = createdDate >= startTime && createdDate <= endTime;
      const isModifiedToday = modifiedDate >= startTime && modifiedDate <= endTime;
      const isCreatedByMe = task.created_by?.gid === currentUserId;
      
      console.log(`📅 日付チェック:`, {
        isCreatedToday,
        isModifiedToday,
        isCreatedByMe,
        createdDate: createdDate.toISOString(),
        modifiedDate: modifiedDate.toISOString()
      });
      
      // 4. ストーリー（活動履歴）を取得
      let myStoriesOnDate = [];
      try {
        const stories = await client.get(`/tasks/${taskGid}/stories`, {
          params: {
            opt_fields: 'type,text,created_at,created_by'
          }
        });
        
        myStoriesOnDate = stories.data.data.filter(story => {
          if (!story.created_by || story.created_by.gid !== currentUserId) {
            return false;
          }
          
          const storyDate = new Date(story.created_at);
          return storyDate >= startTime && storyDate <= endTime;
        });
        
        console.log(`📝 自分の活動履歴 (${targetDate}):`, myStoriesOnDate.length, '件');
        myStoriesOnDate.forEach((story, index) => {
          console.log(`   ${index + 1}. ${story.type} - ${story.created_at}`);
        });
      } catch (error) {
        console.error('ストーリー取得エラー:', error.message);
      }
      
      // 5. 検索条件に一致するかの最終判定
      const shouldBeIncluded = (isCreatedToday && isCreatedByMe) || 
                               (isModifiedToday && myStoriesOnDate.length > 0);
      
      console.log(`🎯 検索結果に含まれるべきか: ${shouldBeIncluded}`);
      
      return {
        task,
        currentUserId,
        isCreatedToday,
        isModifiedToday,
        isCreatedByMe,
        myStoriesCount: myStoriesOnDate.length,
        shouldBeIncluded,
        createdDate: createdDate.toISOString(),
        modifiedDate: modifiedDate.toISOString(),
        targetDateRange: {
          start: startTime.toISOString(),
          end: endTime.toISOString()
        }
      };
    } catch (error) {
      console.error('特定タスクのデバッグエラー:', error);
      throw new Error(`タスク ${taskGid} のデバッグに失敗しました: ${error.message}`);
    }
  }

  // タスクを検索（テキストやURL検索）
  static async searchTasks(
    accessToken: string | undefined,
    workspaceGid: string,
    query: string,
    searchType: 'text' | 'url' = 'text'
  ): Promise<AsanaTask[]> {
    try {
      const client = this.createApiClient(accessToken);
      
      // Asana StarterプランではAdvanced Searchが使用できないため、
      // 複数のアプローチでタスクを取得してフィルタリングする
      let allTasks: AsanaTask[] = [];
      
      // 1. 自分のタスクを取得
      try {
        const myTasksResponse = await client.get('/tasks', {
          params: {
            workspace: workspaceGid,
            assignee: 'me',
            completed_since: '2020-01-01',
            limit: 100,
            opt_fields: 'name,notes,due_on,due_at,completed,assignee.name,projects.name,tags.name'
          }
        });
        allTasks.push(...myTasksResponse.data.data);
      } catch (error) {
        console.log('My tasks fetch failed for search:', error);
      }
      
      // 2. 最近修正されたタスクも検索対象に含める
      try {
        const recentResponse = await client.get('/tasks', {
          params: {
            workspace: workspaceGid,
            modified_since: '2024-01-01T00:00:00.000Z',
            limit: 50,
            opt_fields: 'name,notes,due_on,due_at,completed,assignee.name,projects.name,tags.name'
          }
        });
        allTasks.push(...recentResponse.data.data);
      } catch (error) {
        console.log('Recent tasks fetch failed for search:', error);
      }
      
      // 重複を削除
      const uniqueTasks = allTasks.filter(
        (task, index, self) => index === self.findIndex(t => t.gid === task.gid)
      );
      
      // クライアントサイドでフィルタリング
      const filteredTasks = uniqueTasks.filter(task => {
        const searchText = query.toLowerCase();
        const taskName = task.name.toLowerCase();
        const taskNotes = (task.notes || '').toLowerCase();
        
        if (searchType === 'url') {
          // URLパターンでマッチング
          const urlPattern = /https?:\/\/[^\s]+/i;
          return taskNotes.includes(searchText) || urlPattern.test(task.notes || '');
        } else {
          // テキスト検索
          return taskName.includes(searchText) || taskNotes.includes(searchText);
        }
      });
      
      return filteredTasks;
    } catch (error) {
      console.error('Asana search tasks error:', error);
      throw new Error('タスクの検索に失敗しました');
    }
  }

  // 特定のタスクの詳細情報をデバッグ用に取得
  static async debugTask(
    accessToken: string | undefined,
    workspaceGid: string,
    taskGid: string,
    targetDate: string
  ): Promise<any> {
    try {
      const client = this.createApiClient(accessToken);
      console.log(`🔍 タスク ${taskGid} のデバッグ情報を取得中...`);
      
      // 日本時間（JST）での開始・終了時刻
      const startTime = new Date(`${targetDate}T00:00:00+09:00`);
      const endTime = new Date(`${targetDate}T23:59:59+09:00`);
      
      console.log(`📅 対象日: ${targetDate}`);
      console.log(`   開始時刻: ${startTime.toISOString()} (JST: ${startTime.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })})`);
      console.log(`   終了時刻: ${endTime.toISOString()} (JST: ${endTime.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })})`);
      
      // 現在のユーザー情報を取得
      const currentUser = await client.get('/users/me');
      const currentUserId = currentUser.data.data.gid;
      console.log(`👤 現在のユーザーID: ${currentUserId}`);
      
      let taskDetails = null;
      let taskStories = null;
      let taskFound = false;
      let debugInfo = {
        taskGid,
        targetDate,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        currentUserId,
        taskDetails: null,
        taskStories: null,
        searchResults: {
          myTasks: { found: false, total: 0 },
          recentTasks: { found: false, total: 0 },
          projectTasks: { found: false, total: 0 }
        },
        analysis: {
          createdByMe: false,
          createdOnTargetDate: false,
          modifiedOnTargetDate: false,
          myStoriesOnTargetDate: [],
          reasonNotIncluded: []
        }
      };
      
      // 1. タスクの詳細情報を取得
      try {
        console.log('📋 タスクの詳細情報を取得中...');
        const taskResponse = await client.get(`/tasks/${taskGid}`, {
          params: {
            opt_fields: 'name,notes,due_on,due_at,completed,assignee.name,projects.name,tags.name,created_at,modified_at,created_by,permalink_url'
          }
        });
        taskDetails = taskResponse.data.data;
        debugInfo.taskDetails = taskDetails;
        
        console.log(`✅ タスク詳細取得成功:`);
        console.log(`   名前: ${taskDetails.name}`);
        console.log(`   作成日時: ${taskDetails.created_at}`);
        console.log(`   更新日時: ${taskDetails.modified_at}`);
        console.log(`   作成者: ${taskDetails.created_by?.gid} (${taskDetails.created_by?.name || 'Unknown'})`);
        console.log(`   担当者: ${taskDetails.assignee?.gid} (${taskDetails.assignee?.name || 'Unassigned'})`);
        console.log(`   完了状態: ${taskDetails.completed}`);
        console.log(`   URL: ${taskDetails.permalink_url}`);
        
        // 作成者チェック
        if (taskDetails.created_by && taskDetails.created_by.gid === currentUserId) {
          debugInfo.analysis.createdByMe = true;
          console.log('✅ 自分が作成したタスクです');
        } else {
          console.log('❌ 自分が作成したタスクではありません');
          debugInfo.analysis.reasonNotIncluded.push('自分が作成したタスクではない');
        }
        
        // 作成日時チェック
        if (taskDetails.created_at) {
          const createdDate = new Date(taskDetails.created_at);
          if (createdDate >= startTime && createdDate <= endTime) {
            debugInfo.analysis.createdOnTargetDate = true;
            console.log('✅ 対象日に作成されました');
          } else {
            console.log(`❌ 対象日に作成されていません (作成日: ${createdDate.toISOString()})`);
            debugInfo.analysis.reasonNotIncluded.push('対象日に作成されていない');
          }
        }
        
        // 更新日時チェック
        if (taskDetails.modified_at) {
          const modifiedDate = new Date(taskDetails.modified_at);
          if (modifiedDate >= startTime && modifiedDate <= endTime) {
            debugInfo.analysis.modifiedOnTargetDate = true;
            console.log('✅ 対象日に更新されました');
          } else {
            console.log(`❌ 対象日に更新されていません (更新日: ${modifiedDate.toISOString()})`);
            debugInfo.analysis.reasonNotIncluded.push('対象日に更新されていない');
          }
        }
        
      } catch (error) {
        console.error('❌ タスク詳細の取得に失敗:', error);
        debugInfo.analysis.reasonNotIncluded.push('タスク詳細の取得に失敗');
      }
      
      // 2. タスクのストーリー（活動履歴）を取得
      try {
        console.log('📚 タスクのストーリー（活動履歴）を取得中...');
        const storiesResponse = await client.get(`/tasks/${taskGid}/stories`, {
          params: {
            opt_fields: 'type,text,created_at,created_by,resource_type,resource_subtype'
          }
        });
        taskStories = storiesResponse.data.data;
        debugInfo.taskStories = taskStories;
        
        console.log(`✅ ストーリー取得成功: ${taskStories.length}件`);
        
        // 対象日に自分が行った活動を確認
        const myStoriesOnDate = taskStories.filter(story => {
          if (!story.created_by || story.created_by.gid !== currentUserId) {
            return false;
          }
          
          const storyDate = new Date(story.created_at);
          return storyDate >= startTime && storyDate <= endTime;
        });
        
        debugInfo.analysis.myStoriesOnTargetDate = myStoriesOnDate;
        
        if (myStoriesOnDate.length > 0) {
          console.log(`✅ 対象日に自分が行った活動: ${myStoriesOnDate.length}件`);
          myStoriesOnDate.forEach((story, index) => {
            console.log(`   ${index + 1}. ${story.type} - ${story.text || '(テキストなし)'} (${story.created_at})`);
          });
        } else {
          console.log('❌ 対象日に自分が行った活動はありません');
          debugInfo.analysis.reasonNotIncluded.push('対象日に自分が行った活動がない');
        }
        
      } catch (error) {
        console.error('❌ ストーリーの取得に失敗:', error);
        debugInfo.analysis.reasonNotIncluded.push('ストーリーの取得に失敗');
      }
      
      // 3. 各検索方法でタスクが見つかるかチェック
      
      // 3.1. 自分のタスクとして検索
      try {
        console.log('🔍 自分のタスクとして検索中...');
        const myTasks = await client.get('/tasks', {
          params: {
            workspace: workspaceGid,
            assignee: 'me',
            completed_since: '2020-01-01T00:00:00.000Z',
            limit: 100,
            opt_fields: 'name,notes,due_on,due_at,completed,assignee.name,projects.name,tags.name,created_at,modified_at'
          }
        });
        
        const foundInMyTasks = myTasks.data.data.find(task => task.gid === taskGid);
        debugInfo.searchResults.myTasks.total = myTasks.data.data.length;
        debugInfo.searchResults.myTasks.found = !!foundInMyTasks;
        
        if (foundInMyTasks) {
          console.log('✅ 自分のタスク検索で見つかりました');
          taskFound = true;
        } else {
          console.log('❌ 自分のタスク検索で見つかりませんでした');
          debugInfo.analysis.reasonNotIncluded.push('自分のタスク検索で見つからない');
        }
      } catch (error) {
        console.error('❌ 自分のタスク検索エラー:', error);
      }
      
      // 3.2. 最近修正されたタスクとして検索
      try {
        console.log('🔍 最近修正されたタスクとして検索中...');
        const recentTasks = await client.get('/tasks', {
          params: {
            workspace: workspaceGid,
            modified_since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            limit: 100,
            opt_fields: 'name,notes,due_on,due_at,completed,assignee.name,projects.name,tags.name,created_at,modified_at'
          }
        });
        
        const foundInRecentTasks = recentTasks.data.data.find(task => task.gid === taskGid);
        debugInfo.searchResults.recentTasks.total = recentTasks.data.data.length;
        debugInfo.searchResults.recentTasks.found = !!foundInRecentTasks;
        
        if (foundInRecentTasks) {
          console.log('✅ 最近修正されたタスク検索で見つかりました');
          taskFound = true;
        } else {
          console.log('❌ 最近修正されたタスク検索で見つかりませんでした');
          debugInfo.analysis.reasonNotIncluded.push('最近修正されたタスク検索で見つからない');
        }
      } catch (error) {
        console.error('❌ 最近修正されたタスク検索エラー:', error);
      }
      
      // 3.3. プロジェクトからタスクを検索
      if (taskDetails && taskDetails.projects && taskDetails.projects.length > 0) {
        try {
          console.log('🔍 プロジェクトからタスクを検索中...');
          let foundInProjects = false;
          
          for (const project of taskDetails.projects) {
            try {
              const projectTasks = await client.get('/tasks', {
                params: {
                  project: project.gid,
                  modified_since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                  limit: 50,
                  opt_fields: 'name,notes,due_on,due_at,completed,assignee.name,projects.name,tags.name,created_at,modified_at'
                }
              });
              
              const foundInProject = projectTasks.data.data.find(task => task.gid === taskGid);
              if (foundInProject) {
                console.log(`✅ プロジェクト「${project.name}」でタスクが見つかりました`);
                foundInProjects = true;
                taskFound = true;
              }
            } catch (projectError) {
              console.log(`❌ プロジェクト「${project.name}」の検索エラー:`, projectError.message);
            }
          }
          
          debugInfo.searchResults.projectTasks.found = foundInProjects;
          
          if (!foundInProjects) {
            console.log('❌ どのプロジェクトからもタスクが見つかりませんでした');
            debugInfo.analysis.reasonNotIncluded.push('プロジェクト検索で見つからない');
          }
        } catch (error) {
          console.error('❌ プロジェクト検索エラー:', error);
        }
      }
      
      // 4. 結論とレコメンデーション
      console.log('\n🎯 デバッグ結果の総括:');
      console.log(`   タスクが見つかった: ${taskFound ? 'はい' : 'いいえ'}`);
      console.log(`   検索で見つからない理由: ${debugInfo.analysis.reasonNotIncluded.join(', ')}`);
      
      if (!taskFound) {
        console.log('\n💡 推奨される解決策:');
        
        if (!debugInfo.analysis.createdByMe && !debugInfo.analysis.myStoriesOnTargetDate.length) {
          console.log('   - このタスクは自分が作成または更新していないため、getTasksInvolvedTodayの検索対象外です');
        }
        
        if (!debugInfo.analysis.createdOnTargetDate && !debugInfo.analysis.modifiedOnTargetDate) {
          console.log('   - このタスクは対象日（${targetDate}）に作成または更新されていないため、検索対象外です');
        }
        
        if (debugInfo.searchResults.myTasks.found) {
          console.log('   - 自分のタスクとしては見つかるので、getMyTasks APIを使用してください');
        }
        
        if (debugInfo.searchResults.recentTasks.found) {
          console.log('   - 最近修正されたタスクとしては見つかるので、期間を広げた検索を検討してください');
        }
      }
      
      return debugInfo;
      
    } catch (error) {
      console.error('❌ タスクデバッグエラー:', error);
      throw new Error('タスクのデバッグに失敗しました');
    }
  }
}