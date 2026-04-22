import dotenv from 'dotenv';

dotenv.config({ path: '.env.test', quiet: true });
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test_service_key';
process.env.SUPABASE_ANON_KEY = 'test_anon_key';
