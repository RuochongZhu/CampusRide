import { supabaseAdmin } from '../src/config/database.js';

const testEmails = ['alice5094@cornell.edu', 'bob5094@cornell.edu', 'charlie5094@cornell.edu'];

async function verifyAccounts() {
  console.log('='.repeat(70));
  console.log('VERIFYING TEST ACCOUNTS IN DATABASE');
  console.log('='.repeat(70));

  try {
    // Get all test accounts
    const { data: users, error: selectError } = await supabaseAdmin
      .from('users')
      .select('id, email, is_verified')
      .in('email', testEmails);

    if (selectError) {
      console.error('Error fetching users:', selectError);
      return;
    }

    console.log(`\nFound ${users.length} test accounts:`);
    users.forEach(user => {
      console.log(`  - ${user.email}: verified=${user.is_verified}`);
    });

    // Update is_verified to true for all test accounts
    console.log('\nMarking accounts as verified...');
    for (const user of users) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ is_verified: true })
        .eq('id', user.id);

      if (updateError) {
        console.error(`  ✗ Error verifying ${user.email}:`, updateError);
      } else {
        console.log(`  ✓ ${user.email} marked as verified`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('VERIFICATION COMPLETE');
    console.log('='.repeat(70));
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyAccounts();
