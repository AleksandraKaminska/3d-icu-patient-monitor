import { useEffect, useState } from 'react'
import { useVitals } from '../../store/vitals.js'
import { statusColor } from '../../lib/color.js'

/**
 * VitalsBar — top strip with the live numeric vital signs.
 *
 * The store commits `current` ~12×/s, but we throttle the UI to ~4×/s here
 * to keep the digits readable and avoid unnecessary re-renders.
 */
const RANGES = {
  hr: { low: 40, high: 130, warnLow: 55, warnHigh: 110 },
  spo2: { low: 88, high: 101, warnLow: 92, warnHigh: 101 },
  respRate: { low: 8, high: 28, warnLow: 10, warnHigh: 22 },
  map: { low: 60, high: 110, warnLow: 65, warnHigh: 100 },
}

function Tile({ label, value, unit, color, pulse }) {
  return (
    <div className="flex min-w-[92px] flex-col rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2">
      <span className="text-[11px] uppercase tracking-wide text-slate-500">{label}</span>
      <span
        className="font-mono text-2xl font-bold tabular-nums leading-tight"
        style={{ color, textShadow: `0 0 12px ${color}55` }}
      >
        {value}
        <span className="ml-1 text-xs font-normal text-slate-500">{unit}</span>
      </span>
      {pulse && (
        <span className="mt-0.5 h-0.5 w-full animate-pulse rounded-full" style={{ background: color }} />
      )}
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
    <div className="flex flex-wrap gap-3 border-b border-slate-800 bg-slate-950 px-5 py-3">
      <Tile label="HR" value={Math.round(v.hr)} unit="bpm" color={statusColor(v.hr, RANGES.hr)} pulse />
      <Tile label="SpO₂" value={Math.round(v.spo2)} unit="%" color={statusColor(v.spo2, RANGES.spo2)} />
      <Tile label="Resp" value={Math.round(v.respRate)} unit="/min" color={statusColor(v.respRate, RANGES.respRate)} />
      <Tile label="VT" value={Math.round(v.tidalVolume)} unit="ml" color="#a78bfa" />
      <Tile label="MAP" value={Math.round(v.map)} unit="mmHg" color={statusColor(v.map, RANGES.map)} />
    </div>
  )
}
