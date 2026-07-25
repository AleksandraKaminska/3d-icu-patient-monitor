import { useEffect, useState } from 'react'
import { useVitals, SCENARIOS } from '../../store/vitals.js'

/**
 * ControlPanel — right-hand clinical control panel (Tailwind).
 * Lets you pick a clinical scenario or manually set target vitals with
 * sliders. Everything writes to the Zustand store; the 3D scene reacts.
 */

function Slider({ label, unit, value, min, max, step = 1, color, onChange }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono tabular-nums" style={{ color }}>
          {value}
          <span className="ml-1 text-slate-500">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ color }}
        className="w-full"
      />
    </label>
  )
}

export default function ControlPanel() {
  const applyScenario = useVitals((s) => s.applyScenario)
  const setTarget = useVitals((s) => s.setTarget)
  const scenario = useVitals((s) => s.scenario)

  // Local mirror of the target so sliders feel responsive.
  const [t, setT] = useState(() => useVitals.getState().target)

  useEffect(() => {
    const unsub = useVitals.subscribe((s) => setT({ ...s.target }))
    return unsub
  }, [])

  const update = (patch) => {
    setT((prev) => ({ ...prev, ...patch }))
    setTarget(patch)
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-5 overflow-y-auto border-l border-slate-800 bg-slate-950 p-5">
      {/* Scenarios */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Clinical scenarios
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(SCENARIOS).map(([key, s]) => {
            const active = scenario === key
            return (
              <button
                key={key}
                onClick={() => applyScenario(key)}
                className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
                  active
                    ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
                    : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                {s.label}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] leading-snug text-slate-500">
          {scenario === 'custom'
            ? 'Manual mode — vitals set with the sliders.'
            : SCENARIOS[scenario]?.desc}
        </p>
      </section>

      {/* Manual controls */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Target vitals
        </h2>
        <Slider label="Heart rate (HR)" unit="bpm" value={Math.round(t.hr)} min={30} max={180} color="#22e08a" onChange={(v) => update({ hr: v })} />
        <Slider label="Saturation (SpO₂)" unit="%" value={Math.round(t.spo2)} min={60} max={100} color="#22d3ee" onChange={(v) => update({ spo2: v })} />
        <Slider label="Respiratory rate" unit="/min" value={Math.round(t.respRate)} min={5} max={40} color="#60a5fa" onChange={(v) => update({ respRate: v })} />
        <Slider label="Tidal volume (VT)" unit="ml" value={Math.round(t.tidalVolume)} min={200} max={700} step={10} color="#a78bfa" onChange={(v) => update({ tidalVolume: v })} />
        <Slider label="Mean art. pressure (MAP)" unit="mmHg" value={Math.round(t.map)} min={40} max={120} color="#f472b6" onChange={(v) => update({ map: v })} />
      </section>

      {/* Legend */}
      <section className="mt-auto rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-[11px] leading-relaxed text-slate-400">
        <p className="mb-1 font-semibold text-slate-300">Math in the scene</p>
        <ul className="list-inside list-disc space-y-1">
          <li>ECG: sum of Gaussian curves (P-QRS-T waves)</li>
          <li>SpO₂: plethysmograph wave from sine harmonics</li>
          <li>Skin: color interpolation by saturation (cyanosis)</li>
          <li>Ventilator: piston lerp by VT volume</li>
          <li>IV drip: drop fall from the gravity vector</li>
          <li>Tubes: CatmullRom splines in 3D</li>
        </ul>
      </section>
    </aside>
  )
}
