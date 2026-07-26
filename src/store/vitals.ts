import { create } from 'zustand'

/**
 * vitals - Global state of the patient's vital signs.
 *
 * We keep "target" values set by the operator or a clinical scenario.
 * Each frame the Simulation component eases (lerps) the current values
 * toward the targets, so changes are smooth.
 */

export type Vitals = {
  hr: number
  spo2: number
  respRate: number
  tidalVolume: number
  map: number
}

type Scenario = Vitals & { label: string; desc: string }

export const SCENARIOS: Record<string, Scenario> = {
  stable: {
    label: 'Stable',
    desc: 'Patient within normal range, vitals stable.',
    hr: 74,
    spo2: 98,
    respRate: 14,
    tidalVolume: 500,
    map: 88,
  },
  desaturation: {
    label: 'Desaturation',
    desc: 'Progressive hypoxia - SpO₂ dropping, compensatory tachycardia.',
    hr: 118,
    spo2: 79,
    respRate: 26,
    tidalVolume: 380,
    map: 72,
  },
  tachycardia: {
    label: 'Tachycardia',
    desc: 'Accelerated heart rate (HR 145) - the ECG curve compresses.',
    hr: 145,
    spo2: 94,
    respRate: 22,
    tidalVolume: 460,
    map: 68,
  },
  bradycardia: {
    label: 'Bradycardia',
    desc: 'Slowed heart rate (HR 44) - the waves stretch out.',
    hr: 44,
    spo2: 95,
    respRate: 10,
    tidalVolume: 520,
    map: 62,
  },
}

const base = (s: Scenario): Vitals => ({
  hr: s.hr,
  spo2: s.spo2,
  respRate: s.respRate,
  tidalVolume: s.tidalVolume,
  map: s.map,
})

export type VitalsState = {
  target: Vitals
  current: Vitals
  scenario: string
  alarmsMuted: boolean
  setTarget: (patch: Partial<Vitals>) => void
  applyScenario: (key: string) => void
  toggleMute: () => void
  commitCurrent: (next: Partial<Vitals>) => void
}

export const useVitals = create<VitalsState>((set) => ({
  // Target values (driven by sliders / scenario)
  target: base(SCENARIOS.stable),
  // Current values (ease toward target - updated in useFrame)
  current: base(SCENARIOS.stable),
  scenario: 'stable',
  alarmsMuted: false,

  setTarget: (patch) =>
    set((s) => ({ target: { ...s.target, ...patch }, scenario: 'custom' })),

  applyScenario: (key) =>
    set(() => ({ scenario: key, target: base(SCENARIOS[key]) })),

  toggleMute: () => set((s) => ({ alarmsMuted: !s.alarmsMuted })),

  // Update current values (called from the render loop, no React re-render)
  commitCurrent: (next) => set((s) => ({ current: { ...s.current, ...next } })),
}))
