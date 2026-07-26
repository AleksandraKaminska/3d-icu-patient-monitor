import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import ScreenText from '@/components/scene/ScreenText'
import Trace from '@/components/scene/Trace'
import { capnoSample } from '@/lib/ecg'
import { simClock } from '@/store/simClock'
import { useVitals } from '@/store/vitals'
import type { TextMesh, Vec3 } from '@/types'

// Live airway-pressure + capnography screen with VT / RR / EtCO₂ readouts.
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
  const etco2Ref = useRef<TextMesh>(null)
  const acc = useRef(0)

  useFrame((_, delta) => {
    acc.current += delta
    if (acc.current < 1 / 6) return
    acc.current = 0
    const { current } = useVitals.getState()
    if (vtRef.current) vtRef.current.text = `${Math.round(current.tidalVolume)}`
    if (rrRef.current) rrRef.current.text = `${Math.round(current.respRate)}`
    if (etco2Ref.current) etco2Ref.current.text = `${Math.round(current.etco2)}`
  })

  const [w, h] = size

  return (
    <group position={pos} rotation={rot}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color="#061418" toneMapped={false} />
      </mesh>

      {/* Airway pressure (Paw) */}
      <Trace
        position={[0, h * 0.3, 0.004]}
        width={w * 0.8}
        height={h * 0.085}
        samples={180}
        rate={120}
        color="#38bdf8"
        screenColor="#061418"
        sampler={() => simClock.breath - 0.45}
      />
      <ScreenText
        position={[-w * 0.46, h * 0.4, 0.004]}
        fontSize={h * 0.08}
        color="#7dd3fc"
        anchorX="left"
      >
        Paw
      </ScreenText>

      {/* Capnography (EtCO₂ vs. time) */}
      <Trace
        position={[0, h * 0.07, 0.004]}
        width={w * 0.8}
        height={h * 0.085}
        samples={180}
        rate={120}
        color="#eab308"
        screenColor="#061418"
        sampler={() => capnoSample(simClock.respPhase, useVitals.getState().current.etco2) - 0.5}
      />
      <ScreenText
        position={[-w * 0.46, h * 0.17, 0.004]}
        fontSize={h * 0.08}
        color="#fde047"
        anchorX="left"
      >
        CO2
      </ScreenText>

      {/* Numeric readouts */}
      <ScreenText
        ref={vtRef}
        position={[-w * 0.44, -h * 0.2, 0.004]}
        fontSize={h * 0.15}
        color="#34d399"
        anchorX="left"
      >
        500
      </ScreenText>
      <ScreenText
        position={[-w * 0.44, -h * 0.36, 0.004]}
        fontSize={h * 0.07}
        color="#6ee7b7"
        anchorX="left"
      >
        VT ml
      </ScreenText>

      <ScreenText
        ref={rrRef}
        position={[-w * 0.06, -h * 0.2, 0.004]}
        fontSize={h * 0.15}
        color="#fbbf24"
        anchorX="left"
      >
        14
      </ScreenText>
      <ScreenText
        position={[-w * 0.06, -h * 0.36, 0.004]}
        fontSize={h * 0.07}
        color="#fcd34d"
        anchorX="left"
      >
        RR /min
      </ScreenText>

      <ScreenText
        ref={etco2Ref}
        position={[w * 0.28, -h * 0.2, 0.004]}
        fontSize={h * 0.15}
        color="#eab308"
        anchorX="left"
      >
        38
      </ScreenText>
      <ScreenText
        position={[w * 0.28, -h * 0.36, 0.004]}
        fontSize={h * 0.07}
        color="#fde047"
        anchorX="left"
      >
        EtCO2
      </ScreenText>
    </group>
  )
}
