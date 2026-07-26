import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useVitals } from '@/store/vitals'
import type { Vec3 } from '@/types'

const _tint = new THREE.Color()

// Skinned mesh can't be cloned safely; bounds measured offline.
const MODEL_SIZE = [0.18, 0.99, 1.0]
const MODEL_CENTER = [0, 0.495, 0]

// Rigged patient GLB: lay it on the bed, pose bones from bind pose, tint by SpO2.
export default function PatientModel({
  targetLength = 2.3,
  pos = [0, 1.2, 0.15],
  layRot = [-Math.PI / 2, 0, 0],
  rollRot = [0, 0, Math.PI / 2],
  lUpperarm = [0, 0, -1.4],
  rUpperarm = [0, 0, 1.4],
  lForearm = [0, 0.42, 0],
  rForearm = [0, -0.42, 0],
  lHand = [0, 0.42, 0],
  rHand = [0, -0.42, 0],
  neck = [0.4, 0, 0],
}: {
  targetLength?: number
  pos?: Vec3
  layRot?: Vec3
  rollRot?: Vec3
  lUpperarm?: Vec3
  rUpperarm?: Vec3
  lForearm?: Vec3
  rForearm?: Vec3
  lHand?: Vec3
  rHand?: Vec3
  neck?: Vec3
}) {
  const { scene } = useGLTF('/models/patient.glb')
  const materials = useRef<THREE.MeshStandardMaterial[]>([])

  const scale = targetLength / Math.max(...MODEL_SIZE)
  const offset = useMemo<Vec3>(
    () => [-MODEL_CENTER[0] * scale, -MODEL_CENTER[1] * scale, -MODEL_CENTER[2] * scale],
    [scale],
  )
  const lastSpo2 = useRef(NaN)

  // Shadows + collect tintable materials on the shared (non-cloned) scene.
  useLayoutEffect(() => {
    const mats: THREE.MeshStandardMaterial[] = []
    scene.traverse((m) => {
      if (m instanceof THREE.Mesh) {
        m.castShadow = true
        m.receiveShadow = true
        m.frustumCulled = false
        const list = Array.isArray(m.material) ? m.material : [m.material]
        for (const mat of list) {
          if (mat instanceof THREE.MeshStandardMaterial) mats.push(mat)
        }
      }
    })
    materials.current = mats
  }, [scene])

  // Pose the arms/neck: rotate the bones relative to their captured bind pose.
  useLayoutEffect(() => {
    const pose = (name: string, e: Vec3) => {
      const bone = scene.getObjectByName(name)
      if (!bone) return
      if (!bone.userData.bindQuat) bone.userData.bindQuat = bone.quaternion.clone()
      bone.quaternion.copy(bone.userData.bindQuat)
      bone.rotateX(e[0])
      bone.rotateY(e[1])
      bone.rotateZ(e[2])
    }
    pose('L_Upperarm', lUpperarm)
    pose('R_Upperarm', rUpperarm)
    pose('L_Forearm', lForearm)
    pose('R_Forearm', rForearm)
    pose('L_Hand', lHand)
    pose('R_Hand', rHand)
    pose('NeckTwist01', neck)
  }, [scene, lUpperarm, rUpperarm, lForearm, rForearm, lHand, rHand, neck])

  // Cyanosis tint; skip when SpO2 is unchanged.
  useFrame(() => {
    const spo2 = useVitals.getState().current.spo2
    if (spo2 === lastSpo2.current) return
    lastSpo2.current = spo2
    const t = THREE.MathUtils.clamp((94 - spo2) / 14, 0, 1)
    _tint.setRGB(1 - 0.5 * t, 1 - 0.38 * t, 1 - 0.08 * t)
    for (const m of materials.current) m.color.copy(_tint)
  })

  return (
    <group position={pos}>
      {/* Nested groups make the rotation order explicit: roll → lay → fit. */}
      <group rotation={rollRot}>
        <group rotation={layRot}>
          <group scale={scale} position={offset}>
            <primitive object={scene} />
          </group>
        </group>
      </group>
    </group>
  )
}

useGLTF.preload('/models/patient.glb')
