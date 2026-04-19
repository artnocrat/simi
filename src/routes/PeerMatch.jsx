import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

/**
 * PeerMatch route.
 *
 * Shows the user a small, curated set of anonymous peer supporters who have
 * walked similar paths. In production, matching would be driven by signals
 * from Simi's analysis. For the demo, we show a static set.
 *
 * Clicking "start call" opens a simulated call screen (we narrate the live
 * AI coaching feature over this in the video — building real WebRTC is out
 * of scope for the hackathon timeline).
 */

const SUPPORTERS = [
  {
    id: 'p1',
    alias: 'Ade · 28',
    context: 'burnout · family pressure · faith',
    bio: 'Left finance for painting. Knows the shame of disappointing people who love you. Good listener.',
    available: true
  },
  {
    id: 'p2',
    alias: 'Chiamaka · 24',
    context: 'anxiety · JAPA · isolation',
    bio: 'Moved to Canada last year. Understands the quiet grief of leaving and the noise of starting over.',
    available: true
  },
  {
    id: 'p3',
    alias: 'Tunde · 31',
    context: 'depression · post-NYSC · men',
    bio: 'Survived the dark stretch after service year. Believes men get to cry.',
    available: false
  }
]

export default function PeerMatch() {
  const [inCall, setInCall] = useState(null)

  if (inCall) {
    return <CallScreen supporter={inCall} onEnd={() => setInCall(null)} />
  }

  return (
    <main style={{
      minHeight: '100vh',
      padding: 'var(--s-8) var(--s-6)',
      maxWidth: '780px',
      margin: '0 auto'
    }}>
      <header style={{ marginBottom: 'var(--s-12)' }}>
        <Link to="/" className="mono" style={{
          color: 'var(--ink-muted)',
          borderBottom: 'none',
          marginBottom: 'var(--s-6)',
          display: 'inline-block'
        }}>
          ← back to simi
        </Link>
        <h1 className="display" style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 300,
          marginBottom: 'var(--s-3)'
        }}>
          People who get it<span style={{ color: 'var(--amber)' }}>.</span>
        </h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '580px' }}>
          Trained peer supporters who have lived through what you're describing.
          Calls are voice-only, encrypted, and anonymous — nobody sees your name or number,
          including the person on the other end.
        </p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
        {SUPPORTERS.map(s => (
          <article
            key={s.id}
            style={{
              background: 'var(--bg-soft)',
              border: '1px solid rgba(232, 167, 92, 0.08)',
              borderRadius: '12px',
              padding: 'var(--s-6)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'var(--s-6)',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', marginBottom: 'var(--s-2)' }}>
                <span className="display" style={{ fontSize: '1.25rem', fontWeight: 400 }}>
                  {s.alias}
                </span>
                {s.available ? (
                  <span className="mono" style={{ color: '#8bc49a' }}>
                    • available now
                  </span>
                ) : (
                  <span className="mono" style={{ color: 'var(--ink-faint)' }}>
                    • away
                  </span>
                )}
              </div>
              <p className="mono" style={{ color: 'var(--amber)', marginBottom: 'var(--s-2)' }}>
                {s.context}
              </p>
              <p style={{ fontSize: '0.95rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                {s.bio}
              </p>
            </div>
            <button
              disabled={!s.available}
              onClick={() => setInCall(s)}
              style={{
                padding: '0.75rem 1.5rem',
                background: s.available ? 'var(--amber)' : 'transparent',
                color: s.available ? '#1a1510' : 'var(--ink-faint)',
                border: s.available ? 'none' : '1px solid rgba(232, 167, 92, 0.15)',
                borderRadius: '999px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: s.available ? 'pointer' : 'default',
                whiteSpace: 'nowrap'
              }}
            >
              start call
            </button>
          </article>
        ))}
      </section>

      <footer style={{ marginTop: 'var(--s-16)', textAlign: 'center' }}>
        <p className="mono" style={{ color: 'var(--ink-faint)' }}>
          all peer supporters complete 40 hours of training · all calls are end-to-end encrypted
        </p>
      </footer>
    </main>
  )
}

/**
 * Simulated call screen.
 * In production this would be a real WebRTC voice call, with Simi providing
 * real-time coaching prompts to the supporter's side (not the user's).
 * For the demo, we show the user-facing call UI with a gentle narration.
 */
function CallScreen({ supporter, onEnd }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--s-8)',
      gap: 'var(--s-8)'
    }}>
      <div style={{
        width: '220px',
        height: '220px',
        borderRadius: '999px',
        background: 'radial-gradient(circle at 30% 30%, rgba(232, 167, 92, 0.4), rgba(232, 167, 92, 0.1))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'pulse 2.4s ease-in-out infinite'
      }}>
        <span className="display" style={{ fontSize: '1.75rem', color: 'var(--ink)', fontWeight: 300 }}>
          {supporter.alias.split(' · ')[0]}
        </span>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p className="mono" style={{ color: 'var(--amber)', marginBottom: 'var(--s-2)' }}>
          connected · encrypted · anonymous
        </p>
        <p className="display" style={{ fontSize: '2rem', fontWeight: 300 }}>
          {mm}:{ss}
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: 'var(--s-4)',
        marginTop: 'var(--s-4)'
      }}>
        <button
          style={{
            width: '56px', height: '56px', borderRadius: '999px',
            background: 'var(--bg-elevated)',
            border: '1px solid rgba(232, 167, 92, 0.15)'
          }}
          aria-label="mute"
        >
          🎤
        </button>
        <button
          onClick={onEnd}
          style={{
            padding: '0 2rem',
            height: '56px', borderRadius: '999px',
            background: 'var(--signal)',
            color: '#1a1510',
            fontWeight: 600
          }}
        >
          end call
        </button>
      </div>

      <p className="mono" style={{ color: 'var(--ink-faint)', maxWidth: '400px', textAlign: 'center', marginTop: 'var(--s-6)' }}>
        simi is invisibly coaching {supporter.alias.split(' · ')[0]} in real time — surfacing what you need, not what's easy to say
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
      `}</style>
    </main>
  )
}
