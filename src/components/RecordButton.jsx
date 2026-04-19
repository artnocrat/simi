import { useEffect, useState } from 'react'

/**
 * Record button.
 *
 * Not a generic "mic icon in a circle." This is a soft, breathing pill that
 * invites rather than commands. When recording, it glows amber and shows a
 * subtle pulse tied to input level.
 */
export default function RecordButton({
  state = 'idle',       // 'idle' | 'recording' | 'processing' | 'speaking'
  onStart,
  onStop,
  level = 0,
  disabled = false
}) {
  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'
  const isSpeaking = state === 'speaking'

  const label =
    isRecording ? 'tap to stop' :
    isProcessing ? 'simi is listening' :
    isSpeaking ? 'simi is speaking' :
    'tap to speak'

  const onClick = () => {
    if (disabled || isProcessing || isSpeaking) return
    if (isRecording) onStop?.()
    else onStart?.()
  }

  // Ring scale driven by audio level when recording
  const ringScale = 1 + (isRecording ? level * 0.6 : 0)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--s-4)'
    }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Breathing ring behind the button when recording */}
        {isRecording && (
          <>
            <div
              style={{
                position: 'absolute',
                width: '130px',
                height: '130px',
                borderRadius: '999px',
                border: '1px solid var(--amber)',
                opacity: 0.4,
                transform: `scale(${ringScale})`,
                transition: 'transform 80ms ease-out',
                pointerEvents: 'none'
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '170px',
                height: '170px',
                borderRadius: '999px',
                border: '1px solid var(--amber)',
                opacity: 0.15,
                transform: `scale(${1 + (ringScale - 1) * 0.6})`,
                transition: 'transform 120ms ease-out',
                pointerEvents: 'none'
              }}
            />
          </>
        )}
        <button
          onClick={onClick}
          disabled={disabled || isProcessing || isSpeaking}
          aria-label={label}
          style={{
            width: '88px',
            height: '88px',
            borderRadius: '999px',
            background: 'transparent',
            border: isRecording
              ? '1.5px solid var(--amber)'
              : '1px solid rgba(232, 236, 239, 0.18)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: isRecording
              ? '0 0 30px rgba(95, 211, 200, 0.25), inset 0 0 20px rgba(95, 211, 200, 0.06)'
              : '0 4px 24px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: disabled || isProcessing || isSpeaking ? 'default' : 'pointer',
            opacity: disabled ? 0.4 : 1
          }}
          onMouseEnter={(e) => {
            if (!disabled && !isRecording && !isProcessing && !isSpeaking) {
              e.currentTarget.style.borderColor = 'rgba(95, 211, 200, 0.5)'
              e.currentTarget.style.transform = 'scale(1.03)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isRecording
              ? 'var(--amber)'
              : 'rgba(232, 236, 239, 0.18)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {/* Mic glyph — thin-stroke, line-art style to match the restraint */}
          <svg width="22" height="28" viewBox="0 0 22 28" fill="none">
            <rect
              x="7" y="2" width="8" height="14" rx="4"
              fill="none"
              stroke={isRecording ? 'var(--amber)' : 'rgba(232, 236, 239, 0.85)'}
              strokeWidth="1.5"
            />
            <path
              d="M2 14c0 4.97 4.03 9 9 9s9-4.03 9-9"
              stroke={isRecording ? 'var(--amber)' : 'rgba(232, 236, 239, 0.85)'}
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <line
              x1="11" y1="23" x2="11" y2="27"
              stroke={isRecording ? 'var(--amber)' : 'rgba(232, 236, 239, 0.85)'}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <span className="mono" style={{
        color: isRecording ? 'var(--amber)' : 'var(--ink-faint)',
        transition: 'color 300ms ease'
      }}>
        {label}
      </span>
    </div>
  )
}
