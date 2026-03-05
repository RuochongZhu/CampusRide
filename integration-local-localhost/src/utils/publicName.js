import { ref } from 'vue'

export const NETID_SUFFIX_STORAGE_KEY = 'campusride_show_netid_suffix'

const getStoredNetIdPreference = () => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(NETID_SUFFIX_STORAGE_KEY) === '1'
}

const showNetIdSuffix = ref(getStoredNetIdPreference())

const syncNetIdPreference = () => {
  showNetIdSuffix.value = getStoredNetIdPreference()
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === NETID_SUFFIX_STORAGE_KEY) {
      syncNetIdPreference()
    }
  })
}

export const useNetIdSuffixPreference = () => showNetIdSuffix

export const setNetIdSuffixPreference = (enabled) => {
  const normalized = Boolean(enabled)
  showNetIdSuffix.value = normalized

  if (typeof window !== 'undefined') {
    localStorage.setItem(NETID_SUFFIX_STORAGE_KEY, normalized ? '1' : '0')
    window.dispatchEvent(new CustomEvent('name-display-updated', {
      detail: { showNetIdSuffix: normalized }
    }))
  }
}

const resolveShowNetIdOption = (options) => {
  if (typeof options === 'boolean') return options
  if (options && typeof options.showNetIdSuffix === 'boolean') {
    return options.showNetIdSuffix
  }
  return showNetIdSuffix.value
}

const getNetIdFromEmail = (email) => {
  const localPart = String(email || '').split('@')[0] || ''
  return localPart.trim()
}

const appendNetIdSuffix = (name, email, options) => {
  const baseName = String(name || '').trim()
  if (!baseName) return ''
  if (!resolveShowNetIdOption(options)) return baseName

  const netId = getNetIdFromEmail(email)
  if (!netId) return baseName

  const normalizedName = baseName.toLowerCase()
  const normalizedNetId = netId.toLowerCase()
  if (normalizedName === normalizedNetId || normalizedName.endsWith(`(${normalizedNetId})`)) {
    return baseName
  }

  return `${baseName} (${netId})`
}

const deriveNameFromEmail = (email) => {
  const localPart = getNetIdFromEmail(email)
  if (!localPart) return ''

  return localPart
    .split(/[._-]/)
    .find(Boolean) || localPart
}

const isLikelyEmailFragment = (value, email = '') => {
  const fragment = String(value || '').trim().toLowerCase()
  if (!fragment) return false
  if (fragment.includes('@')) return true

  const localPart = getNetIdFromEmail(email).toLowerCase()
  if (localPart) {
    if (localPart === fragment) return true
    if (localPart.endsWith(`.${fragment}`) || localPart.endsWith(`_${fragment}`) || localPart.endsWith(`-${fragment}`)) {
      return true
    }
  }

  // Common pattern like yj596 / user123 where digits are often from email local part.
  if (/[a-z]/.test(fragment) && /\d/.test(fragment)) return true

  return false
}

export const sanitizePublicDisplayName = (name, email = '', fallback = 'Unknown User', options) => {
  const rawName = String(name || '').trim()
  const normalized = rawName.replace(/\s+/g, ' ')

  if (normalized && !normalized.includes('@')) {
    const parts = normalized.split(' ')
    if (parts.length > 1 && isLikelyEmailFragment(parts[parts.length - 1], email)) {
      parts.pop()
    }

    const cleaned = parts.join(' ').trim()
    if (cleaned) return appendNetIdSuffix(cleaned, email, options)
  }

  const fromEmail = deriveNameFromEmail(email)
  if (fromEmail) return appendNetIdSuffix(fromEmail, email, options)

  return fallback
}

export const getPublicNameFromRaw = (firstName, lastName, email = '', fallback = 'Unknown User', options) => {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim()
  return sanitizePublicDisplayName(fullName, email, fallback, options)
}

export const getPublicUserName = (user, fallback = 'Unknown User', options) => {
  if (!user) return fallback

  if (user.name || user.full_name) {
    return sanitizePublicDisplayName(user.name || user.full_name, user.email, fallback, options)
  }

  return getPublicNameFromRaw(user.first_name, user.last_name, user.email, fallback, options)
}

export const getPublicInitial = (name, fallback = 'U') => {
  const text = String(name || '').trim()
  return text ? text.charAt(0).toUpperCase() : fallback
}
