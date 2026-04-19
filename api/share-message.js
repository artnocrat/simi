import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SHARE_PROMPT = `You help someone who has been talking to a mental health companion draft a message to send to a family member or close friend, telling them they are struggling.

Input: a summary of what the user has been sharing (in their own words, stripped of Simi's replies).

Task: generate THREE short messages the user could copy and send. Each message should:
- Be written in first person, as if from the user.
- Sound like a real Nigerian young adult writing to family — natural, not therapy-textbook.
- Be 2-4 sentences. Short enough to actually send.
- Not include diagnoses or medical language.
- Ask for something specific (time, presence, a call, understanding).

Generate three variants with different emotional registers:
1. "Gentle opening" — a soft first disclosure, for someone who has never told anyone before.
2. "Direct and asking" — for someone who wants to name it and request specific support.
3. "Brief, for text" — shortest possible. For when typing more feels impossible.

Return ONLY valid JSON in this exact shape, no prose before or after:
{
  "variants": [
    { "label": "Gentle opening", "body": "..." },
    { "label": "Direct and asking", "body": "..." },
    { "label": "Brief, for text", "body": "..." }
  ]
}`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { transcript } = req.body
    if (!transcript) return res.status(400).json({ error: 'transcript required' })

    const completion = await client.messages.create({
      model: process.env.SIMI_MODEL || 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: SHARE_PROMPT,
      messages: [{ role: 'user', content: `What I've been sharing:\n\n${transcript}` }]
    })

    let text = completion.content[0]?.text || '{}'
    // Strip any stray fences
    text = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(text)
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('Share message error:', err)
    return res.status(500).json({ error: err.message })
  }
}
