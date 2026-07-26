import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/**
 * IVStand - IV pole + drip loaded from a GLB (embedded PBR, transmissive bag).
 *
 * The asset bakes TWO poles into one geometry (one with a drip bag, one bare),
 * so we keep only one half: triangles are filtered by their centroid on the
 * model's local split axis (Y). `keepPositive` selects which pole survives.
 *
 * Auto-fitted after filtering: scaled to `targetHeight`, centered on X/Z,
 * based on the floor.
 *
 * Asset: "IV Pole" (https://skfb.ly/6RzEu) by Mouch - CC BY 4.0.
 */
function keepHalf(geo: THREE.BufferGeometry, keepPositive: boolean): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo.clone()
  const pos = g.attributes.position
  const nor = g.attributes.normal
  const uv = g.attributes.uv
  const P: number[] = [], N: number[] = [], U: number[] = []
  for (let t = 0; t < pos.count; t += 3) {
    const cy = (pos.getY(t) + pos.getY(t + 1) + pos.getY(t + 2)) / 3
    if ((keepPositive && cy >= 0) || (!keepPositive && cy < 0)) {
      for (let k = 0; k < 3; k++) {
        P.push(pos.getX(t + k), pos.getY(t + k), pos.getZ(t + k))
        if (nor) N.push(nor.getX(t + k), nor.getY(t + k), nor.getZ(t + k))
        if (uv) U.push(uv.getX(t + k), uv.getY(t + k))
      }
    }
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(P, 3))
  if (nor) out.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3))
  if (uv) out.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2))
  out.computeBoundingBox()
  out.computeBoundingSphere()
  return out
}

export default function IVStand({ targetHeight = 2.4, keepPositive = true, ...props }) {
  const { scene } = useGLTF('/models/iv_pole.glb')

  const fitted = useMemo(() => {
    const o = scene.clone(true)

    // Drop the second pole by keeping one half of the geometry.
    o.traverse((m) => {
      if (m instanceof THREE.Mesh) m.geometry = keepHalf(m.geometry, keepPositive)
    })

    // Auto-fit: scale to targetHeight (Y), center X/Z, base on the floor.
    const box0 = new THREE.Box3().setFromObject(o)
    const size0 = new THREE.Vector3()
    box0.getSize(size0)
    o.scale.setScalar(targetHeight / size0.y)
    const box1 = new THREE.Box3().setFromObject(o)
    const c = new THREE.Vector3()
    box1.getCenter(c)
    o.position.set(-c.x, -box1.min.y, -c.z)

    o.traverse((m) => {
      if (m instanceof THREE.Mesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    return o
  }, [scene, targetHeight, keepPositive])

  // Wrap in a group: the fitted object keeps its internal centering/floor
  // offset, and the scene's position/rotation apply to the group - so they
  // compose instead of the props overwriting the centering.
  return (
    <group {...props}>
      <primitive object={fitted} />
    </group>
  )
}

useGLTF.preload('/models/iv_pole.glb')
