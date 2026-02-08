const deriveNameFromEmail = (email) => {
  const localPart = String(email || '').split('@')[0] || ''
  if (!localPart) return ''

  return localPart
    .split(/[._-]/)
    .find(Boolean) || localPart
}

const isLikelyEmailFragment = (value, email = '') => {
  const fragment = String(value || '').trim().toLowerCase()
  if (!fragment) return false
  if (fragment.includes('@')) return true

  const localPart = String(email || '').split('@')[0]?.toLowerCase() || ''
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

export const sanitizePublicDisplayName = (name, email = '', fallback = 'Unknown User') => {
  const rawName = String(name || '').trim()
  const normalized = rawName.replace(/\s+/g, ' ')

  if (normalized && !normalized.includes('@')) {
    const parts = normalized.split(' ')
    if (parts.length > 1 && isLikelyEmailFragment(parts[parts.length - 1], email)) {
      parts.pop()
    }

    const cleaned = parts.join(' ').trim()
    if (cleaned) return cleaned
  }

  const fromEmail = deriveNameFromEmail(email)
  if (fromEmail) return fromEmail

  return fallback
}

export const getPublicNameFromRaw = (firstName, lastName, email = '', fallback = 'Unknown User') => {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim()
  return sanitizePublicDisplayName(fullName, email, fallback)
}

export const getPublicUserName = (user, fallback = 'Unknown User') => {
  if (!user) return fallback

  if (user.name || user.full_name) {
    return sanitizePublicDisplayName(user.name || user.full_name, user.email, fallback)
  }

  return getPublicNameFromRaw(user.first_name, user.last_name, user.email, fallback)
}

export const getPublicInitial = (name, fallback = 'U') => {
  const text = String(name || '').trim()
  return text ? text.charAt(0).toUpperCase() : fallback
}
