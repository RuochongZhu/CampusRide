// Mock Database for development when Supabase is unavailable
const mockUsers = new Map();

export const mockSupabaseAdmin = {
  from: (table) => ({
    select: () => ({
      eq: (field, value) => ({
        single: async () => {
          if (table === 'users' && field === 'email') {
            const user = mockUsers.get(value);
            return { data: user || null, error: null };
          }
          return { data: null, error: null };
        }
      }),
      limit: () => ({
        then: (callback) => callback({ data: [], error: null })
      })
    }),
    insert: async (data) => {
      const id = 'user_' + Date.now();
      const user = { id, ...data };
      mockUsers.set(data.email, user);
      console.log('Mock: User created', { email: data.email, id });
      return { data: user, error: null };
    },
    update: (data) => ({
      eq: (field, value) => ({
        then: async (callback) => {
          const user = Array.from(mockUsers.values()).find(u => u[field] === value);
          if (user) {
            Object.assign(user, data);
            console.log('Mock: User updated', { ...data });
          }
          callback({ data: user, error: null });
        }
      })
    })
  })
};

export default mockSupabaseAdmin;
