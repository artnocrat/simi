/**
 * ElevenLabs TTS proxy.
 * Keeps the API key on the server.
 * Returns audio/mpeg bytes.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const { text } = req.body
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text required' })
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'
    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return res.status(500).json({ error: 'ELEVENLABS_API_KEY not set' })
    }

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75,
          style: 0.35,
          use_speaker_boost: true
        }
      })
    })

    if (!r.ok) {
      const errText = await r.text()
      console.error('ElevenLabs error:', r.status, errText)
      return res.status(r.status).json({ error: 'TTS failed', detail: errText })
    }

    const buffer = Buffer.from(await r.arrayBuffer())
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(buffer)
  } catch (err) {
    console.error('TTS error:', err)
    return res.status(500).json({ error: err.message })
  }
}
