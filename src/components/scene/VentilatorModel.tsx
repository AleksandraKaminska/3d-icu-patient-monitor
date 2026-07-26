import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { useMemo } from 'react'
import { fitModel } from '@/lib/fitModel'

/**
 * VentilatorModel - ventilator GLB (Tripo, meshopt), auto-fitted by height.
 * The live screen readout is a separate component (VentScreen) placed in world
 * space, since the model has no distinct screen geometry to attach to.
 */
export default function VentilatorModel({
  targetHeight = 1.7,
  ...props
}: { targetHeight?: number } & ThreeElements['group']) {
  const { scene } = useGLTF('/models/ventilator.glb')
  const fitted = useMemo(
    () => fitModel(scene, { axis: 'height', target: targetHeight }).object,
    [scene, targetHeight],
  )

  return (
    <group {...props}>
      <primitive object={fitted} />
    </group>
  )
}

useGLTF.preload('/models/ventilator.glb')
