import * as THREE from 'three'

/**
 * color.js — Volumetric heatmap of the patient's condition.
 *
 * The patient's skin color is interpolated based on saturation (SpO2):
 * healthy pink complexion -> bluish (cyanosis) under hypoxia.
 * Linear interpolation in color space (THREE.Color.lerpColors).
 */

const HEALTHY = new THREE.Color('#e6a58c') // well-oxygenated skin
const CYANOTIC = new THREE.Color('#5b7fb0') // cyanosis under hypoxia
const _out = new THREE.Color()

/**
 * @param {number} spo2 — saturation 0..100
 * @returns {THREE.Color}
 */
export function skinColorForSpo2(spo2) {
  // 100% -> 0 (healthy), 80% and below -> 1 (cyanosis)
  const t = THREE.MathUtils.clamp((94 - spo2) / 14, 0, 1)
  return _out.lerpColors(HEALTHY, CYANOTIC, t)
}

/**
 * Color for a parameter's digits/curve — green in range, amber/red on alarm.
 */
export function statusColor(value, { low, high, warnLow, warnHigh }) {
  if (value < low || value > high) return '#ef4444' // alarm
  if (value < warnLow || value > warnHigh) return '#f59e0b' // warning
  return '#22d3ee' // in range (monitor cyan)
}
