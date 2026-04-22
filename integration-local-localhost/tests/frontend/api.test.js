import { describe, expect, test } from 'vitest'
import { normalizeActivityCheckinPayload } from '../../src/utils/api.js'

describe('normalizeActivityCheckinPayload', () => {
  test('normalizes mini-program style latitude/longitude payloads', () => {
    const payload = normalizeActivityCheckinPayload({
      userLocation: {
        latitude: 42.444,
        longitude: -76.501,
        accuracy: 8
      },
      deviceInfo: {
        source: 'miniprogram'
      }
    })

    expect(payload.userLocation).toEqual({
      latitude: 42.444,
      longitude: -76.501,
      accuracy: 8
    })
    expect(payload.location).toEqual({
      lat: 42.444,
      lng: -76.501,
      accuracy: 8,
      timestamp: undefined
    })
  })

  test('preserves existing web payloads while adding userLocation for compatibility', () => {
    const payload = normalizeActivityCheckinPayload({
      location: {
        lat: 42.1,
        lng: -76.2
      }
    })

    expect(payload.location).toEqual({
      lat: 42.1,
      lng: -76.2,
      accuracy: undefined,
      timestamp: undefined
    })
    expect(payload.userLocation).toEqual({
      lat: 42.1,
      lng: -76.2
    })
  })
})
