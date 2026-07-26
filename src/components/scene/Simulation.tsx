import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { simClock } from '@/store/simClock'
import { meanArterial, useVitals } from '@/store/vitals'

/**
 * Simulation - headless driver: eases vitals toward their targets, advances the
 * breath/drip phases, and commits `current` to the store a few times a second.
 */
export default function Simulation() {
  const commitAcc = useRef(0)

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)
    const { target, current, commitCurrent } = useVitals.getState()

    const k = 1 - Math.exp(-delta / 2) // lerp toward target, ~2 s time constant
    const next = {
      hr: THREE.MathUtils.lerp(current.hr, target.hr, k),
      spo2: THREE.MathUtils.lerp(current.spo2, target.spo2, k),
      respRate: THREE.MathUtils.lerp(current.respRate, target.respRate, k),
      tidalVolume: THREE.MathUtils.lerp(current.tidalVolume, target.tidalVolume, k),
      sys: THREE.MathUtils.lerp(current.sys, target.sys, k),
      dia: THREE.MathUtils.lerp(current.dia, target.dia, k),
      temp: THREE.MathUtils.lerp(current.temp, target.temp, k),
      etco2: THREE.MathUtils.lerp(current.etco2, target.etco2, k),
    }

    const respPeriod = 60 / Math.max(1, next.respRate)
    simClock.respPhase = (simClock.respPhase + (delta / respPeriod) * Math.PI * 2) % (Math.PI * 2)
    simClock.breath = (Math.sin(simClock.respPhase - Math.PI / 2) + 1) / 2

    // IV drip runs faster at lower MAP.
    const dripRate = 0.6 + (90 - meanArterial(next.sys, next.dia)) * 0.02
    simClock.dripT = (simClock.dripT + delta * dripRate) % 1

    commitAcc.current += delta
    if (commitAcc.current >= 1 / 12) {
      commitAcc.current = 0
      commitCurrent(next)
    }
  })

  return null
}
