import { ref, nextTick } from 'vue'

export function useActivityMap({ thoughtAPI, visibilityAPI, message, selectedGroupId, handleUserMessage, onActivityClick }) {
  const isVisible = ref(true)
  const thoughts = ref([])
  const mapThoughts = ref([])
  const visibleUsers = ref([])

  const activeRadarDot = ref(null)
  const isMapExpanded = ref(false)
  const hoveredDot = ref(null)

  let smallMap = null
  let largeMap = null
  let thoughtMarkers = []
  let userMarkers = []
  let activityMarkers = []
  let activityCircles = []
  let largeActivityMarkers = []
  let largeActivityCircles = []
  const mapActivities = ref([])

  // Category -> brand color for activity markers
  const CATEGORY_HEX = {
    academic: '#2563EB', sports: '#16A34A', social: '#DB2777', volunteer: '#0D9488',
    career: '#7C3AED', cultural: '#EA580C', technology: '#4F46E5'
  }
  const categoryHex = (cat) => CATEGORY_HEX[String(cat || '').toLowerCase()] || '#6B7280'
  const activityCoords = (a) => a?.locationCoordinates || a?.location_coordinates || null

  // "Ongoing" = explicitly ongoing, or now sits between start and end (and not cancelled/completed)
  const isActivityOngoing = (a) => {
    const s = String(a?.status || '').toLowerCase()
    if (s === 'ongoing') return true
    if (['cancelled', 'completed', 'draft'].includes(s)) return false
    const st = a?.start_time ? new Date(a.start_time).getTime() : null
    const et = a?.end_time ? new Date(a.end_time).getTime() : null
    const now = Date.now()
    return !!(st && et && now >= st && now <= et)
  }

  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]))

  const formatActivityWindow = (a) => {
    try {
      const s = a?.start_time ? new Date(a.start_time) : null
      if (!s) return 'Time TBD'
      return s.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    } catch {
      return 'Time TBD'
    }
  }

  // Draw activity markers on a given map; ongoing ones bounce with a gold ring + radius circle.
  const drawActivityMarkers = (map, markerStore, circleStore, baseScale) => {
    if (!map || !window.google) return
    markerStore.forEach((m) => m.setMap(null))
    circleStore.forEach((c) => c.setMap(null))
    markerStore.length = 0
    circleStore.length = 0

    mapActivities.value.forEach((a) => {
      const c = activityCoords(a)
      if (!c || c.lat == null || c.lng == null) return
      const color = categoryHex(a.category)
      const live = isActivityOngoing(a)
      const position = { lat: Number(c.lat), lng: Number(c.lng) }

      if (live) {
        circleStore.push(new window.google.maps.Circle({
          map, center: position, radius: 75,
          strokeColor: color, strokeOpacity: 0.5, strokeWeight: 2,
          fillColor: color, fillOpacity: 0.15, clickable: false, zIndex: 1
        }))
      }

      const marker = new window.google.maps.Marker({
        position, map,
        title: a.title || 'Activity',
        zIndex: live ? 9999 : 50,
        animation: live ? window.google.maps.Animation.BOUNCE : null,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: live ? 1 : 0.92,
          strokeColor: live ? '#F59E0B' : '#FFFFFF',
          strokeWeight: live ? 3.5 : 2,
          scale: live ? baseScale + 5 : baseScale
        }
      })

      const statusBadge = live
        ? '<span style="background:#16A34A;color:#fff;padding:1px 6px;border-radius:8px;font-size:11px;">● LIVE NOW</span>'
        : '<span style="background:#E5E7EB;color:#374151;padding:1px 6px;border-radius:8px;font-size:11px;">Upcoming</span>'
      const cap = a.max_participants ? `${a.current_participants || 0}/${a.max_participants}` : `${a.current_participants || 0}`
      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding:8px;max-width:230px;font-family:sans-serif;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;"></span>
            <span style="font-weight:700;color:#111;">${escapeHtml(a.title || 'Activity')}</span>
          </div>
          <div style="margin-bottom:4px;">${statusBadge}</div>
          <div style="font-size:12px;color:#555;line-height:1.5;">
            📍 ${escapeHtml(a.location || a.locationLabel || 'Campus')}<br/>
            🕒 ${formatActivityWindow(a)}<br/>
            👥 ${cap} joined
          </div>
        </div>`
      })
      marker.addListener('mouseover', () => infoWindow.open(map, marker))
      marker.addListener('mouseout', () => infoWindow.close())
      marker.addListener('click', () => { if (a.id && onActivityClick) onActivityClick(a.id) })
      markerStore.push(marker)
    })
  }

  // Set the activity list and (re)draw markers on whichever maps are live.
  const setMapActivities = (list) => {
    mapActivities.value = Array.isArray(list) ? list : []
    if (smallMap) drawActivityMarkers(smallMap, activityMarkers, activityCircles, 8)
    if (largeMap) drawActivityMarkers(largeMap, largeActivityMarkers, largeActivityCircles, 10)
  }

  const highlightRadarDot = (activityId) => {
    activeRadarDot.value = activityId
  }

  const resetRadarDot = () => {
    activeRadarDot.value = null
  }

  const showDotInfo = (dot) => {
    hoveredDot.value = dot
  }

  const hideDotInfo = () => {
    hoveredDot.value = null
  }

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Browser does not support geolocation'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
          })
        },
        (error) => {
          let errorMessage = 'Failed to get location'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'User denied the location permission request'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out'
              break
          }
          reject(new Error(errorMessage))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  const fetchThoughts = async () => {
    try {
      const params = {}
      if (selectedGroupId.value) {
        params.group_id = selectedGroupId.value
      }
      const response = await thoughtAPI.getThoughts(params)
      thoughts.value = response.data.data.thoughts || []
    } catch (error) {
      console.error('Failed to fetch thoughts:', error)
    }
  }

  const fetchMapThoughts = async () => {
    try {
      const params = {}
      if (selectedGroupId.value) {
        params.group_id = selectedGroupId.value
      }
      const response = await thoughtAPI.getMapThoughts(params)
      mapThoughts.value = response.data.data.thoughts || []
      updateMapMarkers()
    } catch (error) {
      console.error('Failed to fetch map thoughts:', error)
    }
  }

  const fetchVisibleUsers = async () => {
    try {
      const params = {}
      if (selectedGroupId.value) {
        params.group_id = selectedGroupId.value
      }
      const response = await visibilityAPI.getMapUsers(params)
      visibleUsers.value = response.data.data.users || []
      updateMapMarkers()
    } catch (error) {
      console.error('Failed to fetch visible users:', error)
    }
  }

  const toggleVisibility = async () => {
    try {
      let location = null

      if (!isVisible.value) {
        try {
          location = await getCurrentLocation()
        } catch (locError) {
          console.warn('Failed to get location:', locError.message)
          message.warning('Location unavailable, using default')
        }
      }

      const response = await visibilityAPI.updateVisibility({
        is_visible: !isVisible.value,
        current_location: location
      })

      if (response.data.success) {
        isVisible.value = !isVisible.value
        message.success(isVisible.value ? 'You are now visible on the map' : 'You are now invisible')
        fetchVisibleUsers()
      } else {
        message.error(response.data.error?.message || 'Failed to update visibility')
      }
    } catch (error) {
      console.error('Toggle visibility error:', error)
      message.error(error.response?.data?.error?.message || 'Failed to toggle visibility')
    }
  }

  const initGoogleMaps = async () => {
    try {
      if (!window.google) {
        await new Promise((resolve) => {
          const checkGoogle = setInterval(() => {
            if (window.google) {
              clearInterval(checkGoogle)
              resolve()
            }
          }, 100)
        })
      }

      const smallMapElement = document.getElementById('small-map')
      if (smallMapElement && window.google) {
        smallMap = new window.google.maps.Map(smallMapElement, {
          center: { lat: 42.4534, lng: -76.4735 },
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false
        })
      }

      updateMapMarkers()
    } catch (error) {
      console.error('Google Maps loading failed:', error)
      message.error('Map loading failed')
    }
  }

  const initLargeMap = async () => {
    try {
      if (!window.google) return

      const largeMapElement = document.getElementById('large-map')
      if (largeMapElement && !largeMap) {
        largeMap = new window.google.maps.Map(largeMapElement, {
          center: { lat: 42.4534, lng: -76.4735 },
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false
        })
        updateLargeMapMarkers()
      }
    } catch (error) {
      console.error('Large map initialization failed:', error)
    }
  }

  const updateMapMarkers = () => {
    if (!smallMap || !window.google) return

    thoughtMarkers.forEach(marker => marker.setMap(null))
    userMarkers.forEach(marker => marker.setMap(null))
    thoughtMarkers = []
    userMarkers = []

    mapThoughts.value.forEach(thought => {
      if (!(thought.location && thought.location.lat && thought.location.lng)) return

      const maxLength = 100
      const displayContent = thought.content.length > maxLength
        ? thought.content.substring(0, maxLength) + '...'
        : thought.content

      const avatarUrl = thought.user?.avatar_url
      const markerIcon = avatarUrl
        ? {
            url: avatarUrl,
            scaledSize: new window.google.maps.Size(36, 36),
            anchor: new window.google.maps.Point(18, 18),
            origin: new window.google.maps.Point(0, 0)
          }
        : {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#EF4444',
            fillOpacity: 0.8,
            strokeWeight: 2,
            strokeColor: '#FFF',
            scale: 12
          }

      const marker = new window.google.maps.Marker({
        position: { lat: thought.location.lat, lng: thought.location.lng },
        map: smallMap,
        title: thought.content,
        icon: markerIcon
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding: 8px; max-width: 200px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <img src="${avatarUrl || 'https://via.placeholder.com/32?text=U'}"
                 style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px; object-fit: cover;"
                 onerror="this.src='https://via.placeholder.com/32?text=U'" />
            <span style="font-weight: bold; color: #333;">${thought.user?.first_name || 'User'}</span>
          </div>
          <div style="font-size: 14px; color: #666; line-height: 1.4;">${displayContent}</div>
        </div>`
      })

      marker.addListener('mouseover', () => infoWindow.open(smallMap, marker))
      marker.addListener('mouseout', () => infoWindow.close())
      marker.addListener('click', () => {
        if (thought.user?.id) {
          handleUserMessage({ id: thought.user.id, name: thought.user.first_name })
        }
      })

      thoughtMarkers.push(marker)
    })

    visibleUsers.value.forEach(user => {
      if (!(user.current_location && user.current_location.lat && user.current_location.lng)) return

      const avatarUrl = user.avatar_url
      const markerIcon = avatarUrl
        ? {
            url: avatarUrl,
            scaledSize: new window.google.maps.Size(36, 36),
            anchor: new window.google.maps.Point(18, 18),
            origin: new window.google.maps.Point(0, 0)
          }
        : {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#3B82F6',
            fillOpacity: 0.8,
            strokeWeight: 2,
            strokeColor: '#FFF',
            scale: 12
          }

      const marker = new window.google.maps.Marker({
        position: { lat: user.current_location.lat, lng: user.current_location.lng },
        map: smallMap,
        title: user.first_name,
        icon: markerIcon
      })

      marker.addListener('click', () => {
        if (user.id) {
          handleUserMessage({ id: user.id, name: user.first_name })
        }
      })

      userMarkers.push(marker)
    })

    drawActivityMarkers(smallMap, activityMarkers, activityCircles, 8)
  }

  const updateLargeMapMarkers = () => {
    if (!largeMap || !window.google) return

    mapThoughts.value.forEach(thought => {
      if (!(thought.location && thought.location.lat && thought.location.lng)) return

      const avatarUrl = thought.user?.avatar_url
      const markerIcon = avatarUrl
        ? {
            url: avatarUrl,
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20),
            origin: new window.google.maps.Point(0, 0)
          }
        : {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#EF4444',
            fillOpacity: 0.8,
            strokeWeight: 2,
            strokeColor: '#FFF',
            scale: 12
          }

      const marker = new window.google.maps.Marker({
        position: { lat: thought.location.lat, lng: thought.location.lng },
        map: largeMap,
        title: thought.content,
        icon: markerIcon
      })

      marker.addListener('click', () => {
        if (thought.user?.id) {
          handleUserMessage({ id: thought.user.id, name: thought.user.first_name })
        }
      })
    })

    visibleUsers.value.forEach(user => {
      if (!(user.current_location && user.current_location.lat && user.current_location.lng)) return

      const avatarUrl = user.avatar_url
      const markerIcon = avatarUrl
        ? {
            url: avatarUrl,
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20),
            origin: new window.google.maps.Point(0, 0)
          }
        : {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#3B82F6',
            fillOpacity: 0.8,
            strokeWeight: 2,
            strokeColor: '#FFF',
            scale: 12
          }

      const marker = new window.google.maps.Marker({
        position: { lat: user.current_location.lat, lng: user.current_location.lng },
        map: largeMap,
        title: user.first_name,
        icon: markerIcon
      })

      marker.addListener('click', () => {
        if (user.id) {
          handleUserMessage({ id: user.id, name: user.first_name })
        }
      })
    })

    drawActivityMarkers(largeMap, largeActivityMarkers, largeActivityCircles, 10)
  }

  const toggleMapExpand = () => {
    isMapExpanded.value = !isMapExpanded.value
    if (isMapExpanded.value) {
      nextTick(() => {
        initLargeMap()
      })
    }
  }

  const loadMyVisibility = async () => {
    try {
      const response = await visibilityAPI.getMyVisibility()
      isVisible.value = response.data.data.visibility.is_visible
    } catch (error) {
      console.error('获取可见性状态失败:', error)
    }
  }

  return {
    isVisible,
    thoughts,
    mapThoughts,
    visibleUsers,
    activeRadarDot,
    isMapExpanded,
    hoveredDot,
    fetchThoughts,
    fetchMapThoughts,
    fetchVisibleUsers,
    toggleVisibility,
    getCurrentLocation,
    initGoogleMaps,
    initLargeMap,
    toggleMapExpand,
    showDotInfo,
    hideDotInfo,
    highlightRadarDot,
    resetRadarDot,
    loadMyVisibility,
    setMapActivities,
    mapActivities
  }
}

export default useActivityMap
