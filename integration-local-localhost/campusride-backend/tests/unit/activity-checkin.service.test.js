import { describe, expect, jest, test } from '@jest/globals';

jest.unstable_mockModule('../../src/config/database.js', () => ({
  supabaseAdmin: {}
}));

jest.unstable_mockModule('../../src/services/points.service.js', () => ({
  default: {
    awardPoints: jest.fn()
  }
}));

const { default: activityCheckinService } = await import('../../src/services/activity-checkin.service.js');

describe('ActivityCheckinService.formatTimeUntil', () => {
  test('formats minute-based durations', () => {
    expect(activityCheckinService.formatTimeUntil(15)).toBe('15 minutes');
  });

  test('formats day-based durations', () => {
    expect(activityCheckinService.formatTimeUntil(49 * 60)).toBe('2 days 1 hours');
  });
});
