import { Analytics } from '@vercel/analytics/react'
import { lazy, Suspense } from 'react'
import ControlPanel from '@/components/ui/ControlPanel'
import VitalsBar from '@/components/ui/VitalsBar'

const ICUScene = lazy(() => import('@/components/scene/ICUScene'))

export default function App() {
  return (
    <div className="flex h-full w-full" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Simulator column: header, vitals strip and the 3D scene */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="z-10 flex items-center px-6 py-2.5"
          style={{
            background: 'var(--panel)',
            borderBottom: '1px solid var(--line)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <svg
                aria-hidden="true"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12h4l2 6 4-14 2 8h6" />
              </svg>
            </span>
            <div className="leading-tight">
              <h1 className="text-[15px] font-medium tracking-tight">Intensive Care Monitor</h1>
              <p className="text-xs" style={{ color: 'var(--faint)' }}>
                Interactive intensive-care simulator
              </p>
            </div>
          </div>
        </header>

        <VitalsBar />

        <div className="relative min-h-0 flex-1">
          <Suspense
            fallback={
              <div
                className="flex h-full items-center justify-center text-sm"
                style={{ color: 'var(--faint)' }}
              >
                Loading scene…
              </div>
            }
          >
            <ICUScene />
          </Suspense>
          <div
            className="pointer-events-none absolute bottom-3 left-3 rounded-full px-3 py-1 text-[11px]"
            style={{
              background: 'rgba(255,255,255,0.75)',
              color: 'var(--muted)',
              boxShadow: 'var(--shadow-sm)',
              backdropFilter: 'blur(6px)',
            }}
          >
            Drag to orbit · scroll to zoom
          </div>
          <div
            className="absolute bottom-3 right-3 max-w-[52%] rounded-full px-3 py-1 text-right text-[10px] leading-relaxed"
            style={{
              background: 'rgba(255,255,255,0.75)',
              color: 'var(--faint)',
              boxShadow: 'var(--shadow-sm)',
              backdropFilter: 'blur(6px)',
            }}
          >
            3D:{' '}
            <a
              href="https://skfb.ly/oJZ6C"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-slate-300 hover:text-slate-700"
            >
              Hospital Bed
            </a>
            {', '}
            <a
              href="https://skfb.ly/6RzEu"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-slate-300 hover:text-slate-700"
            >
              IV Pole
            </a>
            {', '}
            <a
              href="https://skfb.ly/pFUZn"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-slate-300 hover:text-slate-700"
            >
              Pillow
            </a>
            {' · '}
            <a
              href="http://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-slate-300 hover:text-slate-700"
            >
              CC BY 4.0
            </a>
          </div>
        </div>
      </div>

      {/* Full-height control sidebar - spans the whole window, above the header line */}
      <ControlPanel />

      <Analytics />
    </div>
  )
}
