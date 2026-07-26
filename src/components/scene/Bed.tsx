import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Bed - hospital bed loaded from a glTF/GLB asset (public/models).
 *
 * The raw model comes in an arbitrary scale/orientation, so we auto-fit it:
 *  - scale so its longest horizontal axis matches `targetLength`,
 *  - rotate so that long axis runs along Z (patient head -> feet),
 *  - center on X/Z and drop it onto the floor (min Y = 0).
 *
 * `lift` nudges the whole bed vertically for fine-tuning against the
 * procedural patient's mattress height.
 *
 * Asset: "Hospital Bed" (https://skfb.ly/oJZ6C) by Carlos.Maciel - CC BY 4.0.
 * Its mattress ends up at world y ≈ 1.12 after the fit.
 */
export default function Bed({ targetLength = 2.7, lift = 0, ...props }) {
  const { scene } = useGLTF('/models/hospital_bed_carlos.glb')

  const fitted = useMemo(() => {
    const obj = scene.clone(true)

    // Measure raw bounds.
    const box0 = new THREE.Box3().setFromObject(obj)
    const size0 = new THREE.Vector3()
    box0.getSize(size0)

    // Uniform scale so the longer horizontal side == targetLength.
    const s = targetLength / Math.max(size0.x, size0.z)
    obj.scale.setScalar(s)

    // If the long axis is X, rotate 90° so it aligns with Z.
    obj.rotation.y = size0.x >= size0.z ? Math.PI / 2 : 0

    // Re-measure after scale + rotation, then center X/Z and sit on the floor.
    const box1 = new THREE.Box3().setFromObject(obj)
    const center1 = new THREE.Vector3()
    box1.getCenter(center1)
    obj.position.set(-center1.x, -box1.min.y + lift, -center1.z)

    // Enable shadows on every mesh.
    obj.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })

    return obj
  }, [scene, targetLength, lift])

  return <primitive object={fitted} {...props} />
}

useGLTF.preload('/models/hospital_bed_carlos.glb')
