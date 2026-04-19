/**
 * Fetch audio from /api/tts and play it.
 * Returns a promise that resolves when playback ends.
 *
 * onAmplitude: optional callback with normalized amplitude (0..1) for blob pulsing.
 */
export async function speak(text, { onAmplitude, onEnd } = {}) {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  if (!res.ok) {
    // Fallback to browser TTS
    return browserSpeak(text, { onEnd })
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)

  // Amplitude analysis for the blob
  if (onAmplitude) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const source = ctx.createMediaElementSource(audio)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyser.connect(ctx.destination)
      const data = new Uint8Array(analyser.frequencyBinCount)
      let raf
      const tick = () => {
        analyser.getByteFrequencyData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i]
        onAmplitude(Math.min(1, (sum / data.length) / 100))
        raf = requestAnimationFrame(tick)
      }
      audio.onplay = () => { raf = requestAnimationFrame(tick) }
      audio.onended = () => {
        cancelAnimationFrame(raf)
        ctx.close()
        URL.revokeObjectURL(url)
        onAmplitude(0)
        onEnd?.()
      }
    } catch (e) {
      console.warn('Amplitude analysis failed, falling back', e)
    }
  } else {
    audio.onended = () => {
      URL.revokeObjectURL(url)
      onEnd?.()
    }
  }

  await audio.play()
  return audio
}

function browserSpeak(text, { onEnd } = {}) {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.95
    u.pitch = 1.0
    u.onend = () => { onEnd?.(); resolve() }
    window.speechSynthesis.speak(u)
  })
}
