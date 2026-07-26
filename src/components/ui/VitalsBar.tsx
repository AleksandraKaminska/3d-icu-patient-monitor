import { useEffect, useState } from 'react'
import { meanArterial, useVitals } from '@/store/vitals'

/**
 * VitalsBar - the live numeric vitals strip.
 *
 * Each vital shows a calm label and value; the value only turns amber/red when
 * it leaves the safe range, so alarms read at a glance without visual noise.
 */
const RANGES = {
  hr: { low: 45, high: 120, warnLow: 55, warnHigh: 110 },
  spo2: { low: 90, high: 101, warnLow: 93, warnHigh: 101 },
  respRate: { low: 8, high: 26, warnLow: 10, warnHigh: 22 },
  etco2: { low: 30, high: 55, warnLow: 34, warnHigh: 46 },
  temp: { low: 35, high: 38.5, warnLow: 36, warnHigh: 37.8 },
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

function Label({ children }: { children: string }) {
  return (
    <span
      className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
      style={{ color: 'var(--muted)' }}
    >
      {children}
    </span>
  )
}

function Vital({
  label,
  value,
  display,
  unit,
  range,
}: {
  label: string
  value: number
  display?: string // formatted text (e.g. one decimal); falls back to value
  unit: string
  range?: Range
}) {
  const lvl = level(value, range)
  return (
    <div className="flex flex-col justify-center px-5 py-3 first:pl-6">
      <Label>{label}</Label>
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-mono text-[27px] font-semibold leading-none tabular-nums"
          style={{ color: LEVEL_COLOR[lvl] }}
        >
          {display ?? value}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--faint)' }}>
          {unit}
        </span>
      </div>
    </div>
  )
}

// Arterial pressure: shown as systolic/diastolic with the derived MAP, like a
// real monitor. The value colour follows the MAP (perfusion) alarm level.
function BpVital({ sys, dia, range }: { sys: number; dia: number; range?: Range }) {
  const map = Math.round(meanArterial(sys, dia))
  const lvl = level(map, range)
  return (
    <div className="flex flex-col justify-center px-5 py-3">
      <Label>Art. pressure</Label>
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-mono text-[27px] font-semibold leading-none tabular-nums"
          style={{ color: LEVEL_COLOR[lvl] }}
        >
          {Math.round(sys)}/{Math.round(dia)}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--faint)' }}>
          mmHg ({map})
        </span>
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
      style={{
        background: 'var(--panel)',
        borderBottom: '1px solid var(--line)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <Vital label="Heart rate" value={Math.round(v.hr)} unit="bpm" range={RANGES.hr} />
      <Vital label="SpO₂" value={Math.round(v.spo2)} unit="%" range={RANGES.spo2} />
      <Vital label="Resp" value={Math.round(v.respRate)} unit="/min" range={RANGES.respRate} />
      <Vital label="EtCO₂" value={Math.round(v.etco2)} unit="mmHg" range={RANGES.etco2} />
      <Vital
        label="Temp"
        value={v.temp}
        display={v.temp.toFixed(1)}
        unit="°C"
        range={RANGES.temp}
      />
      <BpVital sys={v.sys} dia={v.dia} range={RANGES.map} />
    </div>
  )
}
