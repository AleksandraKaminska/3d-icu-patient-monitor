import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Text } from '@react-three/drei'
import Trace from './Trace.jsx'
import { simClock } from '../../store/simClock.js'
import { useVitals } from '../../store/vitals.js'

/**
 * Ventilator — a modern ICU ventilator on a wheeled stand.
 *
 * A clean electronics unit: a screen with a live airway-pressure waveform
 * (driven by the breath phase) plus VT / respiratory-rate readouts, control
 * knobs, and a breathing-circuit outlet where the intubation tube connects.
 * The breathing itself is conveyed by the on-screen waveform (VT math intact).
 */
export default function Ventilator({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const vtRef = useRef()
  const rrRef = useRef()
  const acc = useRef(0)

  useFrame((_, delta) => {
    acc.current += delta
    if (acc.current < 1 / 6) return
    acc.current = 0
    const { current } = useVitals.getState()
    if (vtRef.current) vtRef.current.text = `${Math.round(current.tidalVolume)}`
    if (rrRef.current) rrRef.current.text = `${Math.round(current.respRate)}`
  })

  return (
    <group position={position} rotation={rotation}>
      {/* Wheeled base */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.33, 0.36, 0.05, 24]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.5} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.3, 0.03, Math.sin(a) * 0.3]}>
            <sphereGeometry args={[0.04, 10, 10]} />
            <meshStandardMaterial color="#0f172a" roughness={0.6} />
          </mesh>
        )
      })}

      {/* Pole */}
      <mesh position={[0, 0.78, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.032, 1.5, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Main housing */}
      <RoundedBox args={[0.6, 0.62, 0.34]} radius={0.04} smoothness={4} position={[0, 1.5, 0]} castShadow>
        <meshStandardMaterial color="#e2e6ec" metalness={0.2} roughness={0.55} />
      </RoundedBox>

      {/* Screen */}
      <mesh position={[0, 1.6, 0.172]}>
        <planeGeometry args={[0.5, 0.34]} />
        <meshBasicMaterial color="#061418" toneMapped={false} />
      </mesh>

      {/* Live airway-pressure waveform */}
      <Trace
        position={[0, 1.68, 0.174]}
        width={0.46}
        height={0.06}
        samples={200}
        rate={120}
        color="#38bdf8"
        sampler={() => simClock.breath - 0.45}
      />
      <Text position={[-0.23, 1.73, 0.174]} fontSize={0.024} color="#7dd3fc" anchorX="left">
        Paw
      </Text>

      {/* Readouts */}
      <Text ref={vtRef} position={[-0.2, 1.55, 0.174]} fontSize={0.06} color="#34d399" anchorX="left">
        500
      </Text>
      <Text position={[-0.2, 1.51, 0.174]} fontSize={0.022} color="#6ee7b7" anchorX="left">
        VT ml
      </Text>
      <Text ref={rrRef} position={[0.07, 1.55, 0.174]} fontSize={0.06} color="#fbbf24" anchorX="left">
        14
      </Text>
      <Text position={[0.07, 1.51, 0.174]} fontSize={0.022} color="#fcd34d" anchorX="left">
        RR /min
      </Text>

      {/* Knobs + power light */}
      {[-0.18, -0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 1.33, 0.172]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 20]} />
          <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0.2, 1.33, 0.173]}>
        <circleGeometry args={[0.014, 16]} />
        <meshBasicMaterial color="#22c55e" toneMapped={false} />
      </mesh>

      {/* Breathing-circuit outlet (elbow) — the intubation tube connects here */}
      <mesh position={[0.28, 1.28, 0.05]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.028, 0.028, 0.1, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0.33, 1.28, 0.05]}>
        <cylinderGeometry args={[0.024, 0.024, 0.05, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}
