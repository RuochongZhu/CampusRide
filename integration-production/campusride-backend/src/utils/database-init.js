import { supabaseAdmin } from '../config/database.js';
import fs from 'fs';
import path from 'path';

export const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database schema...');

    // 读取 SQL 文件
    const schemaPath = path.join(process.cwd(), 'src/database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // 将 SQL 分割成单独的语句
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // 执行每个语句
    for (const statement of statements) {
      try {
        if (statement.toLowerCase().includes('insert into')) {
          // 处理 INSERT 语句
          await supabaseAdmin.rpc('exec_sql', { sql: statement });
        } else {
          // 处理 DDL 语句
          const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
          if (error && !error.message.includes('already exists')) {
            console.warn(`Warning executing statement: ${error.message}`);
          }
        }
      } catch (error) {
        console.warn(`Warning executing statement: ${statement.substring(0, 50)}...`, error.message);
      }
    }

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
};

export const createSampleData = async () => {
  try {
    console.log('🔄 Creating sample data...');

    // 创建示例用户
    const sampleUsers = [
      {
        student_id: 'ST2024001',
        email: 'john.doe@university.edu',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewF5jhYWqjqK.D3m', // password: "password123"
        first_name: 'John',
        last_name: 'Doe',
        university: 'Beijing University',
        major: 'Computer Science',
        points: 100
      },
      {
        student_id: 'ST2024002',
        email: 'jane.smith@university.edu',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewF5jhYWqjqK.D3m',
        first_name: 'Jane',
        last_name: 'Smith',
        university: 'Beijing University',
        major: 'Business Administration',
        points: 150
      }
    ];

    // 检查是否已存在示例数据
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      console.log('✅ Sample data already exists, skipping creation');
      return;
    }

    // 插入示例用户
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .insert(sampleUsers)
      .select('id, first_name, last_name');

    if (userError) {
      console.warn('Failed to create sample users:', userError);
      return;
    }

    console.log(`✅ Created ${users.length} sample users`);

    // 创建示例拼车
    if (users.length >= 2) {
      const sampleRides = [
        {
          driver_id: users[0].id,
          title: '北京大学到首都机场',
          description: '明天早上去机场，还有2个座位',
          departure_location: {
            address: '北京大学东门',
            latitude: 39.9042,
            longitude: 116.4074
          },
          destination_location: {
            address: '首都国际机场T3航站楼',
            latitude: 40.0799,
            longitude: 116.6031
          },
          departure_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          available_seats: 3,
          price_per_seat: 50
        }
      ];

      const { data: rides, error: rideError } = await supabaseAdmin
        .from('rides')
        .insert(sampleRides)
        .select();

      if (!rideError) {
        console.log(`✅ Created ${rides.length} sample rides`);
      }
    }

    // 创建示例商品
    if (users.length >= 1) {
      const sampleItems = [
        {
          seller_id: users[0].id,
          title: 'MacBook Pro 13英寸 2021款',
          description: '9成新MacBook Pro，配置M1芯片，8GB内存，256GB存储。因为升级新电脑出售。',
          category: '电子产品',
          price: 8000,
          condition: 'like_new',
          location: {
            address: '北京大学',
            latitude: 39.9042,
            longitude: 116.4074
          },
          tags: ['macbook', '苹果', '笔记本', 'M1']
        },
        {
          seller_id: users[1]?.id || users[0].id,
          title: '高等数学教材',
          description: '同济大学版高等数学上下册，9成新，有少量笔记。',
          category: '教材',
          price: 60,
          condition: 'good',
          tags: ['数学', '教材', '同济']
        }
      ];

      const { data: items, error: itemError } = await supabaseAdmin
        .from('marketplace_items')
        .insert(sampleItems)
        .select();

      if (!itemError) {
        console.log(`✅ Created ${items.length} sample marketplace items`);
      }
    }

    console.log('✅ Sample data created successfully');
  } catch (error) {
    console.error('❌ Failed to create sample data:', error);
  }
};

// 验证数据库连接和表结构
export const validateDatabase = async () => {
  try {
    console.log('🔄 Validating database structure...');

    const tables = [
      'users',
      'rides',
      'ride_bookings',
      'marketplace_items',
      'item_favorites',
      'activities',
      'activity_participants',
      'point_rules',
      'point_transactions',
      'notifications'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.error(`❌ Table ${table} validation failed:`, error.message);
        } else {
          console.log(`✅ Table ${table} is accessible`);
        }
      } catch (error) {
        console.error(`❌ Table ${table} check failed:`, error.message);
      }
    }

    console.log('✅ Database validation completed');
  } catch (error) {
    console.error('❌ Database validation failed:', error);
  }
}; 