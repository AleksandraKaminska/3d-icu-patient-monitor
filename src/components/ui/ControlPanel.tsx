import { type ReactNode, useEffect, useState } from 'react'
import { RHYTHMS, type Rhythm } from '@/lib/ecg'
import { SCENARIOS, useVitals, type Vitals } from '@/store/vitals'

/**
 * ControlPanel - clinical/editorial control panel.
 * Pick a scenario or set target vitals with sliders; everything writes to the
 * Zustand store and the 3D scene reacts.
 */

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="text-[10px] font-semibold uppercase tracking-[0.18em]"
      style={{ color: 'var(--faint)' }}
    >
      {children}
    </h2>
  )
}

function Slider({
  label,
  unit,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string
  unit: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <label className="block">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
          {label}
        </span>
        <span className="font-mono text-[13px] tabular-nums" style={{ color: 'var(--text)' }}>
          {value}
          <span className="ml-1" style={{ color: 'var(--faint)' }}>
            {unit}
          </span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
        }}
      />
    </label>
  )
}

const RHYTHM_ORDER: Rhythm[] = ['sinus', 'af', 'aflutter', 'pvc', 'vt', 'vf', 'asystole', 'stemi']

export default function ControlPanel() {
  const applyScenario = useVitals((s) => s.applyScenario)
  const setTarget = useVitals((s) => s.setTarget)
  const scenario = useVitals((s) => s.scenario)
  const rhythm = useVitals((s) => s.rhythm)
  const setRhythm = useVitals((s) => s.setRhythm)
  const [t, setT] = useState(() => useVitals.getState().target)

  useEffect(() => {
    const unsub = useVitals.subscribe((s) => setT({ ...s.target }))
    return unsub
  }, [])

  const update = (patch: Partial<Vitals>) => {
    setT((prev) => ({ ...prev, ...patch }))
    setTarget(patch)
  }

  return (
    <aside
      className="flex w-[336px] shrink-0 flex-col gap-7 overflow-y-auto px-6 pb-6 pt-4"
      style={{
        background: 'var(--panel)',
        borderLeft: '1px solid var(--line)',
        boxShadow: '-1px 0 3px rgba(15,23,42,0.05)',
      }}
    >
      {/* Scenarios */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Clinical scenario</SectionTitle>
        <div className="flex flex-col gap-1.5">
          {Object.entries(SCENARIOS).map(([key, s]) => {
            const active = scenario === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyScenario(key)}
                className="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition"
                style={{
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(53,208,186,0.35)' : 'var(--line)'}`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full transition"
                  style={{ background: active ? 'var(--accent)' : 'var(--faint)' }}
                />
                <span
                  className="text-[13px] font-medium"
                  style={{ color: active ? 'var(--text)' : 'var(--muted)' }}
                >
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--faint)' }}>
          {scenario === 'custom'
            ? 'Manual mode - vitals set with the sliders below.'
            : SCENARIOS[scenario]?.desc}
        </p>
      </section>

      {/* ECG rhythm */}
      <section className="flex flex-col gap-3">
        <SectionTitle>ECG rhythm</SectionTitle>
        <div className="flex flex-col gap-1.5">
          {RHYTHM_ORDER.map((key) => {
            const active = rhythm === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setRhythm(key)}
                className="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition"
                style={{
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(53,208,186,0.35)' : 'var(--line)'}`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full transition"
                  style={{ background: active ? 'var(--accent)' : 'var(--faint)' }}
                />
                <span
                  className="text-[13px] font-medium"
                  style={{ color: active ? 'var(--text)' : 'var(--muted)' }}
                >
                  {RHYTHMS[key].label}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <div style={{ height: 1, background: 'var(--line)' }} />

      {/* Manual controls */}
      <section className="flex flex-col gap-5">
        <SectionTitle>Target vitals</SectionTitle>
        <Slider
          label="Heart rate"
          unit="bpm"
          value={Math.round(t.hr)}
          min={30}
          max={180}
          onChange={(v) => update({ hr: v })}
        />
        <Slider
          label="Saturation"
          unit="%"
          value={Math.round(t.spo2)}
          min={60}
          max={100}
          onChange={(v) => update({ spo2: v })}
        />
        <Slider
          label="Respiratory rate"
          unit="/min"
          value={Math.round(t.respRate)}
          min={5}
          max={40}
          onChange={(v) => update({ respRate: v })}
        />
        <Slider
          label="Tidal volume"
          unit="ml"
          value={Math.round(t.tidalVolume)}
          min={200}
          max={700}
          step={10}
          onChange={(v) => update({ tidalVolume: v })}
        />
        <Slider
          label="Systolic pressure"
          unit="mmHg"
          value={Math.round(t.sys)}
          min={70}
          max={200}
          onChange={(v) => update({ sys: v })}
        />
        <Slider
          label="Diastolic pressure"
          unit="mmHg"
          value={Math.round(t.dia)}
          min={40}
          max={120}
          onChange={(v) => update({ dia: v })}
        />
        <Slider
          label="Temperature"
          unit="°C"
          value={Number(t.temp.toFixed(1))}
          min={34}
          max={41}
          step={0.1}
          onChange={(v) => update({ temp: v })}
        />
        <Slider
          label="EtCO₂"
          unit="mmHg"
          value={Math.round(t.etco2)}
          min={20}
          max={70}
          onChange={(v) => update({ etco2: v })}
        />
      </section>
    </aside>
  )
}
