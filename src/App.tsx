import { lazy, Suspense, useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import ControlPanel from '@/components/ui/ControlPanel'
import VitalsBar from '@/components/ui/VitalsBar'

const ICUScene = lazy(() => import('@/components/scene/ICUScene'))

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const t = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return <span className="font-mono text-sm tabular-nums" style={{ color: 'var(--muted)' }}>{t}</span>
}

export default function App() {
  return (
    <div className="flex h-full w-full flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-3.5"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l2 6 4-14 2 8h6" />
            </svg>
          </span>
          <div className="leading-tight">
            <h1 className="text-[15px] font-medium tracking-tight">3D ICU · Patient Monitor</h1>
            <p className="text-xs" style={{ color: 'var(--faint)' }}>
              Interactive intensive-care simulator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full live-dot" style={{ background: 'var(--accent)' }} />
            <span className="text-xs font-medium tracking-wide" style={{ color: 'var(--muted)' }}>
              MONITORING
            </span>
          </div>
          <span className="hidden h-4 w-px sm:block" style={{ background: 'var(--line-2)' }} />
          <Clock />
        </div>
      </header>

      {/* Live vitals strip */}
      <VitalsBar />

      {/* Scene + controls */}
      <main className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm" style={{ color: 'var(--faint)' }}>
                Loading scene…
              </div>
            }
          >
            <ICUScene />
          </Suspense>
          <div
            className="pointer-events-none absolute bottom-3 left-3 rounded-full px-3 py-1 text-[11px]"
            style={{ background: 'rgba(10,13,17,0.6)', color: 'var(--faint)', backdropFilter: 'blur(6px)' }}
          >
            Drag to orbit · scroll to zoom
          </div>
          <div
            className="absolute bottom-3 right-3 max-w-[52%] rounded-full px-3 py-1 text-right text-[10px] leading-relaxed"
            style={{ background: 'rgba(10,13,17,0.6)', color: 'var(--faint)', backdropFilter: 'blur(6px)' }}
          >
            3D:{' '}
            <a href="https://skfb.ly/oJZ6C" target="_blank" rel="noreferrer" className="underline decoration-white/20 hover:text-white/80">
              Hospital Bed
            </a>{', '}
            <a href="https://skfb.ly/6RzEu" target="_blank" rel="noreferrer" className="underline decoration-white/20 hover:text-white/80">
              IV Pole
            </a>{', '}
            <a href="https://skfb.ly/pFUZn" target="_blank" rel="noreferrer" className="underline decoration-white/20 hover:text-white/80">
              Pillow
            </a>{' · '}
            <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="underline decoration-white/20 hover:text-white/80">
              CC BY 4.0
            </a>
          </div>
        </div>
        <ControlPanel />
      </main>

      <Analytics />
    </div>
  )
}
