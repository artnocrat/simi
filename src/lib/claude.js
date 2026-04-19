/**
 * Client wrapper for /api/chat.
 * Sends the conversation history and returns Simi's reply.
 */
export async function sendToSimi({ messages, sessionId }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, sessionId })
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Chat API error: ${res.status} ${text}`)
  }
  return res.json() // { reply: string, signals: {...} }
}

/**
 * Asks Claude to generate 3 variants of a "share with family" message.
 */
export async function generateShareMessage({ transcript, sessionId }) {
  const res = await fetch('/api/share-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, sessionId })
  })
  if (!res.ok) throw new Error('Share message API error')
  return res.json() // { variants: [{ label, body }] }
}
