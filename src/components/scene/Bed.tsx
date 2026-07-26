import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { type ThreeElements } from '@react-three/fiber'
import { fitModel } from '@/lib/fitModel'

export default function Bed({
  targetLength = 2.7,
  lift = 0,
  ...props
}: { targetLength?: number; lift?: number } & ThreeElements['group']) {
  const { scene } = useGLTF('/models/hospital_bed_carlos.glb')

  const fitted = useMemo(
    () =>
      fitModel(scene, {
        axis: 'longest-horizontal',
        target: targetLength,
        alignLongestToZ: true,
        lift,
      }).object,
    [scene, targetLength, lift],
  )

  return (
    <group {...props}>
      <primitive object={fitted} />
    </group>
  )
}

useGLTF.preload('/models/hospital_bed_carlos.glb')
