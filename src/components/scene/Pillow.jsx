import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Pillow — a pillow GLB placed under the patient's head. It's a standalone
 * prop (nothing to do with the patient's rig), auto-fitted by width and
 * centered so `pos` positions its center.
 *
 * Asset: "Pillow" (https://skfb.ly/pFUZn) by monupaswan944 — CC BY 4.0.
 */
export default function Pillow({ targetWidth = 0.72, pos = [0, 1.22, -1.08], rot = [0, 0, 0] }) {
  const { scene } = useGLTF('/models/pillow.glb')

  const fitted = useMemo(() => {
    const o = scene.clone(true)
    const box = new THREE.Box3().setFromObject(o)
    const size = new THREE.Vector3()
    box.getSize(size)
    const center = new THREE.Vector3()
    box.getCenter(center)
    const s = targetWidth / size.x
    o.scale.setScalar(s)
    o.position.set(-center.x * s, -center.y * s, -center.z * s)
    o.traverse((m) => {
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    return o
  }, [scene, targetWidth])

  return (
    <group position={pos} rotation={rot}>
      <primitive object={fitted} />
    </group>
  )
}

useGLTF.preload('/models/pillow.glb')
