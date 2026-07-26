import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import Trace from '@/components/scene/Trace'
import { simClock } from '@/store/simClock'
import { useVitals } from '@/store/vitals'
import type { Vec3, TextMesh } from '@/types'

/**
 * VentScreen - the ventilator's live screen (airway-pressure waveform + VT/RR
 * readouts), placed in world space so it can be aligned onto the model's
 * painted screen directly with `pos` / `rot` (intuitive world coordinates).
 */
export default function VentScreen({
  pos = [0, 0, 0],
  rot = [0, 0, 0],
  size = [0.34, 0.24],
}: {
  pos?: Vec3
  rot?: Vec3
  size?: [number, number]
}) {
  const vtRef = useRef<TextMesh>(null)
  const rrRef = useRef<TextMesh>(null)
  const acc = useRef(0)

  useFrame((_, delta) => {
    acc.current += delta
    if (acc.current < 1 / 6) return
    acc.current = 0
    const { current } = useVitals.getState()
    if (vtRef.current) vtRef.current.text = `${Math.round(current.tidalVolume)}`
    if (rrRef.current) rrRef.current.text = `${Math.round(current.respRate)}`
  })

  const [w, h] = size

  return (
    <group position={pos} rotation={rot}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color="#061418" toneMapped={false} />
      </mesh>
      <Trace
        position={[0, h * 0.14, 0.004]}
        width={w * 0.86}
        height={h * 0.14}
        samples={180}
        rate={120}
        color="#38bdf8"
        sampler={() => simClock.breath - 0.45}
      />
      <Text position={[-w * 0.4, h * 0.36, 0.004]} fontSize={h * 0.09} color="#7dd3fc" anchorX="left">
        Paw
      </Text>
      <Text ref={vtRef} position={[-w * 0.36, -h * 0.16, 0.004]} fontSize={h * 0.22} color="#34d399" anchorX="left">
        500
      </Text>
      <Text position={[-w * 0.36, -h * 0.34, 0.004]} fontSize={h * 0.08} color="#6ee7b7" anchorX="left">
        VT ml
      </Text>
      <Text ref={rrRef} position={[w * 0.08, -h * 0.16, 0.004]} fontSize={h * 0.22} color="#fbbf24" anchorX="left">
        14
      </Text>
      <Text position={[w * 0.08, -h * 0.34, 0.004]} fontSize={h * 0.08} color="#fcd34d" anchorX="left">
        RR /min
      </Text>
    </group>
  )
}
