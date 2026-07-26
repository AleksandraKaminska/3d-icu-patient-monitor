import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Vec3 } from '@/types'

/**
 * Trace - a one-dimensional curve drawn in 3D using a "sweeping cursor"
 * method (like a real cardiomonitor).
 *
 * Instead of shifting the whole point array every frame, we keep a fixed
 * position buffer and overwrite the Y value under the current cursor, which
 * moves to the right at a constant sampling rate. Just ahead of the cursor
 * we leave a "blanked" gap, producing the freshly-drawn line effect.
 */
export default function Trace({
  sampler,
  width = 1.6,
  height = 0.5,
  samples = 260,
  rate = 170,
  color = '#22e08a',
  position = [0, 0, 0],
}: {
  sampler: () => number
  width?: number
  height?: number
  samples?: number
  rate?: number
  color?: string
  position?: Vec3
}) {
  const cursor = useRef(0)
  const acc = useRef(0)

  // Build the line object once (geometry buffer + material). The geometry is
  // mutated in place each frame; rendering it via <primitive> sidesteps the
  // `line` intrinsic clashing with SVG's <line> in TSX.
  const { line, positions, geometry } = useMemo(() => {
    const positions = new Float32Array(samples * 3)
    for (let i = 0; i < samples; i++) {
      positions[i * 3] = -width / 2 + (i / (samples - 1)) * width
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.LineBasicMaterial({ color, toneMapped: false })
    const line = new THREE.Line(geometry, material)
    return { line, positions, geometry }
  }, [samples, width, color])

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)
    acc.current += delta
    const step = 1 / rate
    let guard = 0
    while (acc.current >= step && guard < 64) {
      acc.current -= step
      guard++
      const y = THREE.MathUtils.clamp(sampler() * height, -height, height)
      const i = cursor.current
      positions[i * 3 + 1] = y
      // Blank a few samples ahead of the cursor (drawing gap).
      for (let g = 1; g <= 4; g++) {
        const j = (i + g) % samples
        positions[j * 3 + 1] = 0
      }
      cursor.current = (i + 1) % samples
    }
    geometry.attributes.position.needsUpdate = true
  })

  return <primitive object={line} position={position} />
}
