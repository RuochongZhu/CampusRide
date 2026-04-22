import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const performCheckin = jest.fn();

jest.unstable_mockModule('../../src/services/activity.service.js', () => ({
  default: {}
}));

jest.unstable_mockModule('../../src/services/activity-cleanup.service.js', () => ({
  default: {}
}));

jest.unstable_mockModule('../../src/services/activity-checkin.service.js', () => ({
  default: {
    performCheckin
  }
}));

const { default: activityController } = await import('../../src/controllers/activity.controller.js');

const createResponse = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('ActivityController.checkInToActivity', () => {
  beforeEach(() => {
    performCheckin.mockReset();
  });

  test('accepts mini-program style userLocation payloads and returns compatibility fields', async () => {
    performCheckin.mockResolvedValue({
      success: true,
      checkinTime: '2026-04-12T12:00:00.000Z',
      distance: 36,
      locationVerified: true,
      pointsAwarded: 15,
      checkinRecord: { id: 'checkin-1' },
      participation: {
        id: 'participant-1',
        attendance_status: 'attended',
        checked_in: true
      }
    });

    const req = {
      params: { activityId: '8e4638ca-8f56-4fb0-a362-4db03d7a04c7' },
      user: { id: 'user-1' },
      body: {
        userLocation: {
          latitude: 42.444,
          longitude: -76.501,
          accuracy: 12
        },
        deviceInfo: {
          source: 'miniprogram'
        }
      }
    };
    const res = createResponse();

    await activityController.checkInToActivity(req, res);

    expect(performCheckin).toHaveBeenCalledWith(
      '8e4638ca-8f56-4fb0-a362-4db03d7a04c7',
      'user-1',
      expect.objectContaining({
        userLocation: expect.objectContaining({
          latitude: 42.444,
          longitude: -76.501,
          accuracy: 12
        })
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        participation: {
          id: 'participant-1',
          attendance_status: 'attended',
          checked_in: true
        },
        pointsEarned: 15,
        pointsAwarded: 15,
        checkinTime: '2026-04-12T12:00:00.000Z',
        distance: 36,
        locationVerified: true,
        checkinRecord: { id: 'checkin-1' }
      },
      message: 'Successfully checked in to activity'
    });
  });

  test('returns a 400 response when the check-in service rejects the request', async () => {
    performCheckin.mockResolvedValue({
      success: false,
      error: 'Check-in is not yet available'
    });

    const req = {
      params: { activityId: '8e4638ca-8f56-4fb0-a362-4db03d7a04c7' },
      user: { id: 'user-1' },
      body: {
        location: {
          lat: 42.444,
          lng: -76.501
        }
      }
    };
    const res = createResponse();

    await activityController.checkInToActivity(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'CHECKIN_FAILED',
        message: 'Check-in is not yet available'
      }
    });
  });
});
