// 简单的内存存储用于邮箱验证token
// 注意：在生产环境中应该使用Redis或数据库

class VerificationStore {
  constructor() {
    this.tokens = new Map();
    
    // 每5分钟清理过期的token
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 5 * 60 * 1000);
  }

  // 存储验证token
  store(token, userEmail, expiresAt) {
    this.tokens.set(token, {
      email: userEmail,
      expiresAt: new Date(expiresAt),
      createdAt: new Date()
    });
  }

  // 获取并验证token
  get(token) {
    const data = this.tokens.get(token);
    
    if (!data) {
      return null;
    }

    // 检查是否过期
    if (new Date() > data.expiresAt) {
      this.tokens.delete(token);
      return null;
    }

    return data;
  }

  // 删除token（验证完成后）
  delete(token) {
    this.tokens.delete(token);
  }

  // 清理过期的token
  cleanupExpiredTokens() {
    const now = new Date();
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expiresAt) {
        this.tokens.delete(token);
      }
    }
  }

  // 获取统计信息
  getStats() {
    return {
      activeTokens: this.tokens.size,
      oldestToken: Math.min(...Array.from(this.tokens.values()).map(d => d.createdAt.getTime()))
    };
  }
}

// 创建单例实例
export const verificationStore = new VerificationStore();

export default verificationStore;