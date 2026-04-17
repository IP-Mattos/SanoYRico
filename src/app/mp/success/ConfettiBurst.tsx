'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

// Explosión de confetti que dispara una vez al montarse.
// Respeta `prefers-reduced-motion` para usuarios que pidieron menos animación.
export function ConfettiBurst() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const colors = ['#c47c2b', '#3d2b1f', '#4a6741', '#fef3d0', '#8a5a1a']
    const end = Date.now() + 1200

    // Dos ráfagas laterales, duración ~1.2s, sin loop infinito
    const tick = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        startVelocity: 55,
        origin: { x: 0, y: 0.7 },
        colors,
        scalar: 0.9
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        startVelocity: 55,
        origin: { x: 1, y: 0.7 },
        colors,
        scalar: 0.9
      })
      if (Date.now() < end) requestAnimationFrame(tick)
    }
    tick()
  }, [])

  return null
}
