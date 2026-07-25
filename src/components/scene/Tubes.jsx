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

// Build a corrugated (ribbed) tube along a curve by modulating the radius.
function corrugatedTube(curve, tubularSegments, radius, radialSegments) {
  const frames = curve.computeFrenetFrames(tubularSegments, false)
  const positions = [], normals = [], indices = []
  const P = new THREE.Vector3()
  for (let i = 0; i <= tubularSegments; i++) {
    curve.getPointAt(i / tubularSegments, P)
    const N = frames.normals[i], B = frames.binormals[i]
    const r = radius * (1 + 0.22 * Math.sin(i * 2.0)) // ribs
    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2
      const s = Math.sin(v), c = -Math.cos(v)
      const nx = c * N.x + s * B.x, ny = c * N.y + s * B.y, nz = c * N.z + s * B.z
      positions.push(P.x + r * nx, P.y + r * ny, P.z + r * nz)
      normals.push(nx, ny, nz)
    }
  }
  for (let i = 1; i <= tubularSegments; i++) {
    for (let j = 1; j <= radialSegments; j++) {
      const a = (radialSegments + 1) * (i - 1) + (j - 1)
      const b = (radialSegments + 1) * i + (j - 1)
      const c = (radialSegments + 1) * i + j
      const d = (radialSegments + 1) * (i - 1) + j
      indices.push(a, b, d, b, c, d)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setIndex(indices)
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  return g
}

function Tube({ points, radius = 0.02, color = '#e2e8f0', opacity = 1, clamp = true, corrugated = false }) {
  const geometry = useMemo(() => {
    const pts = points.map((p) => (clamp ? clampAboveBed(p) : new THREE.Vector3(...p)))
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5)
    return corrugated
      ? corrugatedTube(curve, 140, radius, 12)
      : new THREE.TubeGeometry(curve, 96, radius, 12, false)
  }, [points, radius, clamp, corrugated])

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
      {/* Intubation tube: ventilator outlet -> the model's breathing-circuit
          connector at the mouth. White, opaque, corrugated. */}
      <Tube
        color="#f4f6f9"
        radius={0.021}
        corrugated
        clamp={false}
        points={[
          [-1.18, 1.27, -0.68], // ventilator front
          [-0.85, 1.13, -0.72], // natural droop
          [-0.5, 1.1, -0.82], // belly beside the head
          [-0.18, 1.36, -0.93], // rise up, approach from the head side
          [-0.02, 1.43, -0.9], // arches over just above the mouth
          [0.03, 1.28, -0.95], // tip curls down INTO the mouth (hidden inside)
        ]}
      />

      {/* Monitor leads: cardiomonitor -> patient's chest (ECG electrodes),
          thin cables with a gentle sag. */}
      <Tube
        color="#f1f5f9"
        radius={0.007}
        clamp={false}
        points={[
          [1.41, 1.75, -0.66],
          [1.08, 1.48, -0.66],
          [0.62, 1.36, -0.64],
          [0.3, 1.3, -0.63],
          [0.1, 1.27, -0.62], // tucks under the gown at the collar / neck
        ]}
      />
      <Tube
        color="#94a3b8"
        radius={0.007}
        clamp={false}
        points={[
          [1.41, 1.68, -0.7],
          [1.04, 1.44, -0.7],
          [0.58, 1.34, -0.66],
          [0.26, 1.29, -0.63],
          [-0.03, 1.27, -0.61],
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
          [-0.88, 1.4, -0.42], // hangs down from the valve
          [-0.72, 1.15, -0.3], // lands on the mattress near the edge
          [-0.5, 1.13, -0.2], // rests along the bed surface
          [-0.34, 1.14, -0.14], // patient's right hand (cannula)
        ]}
      />
    </group>
  )
}
