import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { fitModel } from '@/lib/fitModel'
import type { Vec3 } from '@/types'

/**
 * Pillow - a pillow GLB placed under the patient's head. It's a standalone
 * prop (nothing to do with the patient's rig), auto-fitted by width and
 * centered so `pos` positions its center.
 *
 * Asset: "Pillow" (https://skfb.ly/pFUZn) by monupaswan944 - CC BY 4.0.
 */
export default function Pillow({
  targetWidth = 0.72,
  pos = [0, 1.22, -1.08],
  rot = [0, 0, 0],
}: {
  targetWidth?: number
  pos?: Vec3
  rot?: Vec3
}) {
  const { scene } = useGLTF('/models/pillow.glb')

  // Centered on all axes (positioned by its center, not floored).
  const fitted = useMemo(
    () => fitModel(scene, { axis: 'width', target: targetWidth, floor: false }).object,
    [scene, targetWidth],
  )

  return (
    <group position={pos} rotation={rot}>
      <primitive object={fitted} />
    </group>
  )
}

useGLTF.preload('/models/pillow.glb')
