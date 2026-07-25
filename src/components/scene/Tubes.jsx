import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Tubes — tubes and cables generated dynamically in 3D as Catmull-Rom splines.
 *
 * Intubation tube, monitor leads, and the IV line are not straight segments —
 * we define control points in space and let CatmullRomCurve3 interpolate a
 * smooth curve, then wrap it in a TubeGeometry. The control points are kept
 * above the mattress plane (y > BED_TOP), a simple point-plane check so the
 * tubes drape naturally instead of passing through the bed.
 */

const BED_TOP = 1.12 // mattress top plane — control points must stay above it

// Point-plane guard: lift any point that would sink below the bed.
function clampAboveBed(p, margin = 0.02) {
  return new THREE.Vector3(p[0], Math.max(p[1], BED_TOP + margin), p[2])
}

/**
 * Sagging line between two points — samples a straight interpolation and
 * subtracts a parabolic droop (0 at the ends, deepest in the middle), so a
 * flexible tube hangs under gravity like a real IV line instead of running
 * straight. `sag` is the maximum dip; `n` the number of samples.
 */
function saggingLine(start, end, sag = 0.4, n = 12) {
  const pts = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    pts.push([
      THREE.MathUtils.lerp(start[0], end[0], t),
      THREE.MathUtils.lerp(start[1], end[1], t) - sag * 4 * t * (1 - t),
      THREE.MathUtils.lerp(start[2], end[2], t),
    ])
  }
  return pts
}

function Tube({ points, radius = 0.02, color = '#e2e8f0', opacity = 1, clamp = true }) {
  const geometry = useMemo(() => {
    const pts = points.map((p) => (clamp ? clampAboveBed(p) : new THREE.Vector3(...p)))
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5)
    return new THREE.TubeGeometry(curve, 96, radius, 12, false)
  }, [points, radius, clamp])

  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial
        color={color}
        roughness={0.4}
        metalness={0.1}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  )
}

export default function Tubes() {
  return (
    <group>
      {/* Intubation tube: ventilator -> patient's mouth */}
      <Tube
        color="#cbd5e1"
        radius={0.022}
        opacity={0.9}
        points={[
          [-2.2, 1.4, -1.0],
          [-1.4, 1.55, -1.1],
          [-0.7, 1.48, -1.0],
          [-0.3, 1.34, -0.9],
          [0, 1.26, -0.82],
        ]}
      />

      {/* Monitor leads: cardiomonitor -> patient's chest (ECG electrodes),
          thin cables with a gentle sag. */}
      <Tube
        color="#f1f5f9"
        radius={0.007}
        clamp={false}
        points={[
          [1.41, 1.8, -0.66],
          [1.31, 1.32, -0.6],
          [0.85, 1.04, -0.5],
          [0.42, 1.12, -0.42],
          [0.16, 1.22, -0.36],
        ]}
      />
      <Tube
        color="#94a3b8"
        radius={0.007}
        clamp={false}
        points={[
          [1.41, 1.74, -0.68],
          [1.29, 1.26, -0.63],
          [0.75, 0.99, -0.5],
          [0.3, 1.1, -0.39],
          [-0.1, 1.22, -0.3],
        ]}
      />

      {/* IV line: drip valve -> patient's left forearm, hanging in a natural
          gravity sag (clamp off so it can loop lower beside the bed). */}
      <Tube
        color="#e9e2c6"
        radius={0.007}
        opacity={0.5}
        clamp={false}
        points={[
          [-0.95, 1.79, -0.57],
          [-0.9, 1.28, -0.48],
          [-0.72, 0.98, -0.3],
          [-0.58, 1.06, -0.1],
          [-0.5, 1.2, 0.05],
        ]}
      />
    </group>
  )
}
