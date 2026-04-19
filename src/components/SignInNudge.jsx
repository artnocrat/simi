import { useGoogleLogin } from '@react-oauth/google'
import { setUser } from '../lib/session.js'

/**
 * Appears as a soft bottom sheet after the first meaningful exchange.
 * Non-modal. User can keep talking without signing in.
 *
 * This preserves the "low friction first visit" rule while still giving us
 * a way to collect a stable identity for users who want to come back.
 */
export default function SignInNudge({ onSignedIn, onDismiss }) {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // Fetch profile with the access token
      try {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        })
        const profile = await profileRes.json()
        const user = {
          sub: profile.sub,
          email: profile.email,
          name: profile.name,
          picture: profile.picture
        }
        setUser(user)
        onSignedIn?.(user)
      } catch (e) {
        console.error('Google profile fetch failed', e)
      }
    },
    onError: () => console.warn('Google sign-in failed')
  })

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'var(--s-6)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        maxWidth: '420px',
        width: 'calc(100% - 2rem)',
        background: 'var(--bg-elevated)',
        border: '1px solid rgba(232, 167, 92, 0.15)',
        borderRadius: '12px',
        padding: 'var(--s-4) var(--s-6)',
        animation: 'fadeIn 600ms ease both',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}
    >
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1rem',
        fontWeight: 300,
        color: 'var(--ink)',
        marginBottom: 'var(--s-3)'
      }}>
        Want this conversation to be here tomorrow?
      </p>
      <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: 'var(--s-4)' }}>
        Sign in so we can hold it for you. We keep only what helps you.
      </p>
      <div style={{ display: 'flex', gap: 'var(--s-3)', alignItems: 'center' }}>
        <button
          onClick={() => login()}
          style={{
            background: 'var(--amber)',
            color: '#1a1510',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          Continue with Google
        </button>
        <button onClick={onDismiss} style={{ fontSize: '0.82rem', color: 'var(--ink-faint)' }}>
          not now
        </button>
      </div>
    </div>
  )
}
