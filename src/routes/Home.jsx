import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Blob from '../components/Blob.jsx'
import Conversation from '../components/Conversation.jsx'
import RecordButton from '../components/RecordButton.jsx'
import ShareMessage from '../components/ShareMessage.jsx'
import CrisisSurface from '../components/CrisisSurface.jsx'
import SignInNudge from '../components/SignInNudge.jsx'
import { createRecognizer, createAudioMeter } from '../lib/stt.js'
import { speak } from '../lib/tts.js'
import { sendToSimi } from '../lib/claude.js'
import {
  getOrCreateSession,
  addMessage,
  updateSignals,
  getOrCreateSession as _
} from '../lib/session.js'

/**
 * The Home route.
 *
 * Two phases:
 *  1. Entry — user has never spoken. Big blob, greeting line, "tap to speak" CTA.
 *  2. Conversation — blob recedes slightly, fading conversation takes center.
 *
 * We open with a scripted greeting (audio + text) so the user hears Simi
 * before they have to speak. This removes a lot of the "what do I say" friction.
 */

const GREETING = "Hi. I'm Simi. There's nothing you have to say the right way. Whenever you're ready, just start talking."

export default function Home() {
  const [phase, setPhase] = useState('entry') // 'entry' | 'conversation'
  const [blobState, setBlobState] = useState('idle')
  const [audioLevel, setAudioLevel] = useState(0)
  const [messages, setMessages] = useState([])
  const [partial, setPartial] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState(null)
  const [showShare, setShowShare] = useState(false)
  const [showCrisis, setShowCrisis] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [greetingPlayed, setGreetingPlayed] = useState(false)

  const recognizerRef = useRef(null)
  const meterRef = useRef(null)
  const meterRafRef = useRef(null)

  // Load existing session messages on mount (if coming back from /peers etc.)
  useEffect(() => {
    const s = getOrCreateSession()
    if (s.messages && s.messages.length > 0) {
      setMessages(s.messages)
      setPhase('conversation')
      setGreetingPlayed(true)
    }
    if (s.user) setSignedIn(true)
  }, [])

  // Greeting plays on first "Begin" click (browsers require user gesture for audio)
  const playGreeting = async () => {
    if (greetingPlayed) return
    setGreetingPlayed(true)
    setPhase('conversation')
    setBlobState('speaking')
    setMessages(prev => [...prev, { role: 'assistant', content: GREETING }])
    addMessage('assistant', GREETING)
    try {
      await speak(GREETING, {
        onAmplitude: (a) => setAudioLevel(a),
        onEnd: () => {
          setAudioLevel(0)
          setBlobState('idle')
        }
      })
    } catch (e) {
      console.warn('TTS failed, continuing silently', e)
      setBlobState('idle')
    }
  }

  const startRecording = async () => {
    setError(null)
    setPartial('')

    // Audio meter for the blob
    try {
      meterRef.current = await createAudioMeter()
      const tick = () => {
        const lvl = meterRef.current.getLevel()
        setAudioLevel(lvl)
        meterRafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch (e) {
      setError('I need microphone permission to hear you. Please allow it and try again.')
      return
    }

    recognizerRef.current = createRecognizer({
      onPartial: (text) => setPartial(text),
      onFinal: async (text) => {
        await handleUserMessage(text)
      },
      onError: (e) => {
        setError(e.message)
        setBlobState('idle')
      },
      onEnd: () => {
        cancelAnimationFrame(meterRafRef.current)
        meterRef.current?.stop()
        setAudioLevel(0)
      }
    })

    if (!recognizerRef.current.supported) {
      setError('Your browser doesn\'t support voice. Try Chrome or Safari, or type instead.')
      return
    }

    recognizerRef.current.start()
    setBlobState('listening')
  }

  const stopRecording = () => {
    recognizerRef.current?.stop()
    setBlobState('thinking')
  }

  const handleUserMessage = async (text) => {
    if (!text || !text.trim()) {
      setBlobState('idle')
      return
    }
    setPartial('')

    const userMsg = { role: 'user', content: text.trim() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    addMessage('user', userMsg.content)

    setIsThinking(true)
    setBlobState('thinking')

    try {
      const { reply, signals } = await sendToSimi({
        messages: nextMessages,
        sessionId: getOrCreateSession().id
      })

      // Store signals (clinician dashboard picks these up via BroadcastChannel)
      if (signals) {
        updateSignals(signals)
        if (signals.crisisFlag) setShowCrisis(true)
      }

      const assistantMsg = { role: 'assistant', content: reply }
      setMessages([...nextMessages, assistantMsg])
      addMessage('assistant', reply)
      setIsThinking(false)

      // Speak the reply
      setBlobState('speaking')
      try {
        await speak(reply, {
          onAmplitude: (a) => setAudioLevel(a),
          onEnd: () => {
            setAudioLevel(0)
            setBlobState('idle')
          }
        })
      } catch (e) {
        console.warn('TTS failed', e)
        setBlobState('idle')
      }

      // Nudge sign-in after second user message (not too eager)
      const userTurns = nextMessages.filter(m => m.role === 'user').length
      if (userTurns === 2 && !signedIn) {
        setTimeout(() => setShowSignIn(true), 2000)
      }
    } catch (e) {
      setError(e.message)
      setIsThinking(false)
      setBlobState('idle')
    }
  }

  // Text fallback for those who prefer typing
  const [textInput, setTextInput] = useState('')
  const [showTextInput, setShowTextInput] = useState(false)
  const submitText = async (e) => {
    e.preventDefault()
    if (!textInput.trim()) return
    const t = textInput
    setTextInput('')
    await handleUserMessage(t)
  }

  const userTranscript = messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n')

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Top navigation — minimal */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: 'var(--s-4) var(--s-6)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50,
        background: 'linear-gradient(to bottom, var(--bg), transparent)'
      }}>
        <span className="display" style={{
          fontSize: '1.5rem',
          letterSpacing: '-0.04em',
          fontWeight: 400
        }}>
          simi
          <span style={{ color: 'var(--amber)' }}>.</span>
        </span>
        <div style={{ display: 'flex', gap: 'var(--s-4)' }}>
          {phase === 'conversation' && messages.filter(m => m.role === 'user').length >= 2 && (
            <>
              <button
                onClick={() => setShowShare(true)}
                className="mono"
                style={{
                  color: 'var(--ink-muted)',
                  transition: 'color 200ms'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--amber)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
              >
                tell someone
              </button>
              <Link
                to="/peers"
                className="mono"
                style={{
                  color: 'var(--ink-muted)',
                  borderBottom: 'none'
                }}
              >
                talk to a human
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Blob — centerpiece */}
      <section style={{
        flex: '0 0 auto',
        height: phase === 'entry' ? '62vh' : '34vh',
        transition: 'height 800ms cubic-bezier(0.65, 0, 0.35, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--s-12) var(--s-6) 0'
      }}>
        <div style={{
          width: phase === 'entry' ? 'min(400px, 70vw)' : 'min(240px, 40vw)',
          height: phase === 'entry' ? 'min(400px, 70vw)' : 'min(240px, 40vw)',
          transition: 'width 800ms, height 800ms'
        }}>
          <Blob state={blobState} audioLevel={audioLevel} />
        </div>
      </section>

      {/* Entry copy */}
      {phase === 'entry' && (
        <section style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          textAlign: 'center',
          padding: 'var(--s-6)',
          gap: 'var(--s-8)',
          animation: 'fadeIn 800ms ease both'
        }}>
          <h1
            className="display"
            style={{
              fontSize: 'clamp(2rem, 5.5vw, 3.75rem)',
              maxWidth: '760px',
              fontWeight: 300,
              color: 'var(--ink)'
            }}
          >
            Mental health, <em style={{ fontStyle: 'italic', color: 'var(--amber)' }}>in your voice.</em>
          </h1>
          <p style={{
            color: 'var(--ink-muted)',
            fontSize: '1rem',
            maxWidth: '480px',
            lineHeight: 1.6
          }}>
            Simi is an AI companion for the hours you don't know who to talk to.
            Built for Nigerians, by Nigerians. No forms. No judgment. No record of
            anything you don't want kept.
          </p>
          <button
            onClick={playGreeting}
            style={{
              padding: '0.9rem 2rem',
              background: 'var(--amber)',
              color: '#1a1510',
              borderRadius: '999px',
              fontSize: '0.95rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              boxShadow: '0 10px 40px rgba(232, 167, 92, 0.25)'
            }}
          >
            Begin
          </button>
          <p className="mono" style={{ color: 'var(--ink-faint)', maxWidth: '400px' }}>
            your voice stays on your device until you choose to share it
          </p>
        </section>
      )}

      {/* Conversation phase */}
      {phase === 'conversation' && (
        <>
          <section style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <Conversation
              messages={messages}
              isThinking={isThinking}
              partialUser={partial}
            />
          </section>

          {/* Control tray */}
          <section style={{
            padding: 'var(--s-6) var(--s-6) var(--s-12)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--s-4)'
          }}>
            {error && (
              <p style={{ color: 'var(--signal)', fontSize: '0.85rem', textAlign: 'center' }}>
                {error}
              </p>
            )}
            <RecordButton
              state={
                blobState === 'listening' ? 'recording' :
                isThinking ? 'processing' :
                blobState === 'speaking' ? 'speaking' :
                'idle'
              }
              onStart={startRecording}
              onStop={stopRecording}
              level={audioLevel}
            />
            <button
              onClick={() => setShowTextInput(v => !v)}
              className="mono"
              style={{ color: 'var(--ink-faint)', fontSize: '0.7rem' }}
            >
              {showTextInput ? 'use voice instead' : 'type instead'}
            </button>
            {showTextInput && (
              <form
                onSubmit={submitText}
                style={{
                  width: '100%',
                  maxWidth: '480px',
                  display: 'flex',
                  gap: 'var(--s-2)'
                }}
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="type what's on your mind…"
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-soft)',
                    border: '1px solid rgba(232, 167, 92, 0.15)',
                    borderRadius: '8px',
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--amber)',
                    color: '#1a1510',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  send
                </button>
              </form>
            )}
          </section>
        </>
      )}

      {showCrisis && <CrisisSurface onDismiss={() => setShowCrisis(false)} />}
      {showShare && (
        <ShareMessage
          transcript={userTranscript}
          onClose={() => setShowShare(false)}
        />
      )}
      {showSignIn && !signedIn && (
        <SignInNudge
          onSignedIn={() => { setSignedIn(true); setShowSignIn(false) }}
          onDismiss={() => setShowSignIn(false)}
        />
      )}
    </main>
  )
}
