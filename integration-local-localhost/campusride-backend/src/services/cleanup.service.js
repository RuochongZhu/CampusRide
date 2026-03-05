import { supabaseAdmin } from '../config/database.js';

/**
 * Cleanup Service
 * Handles scheduled cleanup tasks like deleting expired activities
 */
class CleanupService {
  constructor() {
    this.intervalId = null;
    this.cleanupIntervalMs = 60 * 60 * 1000; // Run every hour
    this.marketplaceRetentionDays = 21; // Auto-delete marketplace posts after 3 weeks
  }

  /**
   * Start the cleanup scheduler
   */
  start() {
    console.log('🧹 Cleanup service started');

    // Run immediately on start
    this.runCleanup();

    // Schedule periodic cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.cleanupIntervalMs);
  }

  /**
   * Stop the cleanup scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🧹 Cleanup service stopped');
    }
  }

  /**
   * Run all cleanup tasks
   */
  async runCleanup() {
    try {
      console.log('🧹 Running cleanup tasks...');

      await Promise.all([
        this.cleanupExpiredRides(),
        this.cleanupExpiredMarketplaceItems(),
        this.cleanupExpiredActivities(),
        this.cleanupExpiredVerificationTokens()
      ]);

      console.log('✅ Cleanup tasks completed');
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }

  /**
   * Delete rides whose departure time has already passed
   */
  async cleanupExpiredRides() {
    try {
      const nowIso = new Date().toISOString();

      const { data: expiredRides, error: findError } = await supabaseAdmin
        .from('rides')
        .select('id, title, departure_time')
        .lt('departure_time', nowIso);

      if (findError) {
        console.error('Error finding expired rides:', findError);
        return;
      }

      if (!expiredRides || expiredRides.length === 0) {
        console.log('🧹 No expired rides to delete');
        return;
      }

      const rideIds = expiredRides.map(ride => ride.id);

      // Defensive cleanup; bookings usually cascade via FK.
      await supabaseAdmin
        .from('ride_bookings')
        .delete()
        .in('ride_id', rideIds);

      const { error: deleteError } = await supabaseAdmin
        .from('rides')
        .delete()
        .in('id', rideIds);

      if (deleteError) {
        console.error('Error deleting expired rides:', deleteError);
        return;
      }

      console.log(`✅ Deleted ${expiredRides.length} expired rides`);
      for (const ride of expiredRides) {
        console.log(`   - Deleted ride: "${ride.title}" (departure: ${ride.departure_time})`);
      }
    } catch (error) {
      console.error('Error in cleanupExpiredRides:', error);
    }
  }

  /**
   * Delete marketplace posts older than retention window (default: 21 days)
   */
  async cleanupExpiredMarketplaceItems() {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - this.marketplaceRetentionDays);

      const { data: expiredItems, error: findError } = await supabaseAdmin
        .from('marketplace_items')
        .select('id, title, created_at')
        .eq('status', 'active')
        .lt('created_at', cutoff.toISOString());

      if (findError) {
        console.error('Error finding expired marketplace items:', findError);
        return;
      }

      if (!expiredItems || expiredItems.length === 0) {
        console.log('🧹 No expired marketplace items to delete');
        return;
      }

      const itemIds = expiredItems.map(item => item.id);

      // Clean related records first (some projects don't enforce all FK cascades).
      await supabaseAdmin
        .from('item_favorites')
        .delete()
        .in('item_id', itemIds);

      const { error: commentsError } = await supabaseAdmin
        .from('marketplace_comments')
        .delete()
        .in('item_id', itemIds);

      // Ignore when comment tables are not present in the current database.
      if (commentsError && commentsError.code !== '42P01') {
        console.error('Error deleting marketplace comments:', commentsError);
        return;
      }

      const { error: deleteError } = await supabaseAdmin
        .from('marketplace_items')
        .delete()
        .in('id', itemIds);

      if (deleteError) {
        console.error('Error deleting expired marketplace items:', deleteError);
        return;
      }

      console.log(`✅ Deleted ${expiredItems.length} expired marketplace items`);
      for (const item of expiredItems) {
        console.log(`   - Deleted item: "${item.title}" (created: ${item.created_at})`);
      }
    } catch (error) {
      console.error('Error in cleanupExpiredMarketplaceItems:', error);
    }
  }

  /**
   * Delete activities that already passed end_time
   */
  async cleanupExpiredActivities() {
    try {
      const now = new Date();
      const safeDeleteByIds = async (table, column, ids) => {
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .in(column, ids);

        // 42P01/Postgres, PGRST205/PostgREST: table does not exist
        if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
          throw error;
        }
      };

      // Find and delete activities that already ended
      const { data: expiredActivities, error: findError } = await supabaseAdmin
        .from('activities')
        .select('id, title, end_time')
        .lt('end_time', now.toISOString())
        .neq('status', 'deleted'); // Don't re-delete already deleted ones

      if (findError) {
        console.error('Error finding expired activities:', findError);
        return;
      }

      if (!expiredActivities || expiredActivities.length === 0) {
        console.log('🧹 No expired activities to delete');
        return;
      }

      console.log(`🧹 Found ${expiredActivities.length} expired activities to delete`);

      // Delete expired activities
      const activityIds = expiredActivities.map(a => a.id);

      // First delete related records (different deployments use different table names)
      await safeDeleteByIds('activity_participations', 'activity_id', activityIds);
      await safeDeleteByIds('activity_participants', 'activity_id', activityIds);

      // Delete activity chat messages
      await safeDeleteByIds('activity_chat_messages', 'activity_id', activityIds);

      // Delete the activities
      const { error: deleteError } = await supabaseAdmin
        .from('activities')
        .delete()
        .in('id', activityIds);

      if (deleteError) {
        console.error('Error deleting expired activities:', deleteError);
        return;
      }

      console.log(`✅ Deleted ${expiredActivities.length} expired activities`);

      // Log for audit trail
      for (const activity of expiredActivities) {
        console.log(`   - Deleted: "${activity.title}" (ended: ${activity.end_time})`);
      }
    } catch (error) {
      console.error('Error in cleanupExpiredActivities:', error);
    }
  }

  /**
   * Delete expired email verification tokens
   */
  async cleanupExpiredVerificationTokens() {
    try {
      const now = new Date().toISOString();

      // Clear expired verification tokens
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          email_verification_token: null,
          email_verification_expires: null
        })
        .lt('email_verification_expires', now)
        .not('email_verification_token', 'is', null);

      if (error) {
        console.error('Error cleaning up verification tokens:', error);
        return;
      }

      console.log('🧹 Cleaned up expired verification tokens');
    } catch (error) {
      console.error('Error in cleanupExpiredVerificationTokens:', error);
    }
  }
}

// Export singleton instance
export const cleanupService = new CleanupService();
export default cleanupService;
