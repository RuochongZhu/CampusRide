#!/bin/bash
# migrate.sh - 数据库迁移脚本

set -e

# 配置
MIGRATIONS_DIR="./database/migrations"
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_KEY=${SUPABASE_SERVICE_KEY}

# 函数：执行SQL文件
execute_migration() {
    local file=$1
    echo "执行迁移: $file"
    
    # 使用Supabase REST API执行SQL
    curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${SUPABASE_KEY}" \
        -H "apikey: ${SUPABASE_KEY}" \
        -d "{\"sql\": \"$(cat $file | sed 's/"/\\"/g' | tr '\n' ' ')\"}"
    
    echo "✅ 完成: $file"
}

# 执行所有迁移文件
echo "开始数据库迁移..."

for migration in $(ls ${MIGRATIONS_DIR}/*.sql | sort); do
    execute_migration "$migration"
done

echo "🎉 所有迁移完成！"