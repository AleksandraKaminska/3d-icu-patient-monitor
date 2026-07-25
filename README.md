# ICU Digital Twin

An interactive 3D intensive-care unit (ICU) simulator — a training tool for
medical staff and a demonstration of real-time vital-sign monitoring. All the
equipment and waveforms are generated mathematically, with no pre-recorded
footage.

![stack](https://img.shields.io/badge/React-19-61dafb) ![r3f](https://img.shields.io/badge/React_Three_Fiber-9-black) ![tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

## Stack

- **React 19** + **Vite** — frontend
- **React Three Fiber** + **drei** + **three.js** — 3D scene
- **Tailwind CSS v4** — all UI outside the 3D scene
- **Zustand** — vital-signs state

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## What's inside

| Feature | Where | Math / medicine |
| --- | --- | --- |
| ECG waveform (P-QRS-T) | `src/lib/ecg.js`, `Cardiomonitor.jsx` | Sum of Gaussian curves over the cycle phase; HR drives the period and "compresses" the wave |
| SpO₂ pleth wave | `src/lib/ecg.js` | Sine harmonics; amplitude weakens at low saturation |
| Patient heatmap | `src/lib/color.js`, `Patient.jsx` | Skin-color interpolation (pink → cyanosis) by SpO₂ |
| Ventilator | `Ventilator.jsx` | Piston lerp between inhale and exhale, stroke = VT |
| IV drip | `IVStand.jsx` | Drop fall integrated from the gravity vector (p = ½·g·t²) |
| Tubes & cables | `Tubes.jsx` | `CatmullRomCurve3` splines + point–plane collision guard |
| Simulation loop | `Simulation.jsx` | Smooth easing of vitals toward targets (lerp), advancing heart/breath phases |

## Controls

- **Right-hand panel** — pick a clinical scenario (stable, desaturation,
  tachycardia, bradycardia) or set vitals manually with sliders.
- **3D scene** — drag to orbit the camera; scroll to zoom.

## Structure

```
src/
├── App.jsx                    # layout: header + scene + panel
├── lib/
│   ├── ecg.js                 # ECG / SpO₂ synthesis
│   └── color.js               # skin-color heatmap
├── store/
│   ├── vitals.js              # vitals state (Zustand) + scenarios
│   └── simClock.js            # shared phases (no re-renders)
├── components/
│   ├── scene/                 # 3D components (R3F)
│   │   ├── ICUScene.jsx       # Canvas + lights + scene assembly
│   │   ├── Simulation.jsx     # simulation driver (useFrame)
│   │   ├── Room, PatientBed, Patient
│   │   ├── Cardiomonitor, Trace
│   │   ├── Ventilator, IVStand, Tubes
│   └── ui/                    # Tailwind UI
│       ├── VitalsBar.jsx      # top vitals strip
│       └── ControlPanel.jsx   # control panel
```

## Notes

- drei's `<Text>` fetches the Roboto font from the network by default; offline,
  the monitor labels fall back to a system font (no crash). For a fully offline
  build, add a local `.woff` and pass it via the `font` prop.

## Credits (3D assets)

- **"Hospital Bed"** (https://skfb.ly/oJZ6C) by **Carlos.Maciel** — licensed
  under [Creative Commons Attribution 4.0](http://creativecommons.org/licenses/by/4.0/).
  Loaded via `useGLTF` (`hospital_bed_carlos.glb`).
- **"IV Pole"** (https://skfb.ly/6RzEu) by **Mouch** — licensed under
  [Creative Commons Attribution 4.0](http://creativecommons.org/licenses/by/4.0/).
  Loaded via `useGLTF` (`iv_pole.glb`).
- **"Pillow"** (https://skfb.ly/pFUZn) by **monupaswan944** — licensed under
  [Creative Commons Attribution 4.0](http://creativecommons.org/licenses/by/4.0/).
- Heart-rate monitor (`heart_monitor.glb`) and patient (`patient.glb`, rigged).

The cardiomonitor's live ECG/SpO₂ traces, the ventilator, and the tubes are
generated procedurally in code.
