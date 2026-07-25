import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { simClock } from '../../store/simClock.js'
import { useVitals } from '../../store/vitals.js'

/**
 * Ventilator — the ventilator. A piston inside the bellows cylinder moves
 * with the breathing rhythm. The piston stroke equals the tidal volume (VT).
 * The position is interpolated linearly (lerp) between the exhale and
 * inhale positions.
 */
export default function Ventilator({ position = [0, 0, 0] }) {
  const piston = useRef()
  const bellows = useRef()
  const vtRef = useRef()
  const acc = useRef(0)

  useFrame((_, delta) => {
    const { current } = useVitals.getState()
    const vtNorm = THREE.MathUtils.clamp(current.tidalVolume / 600, 0.2, 1)
    const stroke = 0.28 * vtNorm

    // Lerp the piston position by breath phase (0 = exhale, 1 = full inhale).
    if (piston.current) {
      const lo = 1.02
      const hi = 1.02 + stroke
      piston.current.position.y = THREE.MathUtils.lerp(lo, hi, simClock.breath)
    }
    // The bellows expands accordingly (vertical scale).
    if (bellows.current) {
      bellows.current.scale.y = 0.6 + simClock.breath * vtNorm * 0.8
    }

    acc.current += delta
    if (acc.current > 1 / 6 && vtRef.current) {
      acc.current = 0
      vtRef.current.text = `${Math.round(current.tidalVolume)} ml`
    }
  })

  return (
    <group position={position}>
      {/* Ventilator cart */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.7, 1.0, 0.5]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Panel */}
      <mesh position={[0, 0.8, 0.26]}>
        <planeGeometry args={[0.5, 0.3]} />
        <meshBasicMaterial color="#082f2a" toneMapped={false} />
      </mesh>
      <Text ref={vtRef} position={[0, 0.8, 0.27]} fontSize={0.07} color="#34d399">
        500 ml
      </Text>
      <Text position={[0, 0.68, 0.27]} fontSize={0.035} color="#6ee7b7">
        VT (tidal volume)
      </Text>

      {/* Transparent bellows cylinder */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.5, 20, 1, true]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.18} roughness={0.1} side={THREE.DoubleSide} />
      </mesh>
      {/* Bellows (expands) */}
      <mesh ref={bellows} position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.3, 18]} />
        <meshStandardMaterial color="#60a5fa" transparent opacity={0.5} roughness={0.3} />
      </mesh>
      {/* Piston */}
      <mesh ref={piston} position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.04, 20]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Column / pole */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.6, 10]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}
