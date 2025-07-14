// Personal Access Token用の設定（緊急時用）
export const AsanaTokenConfig = {
  usePersonalToken: process.env.ASANA_USE_PERSONAL_TOKEN === 'true',
  personalToken: process.env.ASANA_PERSONAL_ACCESS_TOKEN,
  
  // Personal Access Token使用時のヘッダー
  getHeaders(): { [key: string]: string } {
    if (this.usePersonalToken && this.personalToken) {
      return {
        'Authorization': `Bearer ${this.personalToken}`,
        'Content-Type': 'application/json',
      };
    }
    return {};
  }
};