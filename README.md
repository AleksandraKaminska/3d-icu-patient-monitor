# Intensive Care Monitor

An interactive 3D intensive-care unit (ICU) simulator - a training tool for
medical staff and a demonstration of real-time vital-sign monitoring. The ECG,
SpO₂, capnography and airway-pressure waveforms are generated mathematically (no
pre-recorded footage), the ECG rhythm and clinical scenario are switchable, and
the 3D patient turns cyanotic as saturation drops.

![Intensive Care Monitor - screenshot](docs/screenshot.png)

## Stack

- **React 19** + **TypeScript** + **Vite** - frontend
- **React Three Fiber** + **drei** + **three.js** - 3D scene
- **Zustand** - vital-signs state

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc -b
npm run lint       # biome check
npm run format     # biome check --write (lint + format fixes)
npm run build      # tsc -b && vite build → dist/
```

## What's inside

Equipment is a mix of GLB models (bed, IV pole, ventilator, heart monitor,
patient, pillow) with **live data drawn procedurally on top** - every waveform,
the cyanosis tint and every tube/cable is generated in code from the simulated
vitals.

| Feature | Where | Math / medicine |
| --- | --- | --- |
| ECG waveform (lead II) | `lib/ecg.ts`, `scene/Trace.tsx`, `scene/MonitorScreen.tsx` | P-QRS-T from timed Gaussian waves at real millisecond offsets; QRS keeps a constant width while diastole scales with HR, QT via Bazett. Drawn in **sweep mode** with a moving erase bar like a real bedside monitor |
| ECG rhythms | `lib/ecg.ts`, `lib/beatClock.ts`, `scene/MonitorScreen.tsx` | A rhythm registry (strategy per rhythm): **sinus**, **atrial fibrillation** (irregular RR, no P, f-waves - pulse follows), **atrial flutter** (sawtooth F-waves), **PVCs** (early wide beats + compensatory pause), **VT** (wide, fast), **VF** (chaotic, no pulse), **asystole** (flatline), **STEMI** (ST elevation) |
| SpO₂ pleth wave | `lib/ecg.ts` | Sine harmonics; amplitude weakens at low saturation |
| Blood pressure | `store/vitals.ts`, `ui/VitalsBar.tsx` | Systolic/diastolic set directly; MAP is derived - `DIA + (SYS − DIA) / 3` - and shown as `118/73 (88)` |
| Airway-pressure wave | `scene/VentScreen.tsx` | Paw waveform driven by the breath phase; PEEP baseline with peak pressure (PIP) scaling with tidal volume |
| Capnography (EtCO₂) | `lib/ecg.ts`, `scene/VentScreen.tsx` | Capnogram - phase II upstroke, phase III alveolar plateau scaled by EtCO₂, sharp drop at inspiration |
| Clinical scenarios | `store/vitals.ts`, `ui/ControlPanel.tsx` | Presets (stable, desaturation, tachy/brady, sepsis, hypovolemic shock, STEMI, cardiac arrest) that set the full vitals set - HR, SpO₂, RR, temperature, EtCO₂, BP - and the rhythm |
| Perfusion coupling | `store/vitals.ts` | A non-perfusing rhythm (VF/asystole) collapses pulse, BP, SpO₂ and EtCO₂; returning to a perfusing rhythm restores circulation (ROSC) |
| Patient cyanosis | `scene/PatientModel.tsx` | Skin material tinted from pink → blue as SpO₂ drops |
| IV cannula | `scene/Cannula.tsx` | Procedural tape dressing + luer connector on the hand |
| Tubes & cables | `scene/Tubes.tsx` | `CatmullRomCurve3` splines, a corrugated-tube generator, gravity sag |
| Model auto-fit | `lib/fitModel.ts` | Clone → scale to target → center/floor; IV pole trimmed to one pole |
| Simulation loop | `scene/Simulation.tsx` | Smooth easing of vitals toward targets (lerp) and advancing the breath/drip phases |

Screen overlays (ECG + SpO₂ on the monitor, airway-pressure + capnography on
the ventilator, plus live digits) are computed onto each model's real screen.

## Controls

- **Right-hand panel** - pick a clinical scenario (stable, desaturation,
  tachycardia, bradycardia, sepsis, hypovolemic shock, STEMI, cardiac arrest),
  switch the **ECG rhythm** (sinus / AF / flutter / PVCs / VT / VF / asystole /
  STEMI), or set vitals manually with the sliders.
- **3D scene** - drag to orbit the camera; scroll to zoom.

## Structure

```
src/
├── App.tsx                     # layout: header + vitals strip + scene + panel
├── types.ts                    # shared types (Vec3, TextMesh)
├── lib/
│   ├── ecg.ts                  # waveform synthesis + rhythm registry (RHYTHMS)
│   ├── beatClock.ts            # stateful cardiac clock (phase, RR, PVC ectopy)
│   ├── fitModel.ts             # shared GLB auto-fit
│   └── font.ts                 # local screen font path
├── store/
│   ├── vitals.ts               # vitals state (Zustand) + scenarios + rhythm
│   └── simClock.ts             # shared phases (mutated per frame, no re-render)
├── components/
│   ├── scene/                  # 3D components (R3F)
│   │   ├── ICUScene.tsx        # Canvas + lights + scene assembly (lazy-loaded)
│   │   ├── Simulation.tsx      # simulation driver (useFrame)
│   │   ├── Room.tsx            # floor + walls
│   │   ├── Bed.tsx             # hospital-bed GLB (auto-fit)
│   │   ├── PatientModel.tsx    # rigged patient GLB + posing + SpO₂ tint
│   │   ├── Pillow.tsx, Cannula.tsx
│   │   ├── Cardiomonitor.tsx   # monitor GLB + MonitorScreen
│   │   ├── MonitorScreen.tsx   # live ECG/SpO₂ readout
│   │   ├── VentilatorModel.tsx, VentScreen.tsx
│   │   ├── IVStand.tsx         # IV-pole GLB (trimmed to one pole)
│   │   ├── Trace.tsx, ScreenText.tsx
│   │   └── Tubes.tsx           # ET tube, ECG leads, IV line
│   └── ui/                     # Tailwind UI
│       ├── VitalsBar.tsx       # top vitals strip
│       └── ControlPanel.tsx    # scenarios + ECG rhythm + target-vitals sliders
```

## Notes

- GLB assets under `public/models/` are compressed with **meshopt** geometry +
  **WebP** textures via `gltf-transform` - the
  set went from ~40 MB to ~7.6 MB with no visible quality loss. drei's
  `useGLTF` decodes meshopt out of the box, so no CDN decoder is needed.

## Credits (3D assets)

- **"Hospital Bed"** (https://skfb.ly/oJZ6C) by **Carlos.Maciel** - licensed
  under [Creative Commons Attribution 4.0](http://creativecommons.org/licenses/by/4.0/).
- **"IV Pole"** (https://skfb.ly/6RzEu) by **Mouch** - licensed under
  [Creative Commons Attribution 4.0](http://creativecommons.org/licenses/by/4.0/).
- **"Pillow"** (https://skfb.ly/pFUZn) by **monupaswan944** - licensed under
  [Creative Commons Attribution 4.0](http://creativecommons.org/licenses/by/4.0/).
- Ventilator and patient models were AI-generated with **Tripo**; the
  heart-rate monitor is a third-party GLB.

All live readouts (ECG, SpO₂, capnography and airway-pressure waveforms, plus
the digits), the cyanosis tint, the IV drop and the tubes are generated
procedurally in code.
