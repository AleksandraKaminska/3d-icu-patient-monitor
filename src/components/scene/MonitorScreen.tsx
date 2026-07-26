import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import ScreenText from '@/components/scene/ScreenText'
import Trace from '@/components/scene/Trace'
import { BeatClock } from '@/lib/beatClock'
import { plethSample, RHYTHMS } from '@/lib/ecg'
import { simClock } from '@/store/simClock'
import { useVitals } from '@/store/vitals'
import type { TextMesh, Vec3 } from '@/types'

const ECG_RATE = 120

// Live ECG + SpO2 screen for the cardiomonitor.
export default function MonitorScreen({
  pos = [0, 0, 0],
  rot = [0, 0, 0],
  size = [0.4, 0.3],
}: {
  pos?: Vec3
  rot?: Vec3
  size?: [number, number]
}) {
  const hrRef = useRef<TextMesh>(null)
  const spo2Ref = useRef<TextMesh>(null)
  const acc = useRef(0)

  // One cardiac clock drives the ECG; the pleth reads its phase to stay in step.
  const heart = useRef(new BeatClock(useVitals.getState().current.hr))

  useFrame((_, delta) => {
    acc.current += delta
    if (acc.current < 1 / 6) return
    acc.current = 0
    const { current } = useVitals.getState()
    if (hrRef.current) hrRef.current.text = String(Math.round(current.hr))
    if (spo2Ref.current) spo2Ref.current.text = String(Math.round(current.spo2))
  })

  const [w, h] = size

  return (
    <group position={pos} rotation={rot}>
      <mesh position={[0, 0, 0.002]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color="#04120a" toneMapped={false} />
      </mesh>

      <Trace
        position={[-w * 0.02, h * 0.26, 0.006]}
        width={w * 0.86}
        height={h * 0.16}
        color="#22e08a"
        rate={ECG_RATE}
        samples={480}
        sampler={() => {
          const { current, rhythm } = useVitals.getState()
          heart.current.advance(1 / ECG_RATE, current.hr, rhythm)
          return heart.current.ecg(rhythm, simClock.respPhase)
        }}
      />
      <ScreenText
        position={[-w * 0.44, h * 0.42, 0.006]}
        fontSize={h * 0.07}
        color="#22e08a"
        anchorX="left"
      >
        II
      </ScreenText>

      <Trace
        position={[-w * 0.02, -h * 0.04, 0.006]}
        width={w * 0.86}
        height={h * 0.1}
        color="#22d3ee"
        rate={90}
        samples={360}
        sampler={() => {
          const { current, rhythm } = useVitals.getState()
          // A non-perfusing rhythm (VF/asystole) has no pulse -> flat pleth.
          if (!RHYTHMS[rhythm].perfusing) return -0.4
          return plethSample(heart.current.beatPhase, current.spo2) - 0.4
        }}
      />

      <ScreenText
        ref={hrRef}
        position={[w * 0.24, -h * 0.32, 0.006]}
        fontSize={h * 0.2}
        color="#22e08a"
        anchorX="left"
      >
        74
      </ScreenText>
      <ScreenText
        position={[w * 0.24, -h * 0.16, 0.006]}
        fontSize={h * 0.06}
        color="#4ade80"
        anchorX="left"
      >
        HR
      </ScreenText>

      <ScreenText
        ref={spo2Ref}
        position={[-w * 0.34, -h * 0.32, 0.006]}
        fontSize={h * 0.2}
        color="#22d3ee"
        anchorX="left"
      >
        98
      </ScreenText>
      <ScreenText
        position={[-w * 0.34, -h * 0.16, 0.006]}
        fontSize={h * 0.06}
        color="#67e8f9"
        anchorX="left"
      >
        SpO2
      </ScreenText>
    </group>
  )
}
