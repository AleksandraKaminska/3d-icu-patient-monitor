import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Vec3 } from '@/types'

/**
 * Trace - a sweep-mode monitor trace. Points sit at fixed X; a write cursor
 * moves left->right overwriting the Y under it, with a short blanked gap ahead
 * (painted in the screen colour) acting as the erase bar. The caller's sampler
 * is polled once per emitted sample, so waves stay anchored instead of scrolling.
 */
const GAP = 5 // samples blanked ahead of the cursor (the erase bar)

export default function Trace({
  sampler,
  width = 1.6,
  height = 0.5,
  samples = 260,
  rate = 170,
  color = '#22e08a',
  screenColor = '#04120a',
  position = [0, 0, 0],
}: {
  sampler: () => number
  width?: number
  height?: number
  samples?: number
  rate?: number
  color?: string
  screenColor?: string
  position?: Vec3
}) {
  const cursor = useRef(0)
  const acc = useRef(0)
  const bar = useRef<THREE.Mesh>(null)

  const x = (i: number) => -width / 2 + (i / (samples - 1)) * width

  // Line object built once; its geometry buffer is mutated in place each frame.
  // <primitive> avoids the `line` intrinsic clashing with SVG's <line> in TSX.
  const { line, positions, geometry } = useMemo(() => {
    const positions = new Float32Array(samples * 3)
    for (let i = 0; i < samples; i++) positions[i * 3] = -width / 2 + (i / (samples - 1)) * width
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, toneMapped: false }))
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
      const i = cursor.current
      positions[i * 3 + 1] = THREE.MathUtils.clamp(sampler() * height, -height, height)
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
