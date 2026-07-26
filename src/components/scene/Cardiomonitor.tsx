import { useMemo, useRef } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { useGLTF, Text } from '@react-three/drei'
import * as THREE from 'three'
import Trace from '@/components/scene/Trace'
import { simClock } from '@/store/simClock'
import { useVitals } from '@/store/vitals'
import { ecgSample, plethSample } from '@/lib/ecg'
import type { Vec3, TextMesh } from '@/types'

/**
 * Cardiomonitor - bedside monitor loaded from a GLB, with our live procedural
 * screen (ECG + SpO2 traces + HR/SpO2 digits) overlaid on the model's display.
 *
 * The model's screen sits on the "Monitor" block's front face, facing local
 * -Z. We auto-fit the model (scale to targetHeight, center X/Z, floor), then
 * place the screen overlay at the computed screen position and rotate it 180°
 * so it faces the same way as the model's display. The outer group carries the
 * scene placement (position/rotation).
 *
 * Asset: heart_monitor.glb.
 */

const MODEL_CENTER = [1.64, 18.19, 0.02]
const MODEL_MIN_Y = -18.65
const SCREEN_MODEL = [0, 46.85, -4.9] // screen center in model space

export default function Cardiomonitor({
  targetHeight = 1.7,
  screenSize = [0.4, 0.3],
  screenTrim = [0, 0, 0], // fine XYZ nudge of the overlay onto the glass
  ...props
}: {
  targetHeight?: number
  screenSize?: [number, number]
  screenTrim?: Vec3
} & ThreeElements['group']) {
  const { scene } = useGLTF('/models/heart_monitor.glb')
  const hrRef = useRef<TextMesh>(null)
  const spo2Ref = useRef<TextMesh>(null)
  const digitAcc = useRef(0)

  const { fitted, screenPos } = useMemo(() => {
    const o = scene.clone(true)
    const box0 = new THREE.Box3().setFromObject(o)
    const size0 = new THREE.Vector3()
    box0.getSize(size0)
    const s = targetHeight / size0.y
    o.scale.setScalar(s)
    const box1 = new THREE.Box3().setFromObject(o)
    const c = new THREE.Vector3()
    box1.getCenter(c)
    o.position.set(-c.x, -box1.min.y, -c.z)
    o.traverse((m) => {
      if (m instanceof THREE.Mesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    // Screen center in the outer-group frame: s * modelPoint + centeringOffset.
    const screenPos: Vec3 = [
      s * SCREEN_MODEL[0] - MODEL_CENTER[0] * s + screenTrim[0],
      s * SCREEN_MODEL[1] - MODEL_MIN_Y * s + screenTrim[1],
      s * SCREEN_MODEL[2] - MODEL_CENTER[2] * s + screenTrim[2],
    ]
    return { fitted: o, screenPos }
  }, [scene, targetHeight, screenTrim])

  useFrame((_, delta) => {
    digitAcc.current += delta
    if (digitAcc.current < 1 / 6) return
    digitAcc.current = 0
    const { current } = useVitals.getState()
    if (hrRef.current) hrRef.current.text = String(Math.round(current.hr))
    if (spo2Ref.current) spo2Ref.current.text = String(Math.round(current.spo2))
  })

  const [w, h] = screenSize

  return (
    <group {...props}>
      <primitive object={fitted} />

      {/* Live screen overlay - faces model-local -Z (hence the 180° flip) */}
      <group position={screenPos} rotation={[0, Math.PI, 0]}>
        {/* Dark display backing */}
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial color="#04120a" toneMapped={false} />
        </mesh>

        {/* ECG trace */}
        <Trace
          position={[-w * 0.02, h * 0.26, 0.006]}
          width={w * 0.86}
          height={h * 0.16}
          color="#22e08a"
          rate={180}
          samples={200}
          sampler={() => ecgSample(simClock.cardiacPhase, simClock.respPhase)}
        />
        <Text position={[-w * 0.44, h * 0.42, 0.006]} fontSize={h * 0.07} color="#22e08a" anchorX="left">
          II
        </Text>

        {/* SpO2 pleth trace */}
        <Trace
          position={[-w * 0.02, -h * 0.04, 0.006]}
          width={w * 0.86}
          height={h * 0.1}
          color="#22d3ee"
          rate={150}
          samples={200}
          sampler={() => plethSample(simClock.spo2Phase, useVitals.getState().current.spo2) - 0.4}
        />

        {/* HR digits */}
        <Text ref={hrRef} position={[w * 0.24, -h * 0.32, 0.006]} fontSize={h * 0.2} color="#22e08a" anchorX="left">
          74
        </Text>
        <Text position={[w * 0.24, -h * 0.16, 0.006]} fontSize={h * 0.06} color="#4ade80" anchorX="left">
          HR
        </Text>

        {/* SpO2 digits */}
        <Text ref={spo2Ref} position={[-w * 0.34, -h * 0.32, 0.006]} fontSize={h * 0.2} color="#22d3ee" anchorX="left">
          98
        </Text>
        <Text position={[-w * 0.34, -h * 0.16, 0.006]} fontSize={h * 0.06} color="#67e8f9" anchorX="left">
          SpO₂
        </Text>
      </group>
    </group>
  )
}

useGLTF.preload('/models/heart_monitor.glb')
