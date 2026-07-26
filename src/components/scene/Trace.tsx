import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Vec3 } from '@/types'

/**
 * Trace - a sweep-mode monitor trace (like a bedside cardiomonitor).
 *
 * Points sit at fixed X. A write cursor moves left->right at a constant rate,
 * overwriting the Y under it; a short blanked gap just ahead of the cursor is
 * the erase bar (drawn as a faint moving highlight), so a fresh trace appears
 * behind it while the previous sweep stays ahead until overwritten. The waves
 * stay anchored to the screen instead of scrolling.
 */
const GAP = 5 // samples blanked ahead of the cursor (the erase bar)

export default function Trace({
  sampler,
  phaseRate,
  width = 1.6,
  height = 0.5,
  samples = 260,
  rate = 170,
  color = '#22e08a',
  screenColor = '#04120a',
  position = [0, 0, 0],
}: {
  sampler: (phase: number) => number
  // Cycles per second (e.g. HR/60). When set, a 0..1 cycle phase is integrated
  // per sample and passed to the sampler, so narrow features (QRS) can't alias
  // to the frame rate. Omit for signals with no beat phase (e.g. airway wave).
  phaseRate?: () => number
  width?: number
  height?: number
  samples?: number
  rate?: number
  color?: string
  // Screen background colour - the erase bar is painted in it so it blanks the
  // old trace ahead of the cursor, like a real monitor's sweep gap.
  screenColor?: string
  position?: Vec3
}) {
  const cursor = useRef(0)
  const acc = useRef(0)
  const phase = useRef(0)
  const bar = useRef<THREE.Mesh>(null)

  const x = (i: number) => -width / 2 + (i / (samples - 1)) * width

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
    while (acc.current >= step && guard < 128) {
      acc.current -= step
      guard++
      if (phaseRate) phase.current = (phase.current + phaseRate() * step) % 1
      const i = cursor.current
      positions[i * 3 + 1] = THREE.MathUtils.clamp(sampler(phase.current) * height, -height, height)
      for (let g = 1; g <= GAP; g++) positions[((i + g) % samples) * 3 + 1] = 0
      cursor.current = (i + 1) % samples
    }
    geometry.attributes.position.needsUpdate = true
    if (bar.current) bar.current.position.x = x((cursor.current + GAP / 2) % samples)
  })

  return (
    <group position={position}>
      <primitive object={line} />
      <mesh ref={bar} position={[0, 0, 0.001]}>
        <planeGeometry args={[width * 0.02, height * 2.2]} />
        <meshBasicMaterial color={screenColor} toneMapped={false} />
      </mesh>
    </group>
  )
}
