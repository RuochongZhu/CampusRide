const STORAGE_KEYS = {
  hiddenAt: 'campusride_hidden_at',
  lastReloadAt: 'campusride_last_reload_at',
  lastReloadReason: 'campusride_last_reload_reason'
}

const readSessionNumber = (key) => {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return 0
    const value = Number(raw)
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

const writeSessionValue = (key, value) => {
  try {
    sessionStorage.setItem(key, String(value))
  } catch {
    // Ignore storage errors (e.g., privacy mode)
  }
}

const dispatchResumeEvent = (detail) => {
  try {
    window.dispatchEvent(new CustomEvent('campusride:resume', { detail }))
  } catch {
    // Ignore CustomEvent issues
  }
}

const safeReload = (reason, minReloadGapMs) => {
  const now = Date.now()
  const lastReloadAt = readSessionNumber(STORAGE_KEYS.lastReloadAt)
  if (lastReloadAt && now - lastReloadAt < minReloadGapMs) return

  writeSessionValue(STORAGE_KEYS.lastReloadAt, now)
  writeSessionValue(STORAGE_KEYS.lastReloadReason, reason)
  window.location.reload()
}

export const installAppRecovery = (options = {}) => {
  const staleMs =
    Number(import.meta.env.VITE_APP_STALE_RELOAD_MS) ||
    options.staleMs ||
    2 * 60 * 60 * 1000 // 2 hours

  const minReloadGapMs = options.minReloadGapMs || 60 * 1000
  const heartbeatMs = options.heartbeatMs || 60 * 1000
  const driftAllowanceMs = options.driftAllowanceMs || 5 * 60 * 1000

  let hiddenAt = 0
  let lastTickAt = Date.now()

  const markHidden = () => {
    hiddenAt = Date.now()
    writeSessionValue(STORAGE_KEYS.hiddenAt, hiddenAt)
  }

  const clearHidden = () => {
    hiddenAt = 0
    writeSessionValue(STORAGE_KEYS.hiddenAt, 0)
  }

  const handleResume = (reason) => {
    const now = Date.now()
    const storedHiddenAt = hiddenAt || readSessionNumber(STORAGE_KEYS.hiddenAt)
    const inactiveMs = storedHiddenAt ? Math.max(0, now - storedHiddenAt) : 0

    dispatchResumeEvent({ reason, inactiveMs })

    if (inactiveMs >= staleMs) {
      safeReload(`resume:${reason}:inactiveMs=${inactiveMs}`, minReloadGapMs)
      return
    }

    clearHidden()
  }

  const onVisibilityChange = () => {
    if (document.hidden) {
      markHidden()
    } else {
      handleResume('visibilitychange')
    }
  }

  const onFocus = () => {
    if (!document.hidden) handleResume('focus')
  }

  const onOnline = () => {
    if (!document.hidden) handleResume('online')
  }

  const onPageShow = (event) => {
    if (event?.persisted && !document.hidden) {
      handleResume('pageshow')
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('focus', onFocus)
  window.addEventListener('online', onOnline)
  window.addEventListener('pageshow', onPageShow)

  const intervalId = window.setInterval(() => {
    const now = Date.now()
    const delta = now - lastTickAt

    if (delta > heartbeatMs + driftAllowanceMs && delta >= staleMs) {
      dispatchResumeEvent({ reason: 'timer_drift', inactiveMs: delta })
      safeReload(`resume:timer_drift:inactiveMs=${delta}`, minReloadGapMs)
    }

    lastTickAt = now
  }, heartbeatMs)

  return () => {
    window.clearInterval(intervalId)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('focus', onFocus)
    window.removeEventListener('online', onOnline)
    window.removeEventListener('pageshow', onPageShow)
  }
}

