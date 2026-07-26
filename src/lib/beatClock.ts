import { type BeatCtx, beatPeriod, RHYTHMS, type Rhythm } from '@/lib/ecg'

const PVC_PROBABILITY = 0.22

/**
 * Stateful cardiac clock, advanced once per sample. It integrates the beat
 * phase, schedules each RR interval (including PVC ectopy) and evaluates the
 * active rhythm's morphology. The pleth reads `beatPhase` to stay in step.
 */
export class BeatClock {
  private phase = 0
  private rr: number
  private tAbs = 0
  private ectopic = false

  constructor(hr: number) {
    this.rr = beatPeriod(hr)
  }

  get beatPhase(): number {
    return this.phase
  }

  advance(dt: number, hr: number, rhythm: Rhythm): void {
    this.tAbs += dt
    const prev = this.phase
    this.phase = (this.phase + dt / this.rr) % 1
    if (this.phase < prev) this.scheduleBeat(hr, rhythm)
  }

  ecg(rhythm: Rhythm, respPhase: number): number {
    const ctx: BeatCtx = {
      tBeat: this.phase * this.rr,
      rr: this.rr,
      respPhase,
      tAbs: this.tAbs,
      ectopic: this.ectopic,
    }
    return RHYTHMS[rhythm].wave(ctx)
  }

  private scheduleBeat(hr: number, rhythm: Rhythm): void {
    // PVCs alternate a premature ectopic beat with a compensatory pause.
    if (rhythm === 'pvc') {
      if (this.ectopic) {
        this.ectopic = false
        this.rr = beatPeriod(hr) * 1.5
      } else if (Math.random() < PVC_PROBABILITY) {
        this.ectopic = true
        this.rr = beatPeriod(hr) * 0.6
      } else {
        this.rr = beatPeriod(hr)
      }
      return
    }
    this.ectopic = false
    this.rr = RHYTHMS[rhythm].rr(hr)
  }
}
