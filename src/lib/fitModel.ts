import * as THREE from 'three'

// Shared auto-fit for GLB assets: clone, scale to a target axis, optionally
// align longest horizontal axis to Z, center on X/Z and floor, enable shadows.
export type FitAxis = 'height' | 'width' | 'longest-horizontal'

export interface FitOptions {
  axis: FitAxis
  target: number
  /** Center on X/Z (default true). */
  center?: boolean
  /** Put the model's min-Y at 0 (default true). When false, Y is centered too. */
  floor?: boolean
  /** Extra vertical offset applied after flooring. */
  lift?: number
  /** Rotate 90° so the longest horizontal axis runs along Z. */
  alignLongestToZ?: boolean
  /** Mutate the cloned object's meshes before measuring (e.g. geometry edits). */
  preprocess?: (o: THREE.Object3D) => void
}

export function fitModel(
  source: THREE.Object3D,
  opts: FitOptions,
): { object: THREE.Object3D; scale: number } {
  const o = source.clone(true)
  opts.preprocess?.(o)

  const size0 = new THREE.Vector3()
  new THREE.Box3().setFromObject(o).getSize(size0)

  const scale =
    opts.axis === 'height'
      ? opts.target / size0.y
      : opts.axis === 'width'
        ? opts.target / size0.x
        : opts.target / Math.max(size0.x, size0.z)
  o.scale.setScalar(scale)

  if (opts.alignLongestToZ && size0.x >= size0.z) o.rotation.y = Math.PI / 2

  const box = new THREE.Box3().setFromObject(o)
  const c = new THREE.Vector3()
  box.getCenter(c)
  const center = opts.center !== false
  const floor = opts.floor !== false
  o.position.set(
    center ? -c.x : 0,
    floor ? -box.min.y + (opts.lift ?? 0) : center ? -c.y : 0,
    center ? -c.z : 0,
  )

  o.traverse((m) => {
    if (m instanceof THREE.Mesh) {
      m.castShadow = true
      m.receiveShadow = true
    }
  })

  return { object: o, scale }
}
