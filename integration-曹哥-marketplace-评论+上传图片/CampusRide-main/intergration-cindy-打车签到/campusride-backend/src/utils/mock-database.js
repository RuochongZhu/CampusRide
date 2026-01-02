import bcrypt from 'bcryptjs';

// 内存数据库模拟
const mockDB = {
  users: new Map(),
  rides: new Map(),
  bookings: new Map(),
  nextUserId: 1,
  nextRideId: 1,
  nextBookingId: 1
};

// 初始化测试用户
export const initMockDatabase = async () => {
  console.log('🎭 初始化演示模式数据库...');
  
  // 创建测试用户
  const testUser = {
    id: 'demo-user-1',
    student_id: 'DEMO2024',
    email: 'demo@cornell.edu',
    password_hash: await bcrypt.hash('demo1234', 12),
    first_name: 'Demo',
    last_name: 'User',
    university: 'Cornell University',
    major: 'Computer Science',
    role: 'user',
    points: 100,
    email_verified: true,
    is_verified: true,  // 邮箱已验证，演示模式无需验证
    verification_status: 'verified',  // 兼容认证中间件
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: null
  };
  
  mockDB.users.set(testUser.email, testUser);
  mockDB.users.set(testUser.id, testUser);
  
  console.log('✅ 测试用户已创建');
  console.log('📧 Email: demo@cornell.edu');
  console.log('🔑 Password: demo1234');
  
  return mockDB;
};

// 模拟 Supabase 客户端
export const createMockSupabaseClient = () => {
  return {
    from: (table) => {
      const chain = {
        _filters: [],
        
        select: (...args) => {
          if (table === 'users') {
            let users = Array.from(mockDB.users.values()).filter(u => typeof u.id === 'string');
            chain._data = users;
          } else if (table === 'rides') {
            let rides = Array.from(mockDB.rides.values());
            chain._data = rides;
          } else {
            chain._data = [];
          }
          return chain;
        },
        
        insert: (data) => {
          const items = Array.isArray(data) ? data : [data];
          const results = [];
          
          items.forEach(item => {
            if (table === 'users') {
              item.id = item.id || `user-${mockDB.nextUserId++}`;
              item.created_at = item.created_at || new Date().toISOString();
              item.updated_at = item.updated_at || new Date().toISOString();
              mockDB.users.set(item.email, item);
              mockDB.users.set(item.id, item);
              results.push(item);
            } else if (table === 'rides') {
              item.id = item.id || `ride-${mockDB.nextRideId++}`;
              item.created_at = item.created_at || new Date().toISOString();
              item.status = item.status || 'active';
              item.remaining_seats = item.available_seats || item.remaining_seats;
              mockDB.rides.set(item.id, item);
              results.push(item);
            }
          });
          
          chain._result = { data: results, error: null };
          return chain;
        },
        
        update: (data) => {
          chain._updateData = data;
          return chain;
        },
        
        delete: () => {
          return chain;
        },
        
        eq: (field, value) => {
          chain._filters.push({ type: 'eq', field, value });
          return chain;
        },
        
        neq: (field, value) => {
          chain._filters.push({ type: 'neq', field, value });
          return chain;
        },
        
        gte: (field, value) => {
          chain._filters.push({ type: 'gte', field, value });
          return chain;
        },
        
        lte: (field, value) => {
          chain._filters.push({ type: 'lte', field, value });
          return chain;
        },
        
        gt: (field, value) => {
          chain._filters.push({ type: 'gt', field, value });
          return chain;
        },
        
        lt: (field, value) => {
          chain._filters.push({ type: 'lt', field, value });
          return chain;
        },
        
        ilike: (field, pattern) => {
          chain._filters.push({ type: 'ilike', field, pattern });
          return chain;
        },
        
        in: (field, values) => {
          chain._filters.push({ type: 'in', field, values });
          return chain;
        },
        
        single: () => {
          // 应用过滤器
          let result = chain._applyFilters();
          if (Array.isArray(result)) {
            result = result[0] || null;
          }
          return { data: result, error: null };
        },
        
        limit: (n) => {
          chain._limit = n;
          return chain;
        },
        
        order: (field, options = {}) => {
          chain._orderBy = { field, ascending: options.ascending !== false };
          return chain;
        },
        
        range: (from, to) => {
          chain._range = { from, to };
          return chain;
        },
        
        _applyFilters: () => {
          let data = chain._data || [];
          
          // 应用过滤器
          for (const filter of chain._filters) {
            if (filter.type === 'eq') {
              if (table === 'users') {
                const user = mockDB.users.get(filter.value);
                if (user) {
                  data = [user];
                } else {
                  data = [];
                }
              } else if (table === 'rides') {
                data = data.filter(item => item[filter.field] === filter.value);
              }
            } else if (filter.type === 'neq') {
              data = data.filter(item => item[filter.field] !== filter.value);
            } else if (filter.type === 'gte') {
              data = data.filter(item => {
                const itemValue = new Date(item[filter.field]);
                const filterValue = new Date(filter.value);
                return itemValue >= filterValue;
              });
            } else if (filter.type === 'lte') {
              data = data.filter(item => {
                const itemValue = new Date(item[filter.field]);
                const filterValue = new Date(filter.value);
                return itemValue <= filterValue;
              });
            } else if (filter.type === 'ilike') {
              data = data.filter(item => {
                const value = String(item[filter.field] || '').toLowerCase();
                const pattern = filter.pattern.replace(/%/g, '').toLowerCase();
                return value.includes(pattern);
              });
            } else if (filter.type === 'in') {
              data = data.filter(item => filter.values.includes(item[filter.field]));
            }
          }
          
          // 处理更新
          if (chain._updateData && data.length > 0) {
            data.forEach(item => Object.assign(item, chain._updateData));
          }
          
          // 排序
          if (chain._orderBy) {
            data.sort((a, b) => {
              const aVal = a[chain._orderBy.field];
              const bVal = b[chain._orderBy.field];
              const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
              return chain._orderBy.ascending ? result : -result;
            });
          }
          
          // 限制数量
          if (chain._limit) {
            data = data.slice(0, chain._limit);
          }
          
          // 范围
          if (chain._range) {
            data = data.slice(chain._range.from, chain._range.to + 1);
          }
          
          return data;
        },
        
        then: (callback) => {
          // 如果已经有结果（比如 insert 操作），直接返回
          if (chain._result) {
            return callback(chain._result);
          }
          
          // 否则应用过滤器
          const result = chain._applyFilters();
          return callback({ 
            data: result, 
            error: null,
            count: result.length 
          });
        }
      };
      
      return chain;
    },
    
    rpc: async (fnName, params) => {
      return { data: null, error: null };
    }
  };
};

export default mockDB;

