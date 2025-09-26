import { supabaseAdmin } from '../src/config/database.js';

const emailToDelete = 'rz469@cornell.edu';

async function deleteUser() {
  try {
    console.log(`🗑️ Deleting user with email: ${emailToDelete}`);
    
    // 删除该邮箱的用户数据
    const { data, error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('email', emailToDelete);

    if (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }

    console.log('✅ User deleted successfully');
    console.log('🔄 Now you can register with this email again');
    
    // 确认删除
    const { data: checkUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', emailToDelete);
      
    if (checkError) {
      console.error('Error checking user:', checkError);
    } else if (checkUser && checkUser.length === 0) {
      console.log('✅ Confirmed: User no longer exists in database');
    } else {
      console.log('⚠️ User still exists:', checkUser);
    }

  } catch (error) {
    console.error('❌ Failed to delete user:', error);
  }
}

deleteUser();