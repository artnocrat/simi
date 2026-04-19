import { useEffect, useRef } from 'react'

/**
 * Simi's conversation view.
 *
 * Design principle: don't show the wall of text.
 * - Only the MOST RECENT exchange is at full opacity.
 * - Previous exchanges fade by distance (50%, 20%, 8%, hidden).
 * - The text itself floats; there are no chat bubbles, no avatars, no timestamps.
 *
 * This mirrors how actual conversation feels: you are present to what is being
 * said now, not transcribing a record.
 */
export default function Conversation({ messages, isThinking, partialUser }) {
  const containerRef = useRef(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth'
    })
  }, [messages.length, partialUser])

  // Opacity falloff
  const opacityFor = (distanceFromEnd) => {
    if (distanceFromEnd === 0) return 1
    if (distanceFromEnd === 1) return 0.55
    if (distanceFromEnd === 2) return 0.22
    if (distanceFromEnd === 3) return 0.09
    return 0
  }

  const lastIndex = messages.length - 1

  return (
    <div
      ref={containerRef}
      className="no-scrollbar"
      style={{
        width: '100%',
        maxWidth: '640px',
        margin: '0 auto',
        padding: 'var(--s-6) var(--s-6) var(--s-16)',
        maxHeight: '50vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--s-8)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 15%, black 100%)',
        maskImage: 'linear-gradient(to bottom, transparent 0, black 15%, black 100%)'
      }}
    >
      {messages.map((msg, i) => {
        const distance = lastIndex - i
        const op = opacityFor(distance)
        if (op === 0) return null
        const isSimi = msg.role === 'assistant'
        return (
          <div
            key={i}
            style={{
              opacity: op,
              transition: 'opacity 800ms ease',
              textAlign: isSimi ? 'left' : 'right',
              animation: distance === 0 ? 'fadeIn 600ms ease both' : undefined
            }}
          >
            {isSimi ? (
              <p
                className="display"
                style={{
                  fontSize: 'clamp(1.25rem, 2.6vw, 1.75rem)',
                  lineHeight: 1.35,
                  color: 'var(--ink)',
                  fontWeight: 300
                }}
              >
                {msg.content}
              </p>
            ) : (
              <p
                style={{
                  fontSize: '0.95rem',
                  color: 'var(--ink-muted)',
                  fontStyle: 'italic',
                  maxWidth: '75%',
                  marginLeft: 'auto'
                }}
              >
                {msg.content}
              </p>
            )}
          </div>
        )
      })}

      {partialUser && (
        <div style={{ opacity: 0.5, textAlign: 'right', transition: 'opacity 200ms' }}>
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--amber)',
            fontStyle: 'italic',
            maxWidth: '75%',
            marginLeft: 'auto'
          }}>
            {partialUser}
          </p>
        </div>
      )}

      {isThinking && (
        <div style={{ animation: 'fadeInSlow 400ms ease both' }}>
          <span className="mono" style={{ color: 'var(--ink-faint)' }}>
            simi is thinking…
          </span>
        </div>
      )}
    </div>
  )
}
