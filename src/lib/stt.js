/**
 * Web Speech API wrapper.
 * Returns an object with start(), stop(), and event handlers.
 *
 * Known limitations:
 *  - Not supported in Firefox
 *  - Accuracy varies by accent; for Nigerian English, ask users to speak
 *    at a measured pace and the accuracy is decent.
 *
 * Upgrade path (Monday if time allows): record with MediaRecorder,
 * POST the blob to /api/transcribe which calls OpenAI Whisper or
 * Deepgram Nova-2 (has a Nigerian English model).
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

  const rec = new Recognition()
  // Mobile browsers are unreliable with continuous mode — use non-continuous
  // and restart the recognizer between utterances instead
  const isMobile = /Mobi|Android/i.test(navigator.userAgent)
  rec.continuous = !isMobile
  rec.interimResults = true
  rec.lang = 'en-NG'

  let finalTranscript = ''

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
    onError?.(new Error(event.error || 'Recognition error'))
  }

  rec.onend = () => {
    if (finalTranscript.trim()) onFinal?.(finalTranscript.trim())
    onEnd?.()
  }

  return {
    supported: true,
    start: () => {
      finalTranscript = ''
      try { rec.start() } catch (e) { /* already started */ }
    },
    stop: () => {
      try { rec.stop() } catch (e) {}
    }
  }
}

/**
 * Audio level meter — for the blob to react to the user's voice.
 * Returns { start, stop, getLevel }.
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
