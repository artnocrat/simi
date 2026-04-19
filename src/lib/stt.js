/**
 * Web Speech API wrapper.
 * Mobile-hardened version.
 */
export function createRecognizer({ onPartial, onFinal, onError, onEnd }) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!Recognition) {
    return {
      supported: false,
      start: () => onError?.(new Error('Speech recognition not supported in this browser. Try Chrome or Safari.')),
      stop: () => {}
    }
  }

  const isMobile = /Mobi|Android/i.test(navigator.userAgent)

  const rec = new Recognition()
  // Mobile Chrome is unreliable with continuous mode
  rec.continuous = !isMobile
  rec.interimResults = true
  // en-NG often fails on mobile recognizer service; fall back to en-US which
  // still handles Nigerian English accents reasonably well
  rec.lang = isMobile ? 'en-US' : 'en-NG'

  let finalTranscript = ''
  let stopped = false   // track whether user explicitly stopped, so we don't auto-restart

  rec.onresult = (event) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' '
      } else {
        interim += transcript
      }
    }
    onPartial?.(finalTranscript + interim)
  }

  rec.onerror = (event) => {
    // Log every error so we can diagnose on mobile
    console.error('SpeechRecognition error:', event.error, event)
    // 'no-speech' on mobile fires when the recognizer times out but user is still speaking.
    // Just restart silently.
    if (event.error === 'no-speech' && !stopped) {
      try { rec.start() } catch (e) {}
      return
    }
    onError?.(new Error(event.error || 'Recognition error'))
  }

  rec.onend = () => {
    // On mobile, the recognizer auto-ends after short silence. If the user
    // hasn't tapped stop, restart it so recording feels continuous.
    if (isMobile && !stopped) {
      try { rec.start(); return } catch (e) {}
    }
    if (finalTranscript.trim()) onFinal?.(finalTranscript.trim())
    onEnd?.()
  }

  return {
    supported: true,
    start: () => {
      finalTranscript = ''
      stopped = false
      try { rec.start() } catch (e) { /* already started */ }
    },
    stop: () => {
      stopped = true
      try { rec.stop() } catch (e) {}
    }
  }
}

/**
 * Audio level meter — unchanged.
 */
export async function createAudioMeter() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  source.connect(analyser)
  const data = new Uint8Array(analyser.frequencyBinCount)

  return {
    getLevel: () => {
      analyser.getByteFrequencyData(data)
      let sum = 0
      for (let i = 0; i < data.length; i++) sum += data[i]
      return Math.min(1, (sum / data.length) / 128)
    },
    stop: () => {
      stream.getTracks().forEach(t => t.stop())
      ctx.close()
    }
  }
}