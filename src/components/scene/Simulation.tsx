import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { beatPeriod } from '@/lib/ecg'
import { simClock } from '@/store/simClock'
import { useVitals } from '@/store/vitals'

/**
 * Simulation - the heart of the simulation (no visual element).
 *
 * Every frame it:
 *  1. Smoothly eases current values toward the targets - lerp.
 *  2. Advances the heart / breath / drip phases based on HR and resp rate.
 *  3. Periodically commits `current` to the store so the UI updates its digits.
 */
export default function Simulation() {
  const commitAcc = { t: 0 }

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05) // stability during FPS drops
    const { target, current, commitCurrent } = useVitals.getState()

    // 1. Lerp the vitals toward the target (time constant ~2 s).
    const k = 1 - Math.exp(-delta / 2)
    const next = {
      hr: THREE.MathUtils.lerp(current.hr, target.hr, k),
      spo2: THREE.MathUtils.lerp(current.spo2, target.spo2, k),
      respRate: THREE.MathUtils.lerp(current.respRate, target.respRate, k),
      tidalVolume: THREE.MathUtils.lerp(current.tidalVolume, target.tidalVolume, k),
      map: THREE.MathUtils.lerp(current.map, target.map, k),
    }

    // 2. Advance phases. Cardiac phase grows by delta / beat_period.
    const period = beatPeriod(next.hr)
    simClock.cardiacPhase = (simClock.cardiacPhase + delta / period) % 1
    simClock.spo2Phase = simClock.cardiacPhase // pulse wave synced to the heart

    // Breathing: respRate breaths/min -> period in seconds.
    const respPeriod = 60 / Math.max(1, next.respRate)
    simClock.respPhase = (simClock.respPhase + (delta / respPeriod) * Math.PI * 2) % (Math.PI * 2)
    // Inhale/exhale as a normalized sine (0..1) - drives chest and piston motion.
    simClock.breath = (Math.sin(simClock.respPhase - Math.PI / 2) + 1) / 2

    // IV drop: rate depends on MAP (pressure) - faster when lower.
    const dripRate = 0.6 + (90 - next.map) * 0.02
    simClock.dripT = (simClock.dripT + delta * dripRate) % 1

    // 3. Commit to the store ~12 times/s (smooth enough for digits, cheap for React).
    commitAcc.t += delta
    if (commitAcc.t >= 1 / 12) {
      commitAcc.t = 0
      commitCurrent(next)
    }
  })

  return null
}
