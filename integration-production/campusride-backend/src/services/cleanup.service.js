import { supabaseAdmin } from '../config/database.js';

/**
 * Cleanup Service
 * Handles scheduled cleanup tasks like deleting expired activities
 */
class CleanupService {
  constructor() {
    this.intervalId = null;
    this.cleanupIntervalMs = 60 * 60 * 1000; // Run every hour
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
        this.cleanupExpiredActivities(),
        this.cleanupExpiredVerificationTokens()
      ]);

      console.log('✅ Cleanup tasks completed');
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }

  /**
   * Delete activities that ended more than 1 week ago
   */
  async cleanupExpiredActivities() {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Find and delete activities that ended more than 1 week ago
      const { data: expiredActivities, error: findError } = await supabaseAdmin
        .from('activities')
        .select('id, title, end_time')
        .lt('end_time', oneWeekAgo.toISOString())
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

      // First delete related records (participations, etc.)
      await supabaseAdmin
        .from('activity_participations')
        .delete()
        .in('activity_id', activityIds);

      // Delete activity chat messages
      await supabaseAdmin
        .from('activity_chat_messages')
        .delete()
        .in('activity_id', activityIds);

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
