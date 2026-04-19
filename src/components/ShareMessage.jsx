import { useEffect, useState } from 'react'
import { generateShareMessage } from '../lib/claude.js'

/**
 * "Help me tell someone" modal.
 *
 * User clicks a discrete link under the conversation.
 * We take their raw transcript, ask Claude to draft three variants,
 * show them, and let the user copy one.
 */
export default function ShareMessage({ transcript, onClose }) {
  const [loading, setLoading] = useState(true)
  const [variants, setVariants] = useState([])
  const [error, setError] = useState(null)
  const [copiedIndex, setCopiedIndex] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const result = await generateShareMessage({ transcript })
        setVariants(result.variants || [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [transcript])

  const copy = (text, i) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(i)
    setTimeout(() => setCopiedIndex(null), 1800)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13, 10, 8, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--s-6)',
        animation: 'fadeInSlow 300ms ease both'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'var(--bg-elevated)',
          border: '1px solid rgba(232, 167, 92, 0.15)',
          borderRadius: '12px',
          padding: 'var(--s-8)',
          animation: 'fadeIn 400ms ease both'
        }}
        className="no-scrollbar"
      >
        <div style={{ marginBottom: 'var(--s-6)' }}>
          <h2 className="display" style={{ fontSize: '1.75rem', marginBottom: 'var(--s-2)' }}>
            Help me tell someone.
          </h2>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.95rem' }}>
            Three ways to start the conversation. Copy whichever feels closest to how you mean it.
          </p>
        </div>

        {loading && (
          <p className="mono" style={{ color: 'var(--ink-faint)' }}>drafting…</p>
        )}

        {error && (
          <p style={{ color: 'var(--signal)' }}>
            Couldn't draft right now. {error}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
          {variants.map((v, i) => (
            <div
              key={i}
              style={{
                padding: 'var(--s-4)',
                background: 'var(--bg-soft)',
                border: '1px solid rgba(232, 167, 92, 0.08)',
                borderRadius: '8px'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--s-2)'
              }}>
                <span className="mono" style={{ color: 'var(--amber)' }}>{v.label}</span>
                <button
                  onClick={() => copy(v.body, i)}
                  style={{
                    fontSize: '0.75rem',
                    color: copiedIndex === i ? 'var(--amber)' : 'var(--ink-muted)',
                    fontFamily: 'var(--font-body)',
                    transition: 'color 200ms'
                  }}
                >
                  {copiedIndex === i ? 'copied ✓' : 'copy'}
                </button>
              </div>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.05rem',
                lineHeight: 1.5,
                color: 'var(--ink)',
                fontWeight: 300
              }}>
                {v.body}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 'var(--s-6)',
            color: 'var(--ink-faint)',
            fontSize: '0.85rem'
          }}
        >
          close
        </button>
      </div>
    </div>
  )
}
