/**
 * simClock.js - Shared, mutable simulation clock.
 *
 * The phases (heart, breath, drip) change dozens of times per second.
 * Holding them in React state would trigger a flood of re-renders, so we
 * store them in a plain object. The Simulation component updates the fields
 * in useFrame, and the other 3D components read them without re-rendering.
 */
export const simClock = {
  respPhase: 0, // 0..2π - respiratory phase
  breath: 0, // 0..1 - degree of inhalation (drives chest/piston motion)
  dripT: 0, // 0..1 - progress of the falling IV drop
}
