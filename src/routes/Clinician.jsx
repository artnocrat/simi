import { useEffect, useState } from 'react'
import { getOrCreateSession } from '../lib/session.js'

/**
 * Clinician Dashboard.
 *
 * What this is, in product terms: a view that a licensed mental health
 * professional would see if the user has consented to share their session.
 * It shows Simi's linguistic + behavioral analysis — signals that emerge
 * across turns. The user never sees this view.
 *
 * For the hackathon demo: open this in a second tab/window. It picks up
 * live signals from Simi's conversation via BroadcastChannel, so judges
 * can watch the analysis evolve in real time.
 *
 * This is REAL analysis — Claude produces structured signals in each turn.
 */

const SEVERITY_LABELS = ['fine', 'fine', 'tender', 'tender', 'struggling', 'struggling', 'heavy', 'heavy', 'crisis', 'crisis', 'crisis']

export default function Clinician() {
  const [signals, setSignals] = useState(null)
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState(null)

  useEffect(() => {
    // Initial read
    const s = getOrCreateSession()
    setSessionId(s.id)
    setSignals(s.signals)
    setMessages(s.messages || [])

    // Subscribe to live updates from the main tab
    let bc
    try {
      bc = new BroadcastChannel('simi-signals')
      bc.onmessage = (e) => {
        const { sessionId: sid, signals: sig, messages: msgs } = e.data || {}
        if (sid) setSessionId(sid)
        if (sig) setSignals(sig)
        if (msgs) setMessages(msgs)
      }
    } catch (err) {
      console.warn('BroadcastChannel not supported, polling instead', err)
      const iv = setInterval(() => {
        const s = getOrCreateSession()
        setSignals(s.signals)
        setMessages(s.messages || [])
      }, 2000)
      return () => clearInterval(iv)
    }

    return () => bc?.close()
  }, [])

  const severity = signals?.severity ?? 0
  const turnCount = signals?.turnCount ?? 0

  return (
    <main style={{
      minHeight: '100vh',
      padding: 'var(--s-8) var(--s-6)',
      maxWidth: '1280px',
      margin: '0 auto'
    }}>
      <header style={{ marginBottom: 'var(--s-12)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 'var(--s-2)'
        }}>
          <h1 className="display" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 300 }}>
            Clinician view
            <span style={{ color: 'var(--amber)' }}>.</span>
          </h1>
          <span className="mono" style={{ color: 'var(--ink-faint)' }}>
            session · {sessionId?.slice(0, 8) || '—'}
          </span>
        </div>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.95rem', maxWidth: '700px' }}>
          What a licensed professional would see if this person chose to bring their
          conversation to a clinical session. Signals are derived by Simi in real time
          across every turn. The user never sees this view.
        </p>
      </header>

      {/* Top row: severity + turn count + mood */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--s-4)',
        marginBottom: 'var(--s-8)'
      }}>
        <Card label="current reading">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--s-3)' }}>
            <span className="display" style={{ fontSize: '3rem', fontWeight: 300, color: severityColor(severity) }}>
              {severity.toFixed ? severity.toFixed(1) : severity}
            </span>
            <span className="mono" style={{ color: 'var(--ink-muted)' }}>
              / 10 — {SEVERITY_LABELS[Math.round(severity)] || '—'}
            </span>
          </div>
          <SeverityBar value={severity} />
        </Card>

        <Card label="mood">
          <p className="display" style={{ fontSize: '1.75rem', fontWeight: 300 }}>
            {signals?.mood || '—'}
          </p>
        </Card>

        <Card label="turns">
          <p className="display" style={{ fontSize: '1.75rem', fontWeight: 300 }}>
            {turnCount}
          </p>
          <p className="mono" style={{ color: 'var(--ink-faint)', marginTop: 'var(--s-1)' }}>
            exchanges so far
          </p>
        </Card>

        <Card label="crisis flag" accent={signals?.crisisFlag ? 'signal' : undefined}>
          <p className="display" style={{
            fontSize: '1.75rem',
            fontWeight: 300,
            color: signals?.crisisFlag ? 'var(--signal)' : 'var(--ink)'
          }}>
            {signals?.crisisFlag ? 'raised' : 'none'}
          </p>
        </Card>
      </section>

      {/* Themes + markers */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--s-4)',
        marginBottom: 'var(--s-8)'
      }}>
        <Card label="themes">
          <Tags items={signals?.themes} />
        </Card>
        <Card label="language markers">
          <Tags items={signals?.languageMarkers} />
        </Card>
        <Card label="nigerian context">
          <Tags items={signals?.nigerianContext} accent />
        </Card>
      </section>

      {/* Transcript */}
      <section>
        <h2 className="mono" style={{ color: 'var(--ink-muted)', marginBottom: 'var(--s-4)' }}>
          transcript
        </h2>
        <div style={{
          background: 'var(--bg-soft)',
          border: '1px solid rgba(232, 167, 92, 0.08)',
          borderRadius: '10px',
          padding: 'var(--s-6)',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {messages.length === 0 ? (
            <p className="mono" style={{ color: 'var(--ink-faint)' }}>
              no session yet — open simi in another tab and begin
            </p>
          ) : (
            messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 'var(--s-4)' }}>
                <span className="mono" style={{
                  color: m.role === 'assistant' ? 'var(--amber)' : 'var(--ink-muted)'
                }}>
                  {m.role === 'assistant' ? 'simi' : 'user'}
                </span>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--ink)', marginTop: 'var(--s-1)' }}>
                  {m.content}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  )
}

function Card({ label, accent, children }) {
  return (
    <div style={{
      background: 'var(--bg-soft)',
      border: `1px solid ${accent === 'signal' ? 'rgba(217, 119, 87, 0.3)' : 'rgba(232, 167, 92, 0.08)'}`,
      borderRadius: '10px',
      padding: 'var(--s-6)'
    }}>
      <span className="mono" style={{ color: 'var(--ink-muted)', marginBottom: 'var(--s-3)', display: 'block' }}>
        {label}
      </span>
      {children}
    </div>
  )
}

function Tags({ items, accent }) {
  if (!items || items.length === 0) {
    return <p className="mono" style={{ color: 'var(--ink-faint)' }}>—</p>
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
      {items.map((t, i) => (
        <span
          key={i}
          style={{
            fontSize: '0.82rem',
            padding: '0.3rem 0.6rem',
            background: accent ? 'var(--amber-glow)' : 'rgba(255, 255, 255, 0.04)',
            color: accent ? 'var(--amber)' : 'var(--ink)',
            borderRadius: '4px',
            border: '1px solid rgba(232, 167, 92, 0.12)'
          }}
        >
          {t}
        </span>
      ))}
    </div>
  )
}

function SeverityBar({ value }) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100))
  return (
    <div style={{
      width: '100%',
      height: '4px',
      background: 'rgba(255,255,255,0.06)',
      borderRadius: '2px',
      marginTop: 'var(--s-3)',
      overflow: 'hidden'
    }}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        background: severityColor(value),
        transition: 'width 600ms ease, background 600ms ease'
      }} />
    </div>
  )
}

function severityColor(v) {
  if (v >= 8) return 'var(--signal)'
  if (v >= 5) return 'var(--amber)'
  return 'var(--ink-muted)'
}
