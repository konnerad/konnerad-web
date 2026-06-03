'use client'

import { useEffect, useRef } from 'react'

export default function ZoomOverlay({
  color,
  originX,
  originY,
  direction,
  onDone,
}: {
  color: string
  originX: number
  originY: number
  direction: 'in' | 'out'
  onDone: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const maxDist = Math.max(
      Math.hypot(originX, originY),
      Math.hypot(window.innerWidth - originX, originY),
      Math.hypot(originX, window.innerHeight - originY),
      Math.hypot(window.innerWidth - originX, window.innerHeight - originY),
    ) * 2.4
    const size = maxDist

    Object.assign(el.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${originX - size / 2}px`,
      top: `${originY - size / 2}px`,
      background: color,
      transform: direction === 'in' ? 'scale(0)' : 'scale(1)',
      transition: 'none',
    })

    // force reflow then animate
    el.getBoundingClientRect()
    el.style.transition = 'transform 0.32s cubic-bezier(0.4,0,0.8,1)'
    el.style.transform = direction === 'in' ? 'scale(1)' : 'scale(0)'

    const t1 = setTimeout(() => {
      onDone()
      el.style.transition = 'opacity 0.22s ease'
      el.style.opacity = '0'
    }, 310)

    return () => clearTimeout(t1)
  }, [color, originX, originY, direction, onDone])

  return (
    <div
      ref={ref}
      className="fixed rounded-full pointer-events-none"
      style={{ zIndex: 195 }}
    />
  )
}
