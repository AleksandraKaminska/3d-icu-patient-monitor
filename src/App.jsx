import ICUScene from './components/scene/ICUScene.jsx'
import ControlPanel from './components/ui/ControlPanel.jsx'
import VitalsBar from './components/ui/VitalsBar.jsx'

export default function App() {
  return (
    <div className="flex h-full w-full flex-col bg-slate-950 text-slate-100">
      {/* Nagłówek */}
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l2 6 4-14 2 8h6" />
            </svg>
          </span>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">
              ICU Digital Twin
            </h1>
            <p className="text-xs text-slate-400">
              Intensive Care Unit Digital Twin · 3D simulator
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
          ● LIVE
        </span>
      </header>

      {/* Górny pasek parametrów życiowych */}
      <VitalsBar />

      {/* Główny obszar: scena 3D + panel sterowania */}
      <main className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <ICUScene />
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-slate-900/70 px-3 py-1.5 text-[11px] text-slate-400 backdrop-blur">
            Drag to orbit · scroll to zoom
          </div>
          {/* CC-BY 4.0 attribution — required for the bed + IV pole assets */}
          <div className="absolute bottom-3 right-3 max-w-[46%] rounded-md bg-slate-900/70 px-3 py-1.5 text-right text-[10px] leading-relaxed text-slate-500 backdrop-blur">
            3D:{' '}
            <a href="https://skfb.ly/oJZ6C" target="_blank" rel="noreferrer" className="text-slate-400 underline hover:text-slate-200">
              "Hospital Bed"
            </a>{' '}
            by Carlos.Maciel ·{' '}
            <a href="https://skfb.ly/6RzEu" target="_blank" rel="noreferrer" className="text-slate-400 underline hover:text-slate-200">
              "IV Pole"
            </a>{' '}
            by Mouch ·{' '}
            <a href="https://skfb.ly/pFUZn" target="_blank" rel="noreferrer" className="text-slate-400 underline hover:text-slate-200">
              "Pillow"
            </a>{' '}
            by monupaswan944 ·{' '}
            <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="text-slate-400 underline hover:text-slate-200">
              CC BY 4.0
            </a>
          </div>
        </div>
        <ControlPanel />
      </main>
    </div>
  )
}
