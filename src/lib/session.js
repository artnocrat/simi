/**
 * Local session state.
 * We use sessionStorage so conversations don't persist after closing the tab
 * unless the user signs in. This reinforces the "low friction, anonymous first"
 * principle.
 */

const SESSION_KEY = 'simi.session'

function uuid() {
  if (crypto?.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export function getOrCreateSession() {
  let s = sessionStorage.getItem(SESSION_KEY)
  if (s) {
    try { return JSON.parse(s) } catch (e) {}
  }
  const fresh = {
    id: uuid(),
    startedAt: Date.now(),
    messages: [],
    signals: {
      turnCount: 0,
      // Analysis signals from Claude — populated as conversation progresses.
      // These are what the clinician dashboard reads.
      mood: null,           // e.g. 'low', 'anxious', 'numb', 'hopeful'
      severity: 0,          // 0..10
      themes: [],           // e.g. ['work stress', 'family', 'sleep']
      languageMarkers: [],  // e.g. 'absolutist language', 'past-tense self-reference'
      nigerianContext: [],  // e.g. 'JAPA mentioned', 'family pressure', 'religious context'
      crisisFlag: false
    },
    user: null // set after Google sign-in
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(fresh))
  return fresh
}

export function updateSession(patch) {
  const s = getOrCreateSession()
  const next = { ...s, ...patch }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
  return next
}

export function addMessage(role, content) {
  const s = getOrCreateSession()
  s.messages.push({ role, content, at: Date.now() })
  s.signals.turnCount = s.messages.filter(m => m.role === 'user').length
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
  return s
}

export function updateSignals(newSignals) {
  const s = getOrCreateSession()
  s.signals = { ...s.signals, ...newSignals }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
  // Also publish to a broadcast channel so the clinician dashboard
  // (if open in another tab) can pick up live updates.
  try {
    const bc = new BroadcastChannel('simi-signals')
    bc.postMessage({ sessionId: s.id, signals: s.signals, messages: s.messages })
    bc.close()
  } catch (e) {}
  return s
}

export function setUser(user) {
  return updateSession({ user })
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}
