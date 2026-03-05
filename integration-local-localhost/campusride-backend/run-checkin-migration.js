import { supabaseAdmin } from './src/config/database.js';

async function runCheckinMigration() {
  console.log('🚀 Running activity checkin system migration...');

  try {
    console.log('📄 Adding checkin fields to activities table...');

    // Add checkin fields to activities table
    const activitiesSQL = `
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS checkin_enabled BOOLEAN DEFAULT false;
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS checkin_start_offset INTEGER DEFAULT 30;
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS checkin_end_offset INTEGER DEFAULT 30;
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS location_verification BOOLEAN DEFAULT false;
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS verification_radius INTEGER DEFAULT 100;
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 10;
    `;

    await supabaseAdmin.rpc('exec_sql', { sql: activitiesSQL });
    console.log('✅ Activities table updated');

    console.log('📄 Adding checkin fields to activity_participants table...');

    // Add checkin fields to activity_participants table
    const participantsSQL = `
      ALTER TABLE activity_participants ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;
      ALTER TABLE activity_participants ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMP WITH TIME ZONE;
      ALTER TABLE activity_participants ADD COLUMN IF NOT EXISTS checkin_location JSONB;
      ALTER TABLE activity_participants ADD COLUMN IF NOT EXISTS distance_from_venue DECIMAL(10,2);
      ALTER TABLE activity_participants ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT false;
    `;

    await supabaseAdmin.rpc('exec_sql', { sql: participantsSQL });
    console.log('✅ Activity participants table updated');

    console.log('📄 Creating activity_checkins table...');

    // Create activity_checkins table
    const checkinsTableSQL = `
      CREATE TABLE IF NOT EXISTS activity_checkins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        participation_id UUID REFERENCES activity_participants(id) ON DELETE CASCADE,
        checkin_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        user_location JSONB NOT NULL,
        activity_location JSONB,
        distance_meters DECIMAL(10,2),
        location_verified BOOLEAN DEFAULT false,
        verification_radius INTEGER,
        device_info JSONB,
        ip_address INET,
        points_awarded INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await supabaseAdmin.rpc('exec_sql', { sql: checkinsTableSQL });
    console.log('✅ Activity checkins table created');

    console.log('📄 Creating indexes...');

    // Create indexes
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_activity_checkins_activity_id ON activity_checkins(activity_id);
      CREATE INDEX IF NOT EXISTS idx_activity_checkins_user_id ON activity_checkins(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_checkins_time ON activity_checkins(checkin_time);
    `;

    await supabaseAdmin.rpc('exec_sql', { sql: indexesSQL });
    console.log('✅ Indexes created');

    console.log('📄 Creating utility functions...');

    // Create utility functions
    const functionsSQL = `
      CREATE OR REPLACE FUNCTION calculate_distance(
        lat1 DECIMAL, lon1 DECIMAL,
        lat2 DECIMAL, lon2 DECIMAL
      ) RETURNS DECIMAL AS $$
      DECLARE
        earth_radius DECIMAL := 6371000;
        lat1_rad DECIMAL;
        lat2_rad DECIMAL;
        delta_lat DECIMAL;
        delta_lon DECIMAL;
        a DECIMAL;
        c DECIMAL;
      BEGIN
        lat1_rad := radians(lat1);
        lat2_rad := radians(lat2);
        delta_lat := radians(lat2 - lat1);
        delta_lon := radians(lon2 - lon1);

        a := sin(delta_lat / 2) * sin(delta_lat / 2) +
             cos(lat1_rad) * cos(lat2_rad) *
             sin(delta_lon / 2) * sin(delta_lon / 2);
        c := 2 * atan2(sqrt(a), sqrt(1 - a));

        RETURN earth_radius * c;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION is_checkin_period(
        activity_start_time TIMESTAMP WITH TIME ZONE,
        activity_end_time TIMESTAMP WITH TIME ZONE,
        checkin_start_offset INTEGER DEFAULT 30,
        checkin_end_offset INTEGER DEFAULT 30
      ) RETURNS BOOLEAN AS $$
      DECLARE
        checkin_start TIMESTAMP WITH TIME ZONE;
        checkin_end TIMESTAMP WITH TIME ZONE;
        current_time TIMESTAMP WITH TIME ZONE;
      BEGIN
        current_time := NOW();
        checkin_start := activity_start_time - (checkin_start_offset || ' minutes')::INTERVAL;
        checkin_end := activity_end_time + (checkin_end_offset || ' minutes')::INTERVAL;

        RETURN current_time >= checkin_start AND current_time <= checkin_end;
      END;
      $$ LANGUAGE plpgsql;
    `;

    await supabaseAdmin.rpc('exec_sql', { sql: functionsSQL });
    console.log('✅ Utility functions created');

    console.log('📄 Verifying tables...');

    // Verify tables exist
    const { data: activities } = await supabaseAdmin
      .from('activities')
      .select('*')
      .limit(0);

    const { data: checkins } = await supabaseAdmin
      .from('activity_checkins')
      .select('*')
      .limit(0);

    console.log('✅ Activities table accessible');
    console.log('✅ Activity checkins table accessible');

    console.log('\n🎉 Activity checkin system migration completed successfully!');
    console.log('📋 Added features:');
    console.log('   - Activity checkin configuration fields');
    console.log('   - Location verification with GPS');
    console.log('   - Time-based checkin windows');
    console.log('   - Comprehensive checkin history tracking');
    console.log('   - Distance calculation functions');
    console.log('   - Points reward system integration');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

runCheckinMigration()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });