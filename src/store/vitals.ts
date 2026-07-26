import { create } from 'zustand'
import type { Rhythm } from '@/lib/ecg'

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
  sys: number // systolic pressure (mmHg)
  dia: number // diastolic pressure (mmHg)
  temp: number // body temperature (°C)
  etco2: number // end-tidal CO₂ (mmHg)
}

// Mean arterial pressure - derived, not set directly: MAP ≈ DIA + (SYS - DIA)/3.
export function meanArterial(sys: number, dia: number): number {
  return dia + (sys - dia) / 3
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
    sys: 118,
    dia: 73,
    temp: 36.8,
    etco2: 38,
  },
  desaturation: {
    label: 'Desaturation',
    desc: 'Progressive hypoxia - SpO₂ dropping, compensatory tachycardia.',
    hr: 118,
    spo2: 79,
    respRate: 26,
    tidalVolume: 380,
    sys: 100,
    dia: 58,
    temp: 37.4,
    etco2: 30,
  },
  tachycardia: {
    label: 'Tachycardia',
    desc: 'Accelerated heart rate (HR 145) - the ECG curve compresses.',
    hr: 145,
    spo2: 94,
    respRate: 22,
    tidalVolume: 460,
    sys: 98,
    dia: 53,
    temp: 38.4,
    etco2: 41,
  },
  bradycardia: {
    label: 'Bradycardia',
    desc: 'Slowed heart rate (HR 44) - the waves stretch out.',
    hr: 44,
    spo2: 95,
    respRate: 10,
    tidalVolume: 520,
    sys: 90,
    dia: 48,
    temp: 35.9,
    etco2: 48,
  },
}

const base = (s: Scenario): Vitals => ({
  hr: s.hr,
  spo2: s.spo2,
  respRate: s.respRate,
  tidalVolume: s.tidalVolume,
  sys: s.sys,
  dia: s.dia,
  temp: s.temp,
  etco2: s.etco2,
})

export type VitalsState = {
  target: Vitals
  current: Vitals
  scenario: string
  rhythm: Rhythm
  alarmsMuted: boolean
  setTarget: (patch: Partial<Vitals>) => void
  applyScenario: (key: string) => void
  setRhythm: (r: Rhythm) => void
  toggleMute: () => void
  commitCurrent: (next: Partial<Vitals>) => void
}

export const useVitals = create<VitalsState>((set) => ({
  // Target values (driven by sliders / scenario)
  target: base(SCENARIOS.stable),
  // Current values (ease toward target - updated in useFrame)
  current: base(SCENARIOS.stable),
  scenario: 'stable',
  rhythm: 'sinus',
  alarmsMuted: false,

  setTarget: (patch) => set((s) => ({ target: { ...s.target, ...patch }, scenario: 'custom' })),

  // Clinical scenarios are all sinus rhythms - reset rhythm on apply.
  applyScenario: (key) =>
    set(() => ({ scenario: key, target: base(SCENARIOS[key]), rhythm: 'sinus' })),

  // Switching rhythm nudges HR to a typical rate for that rhythm.
  setRhythm: (r) =>
    set((s) => {
      const target = { ...s.target }
      if (r === 'vt') target.hr = 180
      else if (r === 'af') target.hr = 130
      return { rhythm: r, target, scenario: r === 'sinus' ? s.scenario : 'custom' }
    }),

  toggleMute: () => set((s) => ({ alarmsMuted: !s.alarmsMuted })),

  // Update current values (called from the render loop, no React re-render)
  commitCurrent: (next) => set((s) => ({ current: { ...s.current, ...next } })),
}))
