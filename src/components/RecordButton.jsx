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
          <div
            style={{
              position: 'absolute',
              width: '140px',
              height: '140px',
              borderRadius: '999px',
              border: '1px solid var(--amber)',
              opacity: 0.3,
              transform: `scale(${ringScale})`,
              transition: 'transform 80ms ease-out',
              pointerEvents: 'none'
            }}
          />
        )}
        <button
          onClick={onClick}
          disabled={disabled || isProcessing || isSpeaking}
          aria-label={label}
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '999px',
            background: isRecording
              ? 'radial-gradient(circle at 30% 30%, #f4c47a, var(--amber-soft))'
              : 'linear-gradient(145deg, #2a211a, #1a1510)',
            border: isRecording ? 'none' : '1px solid rgba(232, 167, 92, 0.25)',
            boxShadow: isRecording
              ? '0 0 40px rgba(232, 167, 92, 0.4), inset 0 0 20px rgba(255, 235, 200, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 300ms ease',
            cursor: disabled || isProcessing || isSpeaking ? 'default' : 'pointer',
            opacity: disabled ? 0.4 : 1
          }}
          onMouseEnter={(e) => {
            if (!disabled && !isRecording && !isProcessing && !isSpeaking) {
              e.currentTarget.style.transform = 'scale(1.04)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {/* Simple mic glyph — drawn, not an icon font */}
          <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
            <rect
              x="10" y="4" width="8" height="16" rx="4"
              fill={isRecording ? '#1a1510' : 'var(--amber)'}
            />
            <path
              d="M4 16c0 5.52 4.48 10 10 10s10-4.48 10-10"
              stroke={isRecording ? '#1a1510' : 'var(--amber)'}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <line
              x1="14" y1="26" x2="14" y2="30"
              stroke={isRecording ? '#1a1510' : 'var(--amber)'}
              strokeWidth="2"
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
