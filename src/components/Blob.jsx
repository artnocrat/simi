import { useEffect, useRef } from 'react'

/**
 * The Blob — Direction A: Soft Nebula.
 *
 * Not a rendered 3D object. A cluster of overlapping soft gradient clouds
 * that drift independently, producing a form with no hard edges anywhere.
 *
 * Composition:
 *  - 7 "mist nodes" orbiting the center at different radii, speeds, and phases
 *  - Each node is a large soft radial gradient (teal, amber, or deep blue)
 *  - The nodes overlap, creating areas of warmth where they intersect
 *  - No outline. No single defined boundary. You can't tell where it "ends".
 *
 * State effects:
 *  - idle:      nodes drift slowly in their orbits
 *  - listening: orbits expand outward; nodes pulse with mic amplitude
 *  - thinking: orbits contract; nodes accelerate in an internal swirl
 *  - speaking:  nodes pulse to TTS amplitude, warm color becomes more prominent
 *
 * Rendered with lighter composite so overlaps add light, mimicking real
 * volumetric scattering (like fog lit from within).
 */
export default function Blob({ state = 'idle', audioLevel = 0 }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const stateRef = useRef(state)
  const levelRef = useRef(audioLevel)

  useEffect(() => { stateRef.current = state }, [state])
  useEffect(() => { levelRef.current = audioLevel }, [audioLevel])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // Mist nodes. Each has a color, orbital radius, speed, phase, and size.
    // The "seed" values are picked so the composition feels asymmetric and alive.
    const nodes = [
      // Warm core — smaller, tighter orbit, keeps the heart of the form warm
      { color: [255, 190, 120], size: 0.55, orbit: 0.12, speed: 0.35, phase: 0.0,  alpha: 0.55 },
      { color: [255, 210, 150], size: 0.40, orbit: 0.08, speed: -0.25, phase: 2.1, alpha: 0.45 },

      // Teal mid-layer — the dominant color identity
      { color: [95, 211, 200], size: 0.70, orbit: 0.28, speed: 0.18, phase: 1.3, alpha: 0.35 },
      { color: [110, 220, 210], size: 0.60, orbit: 0.32, speed: -0.22, phase: 3.4, alpha: 0.32 },
      { color: [70, 180, 175], size: 0.65, orbit: 0.25, speed: 0.28, phase: 4.7, alpha: 0.28 },

      // Cool outer halo — deep blue, largest, softest
      { color: [50, 100, 130], size: 0.90, orbit: 0.40, speed: 0.12, phase: 0.8, alpha: 0.22 },
      { color: [60, 130, 155], size: 0.80, orbit: 0.35, speed: -0.14, phase: 5.5, alpha: 0.20 }
    ]

    let smoothLevel = 0
    let smoothExpand = 0  // drives orbital radius expansion/contraction by state

    const draw = (t) => {
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      const cx = w / 2
      const cy = h / 2
      const time = t / 1000

      smoothLevel += (levelRef.current - smoothLevel) * 0.10

      const state = stateRef.current

      // State-driven modifiers
      let expandTarget, speedMul, warmBoost, pulseAmp
      if (state === 'listening') {
        expandTarget = 1.15 + smoothLevel * 0.4
        speedMul = 1.3
        warmBoost = smoothLevel * 0.3
        pulseAmp = smoothLevel * 0.25
      } else if (state === 'thinking') {
        expandTarget = 0.88
        speedMul = 2.2              // fast internal swirl
        warmBoost = 0
        pulseAmp = 0.02
      } else if (state === 'speaking') {
        expandTarget = 1.05 + smoothLevel * 0.2
        speedMul = 1.1
        warmBoost = 0.25 + smoothLevel * 0.2   // warmer when speaking
        pulseAmp = 0.05 + smoothLevel * 0.2
      } else {
        // idle — breathes slowly
        expandTarget = 1.0 + Math.sin(time * 0.7) * 0.04
        speedMul = 1.0
        warmBoost = 0.05
        pulseAmp = 0.03 + Math.sin(time * 0.9) * 0.02
      }

      smoothExpand += (expandTarget - smoothExpand) * 0.04

      const base = Math.min(w, h) * 0.42   // big footprint; nodes spread out

      // Clear — fully, using identity transform (DPR-safe)
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()

      // Lighter composite so overlapping nodes brighten rather than darken
      ctx.globalCompositeOperation = 'lighter'

      nodes.forEach((node) => {
        // Orbital position
        const orbitR = base * node.orbit * smoothExpand
        const angle = time * node.speed * speedMul + node.phase
        // Independent vertical/horizontal noise so it's not a clean circle
        const nx = cx + Math.cos(angle) * orbitR + Math.sin(time * 0.4 + node.phase) * base * 0.03
        const ny = cy + Math.sin(angle) * orbitR + Math.cos(time * 0.5 + node.phase * 1.3) * base * 0.03

        // Size pulses with audio/state
        const pulse = 1 + Math.sin(time * 1.4 + node.phase) * 0.05 + pulseAmp
        const nodeR = base * node.size * pulse

        // Color with warm boost for "speaking" state
        let [r, g, b] = node.color
        if (warmBoost > 0) {
          r = Math.min(255, r + warmBoost * 30)
          g = Math.min(255, g + warmBoost * 15)
        }

        // Alpha — boost slightly when listening (node pulses in)
        const a = node.alpha * (1 + smoothLevel * 0.3)

        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nodeR)
        grad.addColorStop(0, `rgba(${r|0}, ${g|0}, ${b|0}, ${a})`)
        grad.addColorStop(0.5, `rgba(${r|0}, ${g|0}, ${b|0}, ${a * 0.3})`)
        grad.addColorStop(1, `rgba(${r|0}, ${g|0}, ${b|0}, 0)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(nx, ny, nodeR, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.globalCompositeOperation = 'source-over'

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block'
      }}
    />
  )
}