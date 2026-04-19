/**
 * Surfaces Nigerian mental health resources when Simi's signals detect crisis.
 *
 * Design principle: don't panic. Don't make the user feel pathologized.
 * Appears as a soft amber note, not a red alarm. The user can dismiss it.
 *
 * Resources listed are Nigerian mental health organizations. For the demo,
 * verify these numbers before recording the video — numbers change.
 */
export default function CrisisSurface({ onDismiss }) {
  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 'var(--s-4)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 80,
        maxWidth: '540px',
        width: 'calc(100% - 2rem)',
        background: 'var(--bg-elevated)',
        border: '1px solid rgba(232, 167, 92, 0.35)',
        borderRadius: '10px',
        padding: 'var(--s-4) var(--s-6)',
        animation: 'fadeIn 600ms ease both',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 'var(--s-4)'
      }}>
        <div>
          <p className="mono" style={{ color: 'var(--amber)', marginBottom: 'var(--s-2)' }}>
            if it feels too heavy tonight
          </p>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.05rem',
            lineHeight: 1.5,
            fontWeight: 300,
            marginBottom: 'var(--s-3)'
          }}>
            Please talk to a human. These people are trained and they're free.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)', fontSize: '0.9rem' }}>
            <div>
              <strong style={{ color: 'var(--ink)' }}>Mentally Aware Nigeria Initiative</strong>
              <br />
              <a href="tel:+2348091116264" style={{ color: 'var(--amber)' }}>+234 809 111 6264</a>
            </div>
            <div>
              <strong style={{ color: 'var(--ink)' }}>Nigeria Suicide Prevention Initiative</strong>
              <br />
              <a href="tel:+2348062106493" style={{ color: 'var(--amber)' }}>+234 806 210 6493</a>
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          aria-label="dismiss"
          style={{
            color: 'var(--ink-faint)',
            fontSize: '1.25rem',
            lineHeight: 1,
            padding: 'var(--s-1) var(--s-2)'
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
