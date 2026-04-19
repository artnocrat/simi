import { useEffect, useRef } from 'react'

/**
 * The Blob — Simi's only visual character.
 *
 * States:
 *  - idle:      slow, shallow breathing
 *  - listening: expands, shimmers with audio amplitude
 *  - thinking:  inner swirl, held breath
 *  - speaking:  pulse to TTS amplitude (we fake this with a smooth sine for now,
 *               since we'd need to wire up the audio element's analyser — easy to add)
 *
 * It's rendered on <canvas> because we need per-frame organic deformation
 * (SVG can do this with many animated path points, but canvas is cleaner).
 */
export default function Blob({ state = 'idle', audioLevel = 0 }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const stateRef = useRef(state)
  const levelRef = useRef(audioLevel)

  // Keep refs current without re-subscribing the animation loop
  useEffect(() => { stateRef.current = state }, [state])
  useEffect(() => { levelRef.current = audioLevel }, [audioLevel])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Handle HiDPI
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    // Smoothed level for nicer visual response
    let smoothLevel = 0

    const draw = (t) => {
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      const cx = w / 2
      const cy = h / 2

      // Approach target amplitude smoothly
      const target = levelRef.current
      smoothLevel += (target - smoothLevel) * 0.15

      ctx.clearRect(0, 0, w, h)

      const state = stateRef.current
      const time = t / 1000

      // Base radius changes subtly with state
      const base = Math.min(w, h) * 0.22
      const breath =
        state === 'listening' ? Math.sin(time * 2.0) * 4 + smoothLevel * 40 :
        state === 'thinking'  ? Math.sin(time * 1.2) * 2 :
        state === 'speaking'  ? Math.sin(time * 5.5) * 6 + smoothLevel * 30 :
                                Math.sin(time * 0.9) * 3   // idle: slow breath
      const radius = base + breath

      // Draw multiple layered organic paths for depth
      const layers = [
        { scale: 1.00, alpha: 1.00, hue: 30 },
        { scale: 1.08, alpha: 0.35, hue: 22 },
        { scale: 1.18, alpha: 0.12, hue: 18 },
        { scale: 1.35, alpha: 0.05, hue: 14 }
      ]

      layers.forEach((layer, li) => {
        ctx.beginPath()
        const steps = 120
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * Math.PI * 2
          // Organic noise — sum of sines at different frequencies
          const n =
            Math.sin(angle * 3 + time * 0.7 + li) * 0.04 +
            Math.sin(angle * 5 - time * 0.9 + li * 2) * 0.03 +
            Math.sin(angle * 2 + time * 1.3) * 0.02
          const r = radius * layer.scale * (1 + n)
          const x = cx + Math.cos(angle) * r
          const y = cy + Math.sin(angle) * r
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()

        // Warm radial gradient — lamp-like
        const grad = ctx.createRadialGradient(
          cx - radius * 0.2, cy - radius * 0.2, radius * 0.1,
          cx, cy, radius * layer.scale * 1.1
        )
        grad.addColorStop(0, `hsla(${layer.hue + 8}, 70%, 72%, ${layer.alpha})`)
        grad.addColorStop(0.5, `hsla(${layer.hue}, 60%, 55%, ${layer.alpha * 0.8})`)
        grad.addColorStop(1, `hsla(${layer.hue - 4}, 50%, 35%, 0)`)
        ctx.fillStyle = grad
        ctx.fill()
      })

      // Inner highlight — the "soul"
      const coreGrad = ctx.createRadialGradient(
        cx - radius * 0.15, cy - radius * 0.15, 0,
        cx, cy, radius * 0.6
      )
      coreGrad.addColorStop(0, 'rgba(255, 235, 200, 0.7)')
      coreGrad.addColorStop(0.4, 'rgba(232, 167, 92, 0.3)')
      coreGrad.addColorStop(1, 'rgba(232, 167, 92, 0)')
      ctx.fillStyle = coreGrad
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2)
      ctx.fill()

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        filter: state === 'thinking' ? 'blur(0.5px)' : 'none',
        transition: 'filter 400ms ease'
      }}
    />
  )
}
