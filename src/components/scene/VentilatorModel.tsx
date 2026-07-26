import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/**
 * VentilatorModel - ventilator loaded from a GLB (Tripo, meshopt). Auto-fitted:
 * scaled to `targetHeight`, centered on X/Z, based on the floor. The live
 * screen readout is a separate component (VentScreen) placed in world space,
 * since the model has no distinct screen geometry to attach to.
 */
export default function VentilatorModel({ targetHeight = 1.7, ...props }) {
  const { scene } = useGLTF('/models/ventilator.glb')

  const fitted = useMemo(() => {
    const o = scene.clone(true)
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
  }, [scene, targetHeight])

  return (
    <group {...props}>
      <primitive object={fitted} />
    </group>
  )
}

useGLTF.preload('/models/ventilator.glb')
