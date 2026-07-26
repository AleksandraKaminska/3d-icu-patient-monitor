import { useEffect, useState } from 'react'
import { useVitals } from '@/store/vitals'

/**
 * VitalsBar - the live numeric vitals strip.
 *
 * Editorial premium look: each vital carries a small signature-colour dot and
 * a calm near-white value; the value only turns amber/red when it leaves the
 * safe range, so alarms read at a glance without visual noise.
 */
const RANGES = {
  hr: { low: 45, high: 120, warnLow: 55, warnHigh: 110 },
  spo2: { low: 90, high: 101, warnLow: 93, warnHigh: 101 },
  respRate: { low: 8, high: 26, warnLow: 10, warnHigh: 22 },
  map: { low: 62, high: 108, warnLow: 68, warnHigh: 100 },
}

type Range = { low: number; high: number; warnLow: number; warnHigh: number }
type Level = 'ok' | 'warn' | 'alarm'

function level(v: number, r?: Range): Level {
  if (!r) return 'ok'
  if (v < r.low || v > r.high) return 'alarm'
  if (v < r.warnLow || v > r.warnHigh) return 'warn'
  return 'ok'
}

const LEVEL_COLOR: Record<Level, string> = {
  ok: 'var(--text)',
  warn: 'var(--warn)',
  alarm: 'var(--alarm)',
}

function Vital({
  dot,
  label,
  value,
  unit,
  range,
  pulse,
}: {
  dot: string
  label: string
  value: number
  unit: string
  range?: Range
  pulse?: boolean
}) {
  const lvl = level(value, range)
  return (
    <div className="flex flex-col justify-center px-5 py-3 first:pl-6">
      <div className="mb-1 flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${pulse ? 'live-dot' : ''}`} style={{ background: dot }} />
        <span className="text-[10px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--faint)' }}>
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-mono text-[27px] font-semibold leading-none tabular-nums"
          style={{ color: LEVEL_COLOR[lvl] }}
        >
          {value}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--faint)' }}>{unit}</span>
      </div>
    </div>
  )
}

export default function VitalsBar() {
  const [v, setV] = useState(() => useVitals.getState().current)

  useEffect(() => {
    let last = 0
    const unsub = useVitals.subscribe((s) => {
      const now = performance.now()
      if (now - last > 250) {
        last = now
        setV({ ...s.current })
      }
    })
    return unsub
  }, [])

  return (
    <div
      className="flex flex-wrap items-stretch [&>*+*]:border-l [&>*+*]:border-[color:var(--line)]"
      style={{ background: 'var(--panel)', borderBottom: '1px solid var(--line)' }}
    >
      <Vital dot="#4ade80" label="Heart rate" value={Math.round(v.hr)} unit="bpm" range={RANGES.hr} pulse />
      <Vital dot="#38bdf8" label="SpO₂" value={Math.round(v.spo2)} unit="%" range={RANGES.spo2} />
      <Vital dot="#a5b4fc" label="Resp" value={Math.round(v.respRate)} unit="/min" range={RANGES.respRate} />
      <Vital dot="#c4b5fd" label="Tidal vol" value={Math.round(v.tidalVolume)} unit="ml" />
      <Vital dot="#f9a8d4" label="MAP" value={Math.round(v.map)} unit="mmHg" range={RANGES.map} />
    </div>
  )
}
