import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * Device detection composable
 * Provides reactive device type detection based on:
 * 1. User Agent detection (mobile/tablet/desktop)
 * 2. Screen width breakpoints
 * 3. Touch capability detection
 */
export function useDevice() {
  const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 768)

  // Breakpoints (matching Tailwind defaults)
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  }

  // Detect mobile device via User Agent
  const isMobileDevice = computed(() => {
    if (typeof navigator === 'undefined') return false
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent.toLowerCase())
  })

  // Detect tablet device via User Agent
  const isTabletDevice = computed(() => {
    if (typeof navigator === 'undefined') return false
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    return /ipad|android(?!.*mobile)|tablet/i.test(userAgent.toLowerCase())
  })

  // Detect touch capability
  const isTouchDevice = computed(() => {
    if (typeof window === 'undefined') return false
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  // Screen size based detection
  const isXs = computed(() => windowWidth.value < breakpoints.sm) // < 640px
  const isSm = computed(() => windowWidth.value >= breakpoints.sm && windowWidth.value < breakpoints.md) // 640-767px
  const isMd = computed(() => windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg) // 768-1023px
  const isLg = computed(() => windowWidth.value >= breakpoints.lg && windowWidth.value < breakpoints.xl) // 1024-1279px
  const isXl = computed(() => windowWidth.value >= breakpoints.xl) // >= 1280px

  // Combined device type detection
  const isMobile = computed(() => isXs.value || isSm.value || isMobileDevice.value)
  const isTablet = computed(() => isMd.value || isTabletDevice.value)
  const isDesktop = computed(() => isLg.value || isXl.value)

  // Convenience computed properties
  const isMobileOrTablet = computed(() => isMobile.value || isTablet.value)
  const isSmallScreen = computed(() => windowWidth.value < breakpoints.md) // < 768px
  const isMediumScreen = computed(() => windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg)
  const isLargeScreen = computed(() => windowWidth.value >= breakpoints.lg)

  // Current device type as string
  const deviceType = computed(() => {
    if (isMobile.value) return 'mobile'
    if (isTablet.value) return 'tablet'
    return 'desktop'
  })

  // Orientation detection
  const isPortrait = computed(() => windowHeight.value > windowWidth.value)
  const isLandscape = computed(() => windowWidth.value >= windowHeight.value)

  // Handle resize
  let resizeTimeout = null
  const handleResize = () => {
    // Debounce resize events
    if (resizeTimeout) clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      windowWidth.value = window.innerWidth
      windowHeight.value = window.innerHeight
    }, 100)
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      // Initial size
      windowWidth.value = window.innerWidth
      windowHeight.value = window.innerHeight
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeout) clearTimeout(resizeTimeout)
    }
  })

  return {
    // Raw values
    windowWidth,
    windowHeight,
    breakpoints,

    // User agent detection
    isMobileDevice,
    isTabletDevice,
    isTouchDevice,

    // Breakpoint detection
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,

    // Combined detection
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,

    // Screen size helpers
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,

    // Device type string
    deviceType,

    // Orientation
    isPortrait,
    isLandscape
  }
}

export default useDevice
