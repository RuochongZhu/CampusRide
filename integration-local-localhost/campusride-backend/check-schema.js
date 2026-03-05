import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jfgenxnqpuutgdnnngsl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZ2VueG5xcHV1dGdkbm5uZ3NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkzNTc5NCwiZXhwIjoyMDcwNTExNzk0fQ.UCxqUWrAvghm1xbfi_CEosgE3u5G0XcH9pSMv6fA8sE'
);

// 查看用户表结构
const { data, error } = await supabase.from('users').select('*').limit(1);
if (data && data[0]) {
  console.log('用户表字段:', Object.keys(data[0]).join(', '));
}

// 查看消息表结构
const { data: msgData } = await supabase.from('messages').select('*').limit(1);
if (msgData && msgData[0]) {
  console.log('消息表字段:', Object.keys(msgData[0]).join(', '));
}
