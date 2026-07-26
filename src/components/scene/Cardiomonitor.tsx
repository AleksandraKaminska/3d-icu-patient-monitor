import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { useMemo } from 'react'
import MonitorScreen from '@/components/scene/MonitorScreen'
import { fitModel } from '@/lib/fitModel'
import type { Vec3 } from '@/types'

// Screen center in model space; the overlay faces model-local -Z (180° flip).
const MODEL_CENTER = [1.64, 18.19, 0.02]
const MODEL_MIN_Y = -18.65
const SCREEN_MODEL = [0, 46.85, -4.9]

export default function Cardiomonitor({
  targetHeight = 1.7,
  screenSize = [0.4, 0.3],
  screenTrim = [0, 0, 0],
  ...props
}: {
  targetHeight?: number
  screenSize?: [number, number]
  screenTrim?: Vec3
} & ThreeElements['group']) {
  const { scene } = useGLTF('/models/heart_monitor.glb')

  const { fitted, screenPos } = useMemo(() => {
    const { object, scale: s } = fitModel(scene, { axis: 'height', target: targetHeight })
    const screenPos: Vec3 = [
      s * SCREEN_MODEL[0] - MODEL_CENTER[0] * s + screenTrim[0],
      s * SCREEN_MODEL[1] - MODEL_MIN_Y * s + screenTrim[1],
      s * SCREEN_MODEL[2] - MODEL_CENTER[2] * s + screenTrim[2],
    ]
    return { fitted: object, screenPos }
  }, [scene, targetHeight, screenTrim])

  return (
    <group {...props}>
      <primitive object={fitted} />
      <MonitorScreen pos={screenPos} rot={[0, Math.PI, 0]} size={screenSize} />
    </group>
  )
}

useGLTF.preload('/models/heart_monitor.glb')
