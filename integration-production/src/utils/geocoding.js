/**
 * 地理编码工具
 * 使用 Google Geocoding API 进行地址和坐标转换
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

/**
 * 反向地理编码：坐标 -> 地址
 * @param {number} lat - 纬度
 * @param {number} lng - 经度
 * @returns {Promise<string>} 地址字符串
 */
export async function reverseGeocode(lat, lng) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API Key not configured, using coordinates')
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=zh-CN`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // 返回格式化的地址
      return data.results[0].formatted_address
    } else {
      console.warn('Geocoding failed:', data.status)
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

/**
 * 正向地理编码：地址 -> 坐标
 * @param {string} address - 地址字符串
 * @returns {Promise<{lat: number, lng: number} | null>} 坐标对象
 */
export async function geocode(address) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API Key not configured')
    return null
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}&language=zh-CN`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return {
        lat: location.lat,
        lng: location.lng
      }
    } else {
      console.warn('Geocoding failed:', data.status)
      return null
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * 获取当前位置（使用浏览器 Geolocation API）
 * @param {Object} options - Geolocation 选项
 * @returns {Promise<{lat: number, lng: number, address: string}>}
 */
export async function getCurrentLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'))
      return
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const address = await reverseGeocode(lat, lng)

        resolve({ lat, lng, address })
      },
      (error) => {
        let message = '获取位置失败'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = '用户拒绝了位置权限请求'
            break
          case error.POSITION_UNAVAILABLE:
            message = '位置信息不可用'
            break
          case error.TIMEOUT:
            message = '获取位置超时'
            break
        }
        reject(new Error(message))
      },
      defaultOptions
    )
  })
}

/**
 * 计算两点之间的距离（使用 Haversine 公式）
 * @param {number} lat1 - 点1纬度
 * @param {number} lng1 - 点1经度
 * @param {number} lat2 - 点2纬度
 * @param {number} lng2 - 点2经度
 * @returns {number} 距离（米）
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3 // 地球半径（米）
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // 返回米
}

/**
 * 格式化距离显示
 * @param {number} meters - 距离（米）
 * @returns {string} 格式化的距离字符串
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  } else {
    return `${(meters / 1000).toFixed(1)}km`
  }
}
