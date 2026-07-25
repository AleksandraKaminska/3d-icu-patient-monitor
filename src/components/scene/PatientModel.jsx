import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useVitals } from '../../store/vitals.js'

// Reused scratch color for the per-frame SpO2 tint.
const _tint = new THREE.Color()

/**
 * PatientModel — patient loaded from a rigged GLB (Tripo, meshopt).
 *
 * The mesh is skinned, so we do NOT clone it (cloning breaks the skeleton
 * binding) — we scale/center it via wrapping groups. The model ships in a
 * T-pose, so we rotate the upper-arm bones to bring the arms down along the
 * body. Bone deltas are applied relative to the captured bind pose, so tuning
 * the angles never accumulates.
 */
export default function PatientModel({
  targetLength = 2.3,
  pos = [0, 1.2, 0.15],
  layRot = [-Math.PI / 2, 0, 0], // inner: tip the standing model onto the bed
  rollRot = [0, 0, Math.PI / 2], // outer: roll from side onto the back
  lUpperarm = [0, 0, -1.4], // arm-down (relative to bind pose)
  rUpperarm = [0, 0, 1.4],
  // Gentle pronation split between forearm and wrist (+Y bone axis) — palms
  // angle toward the mattress without over-twisting the joints.
  lForearm = [0, 0.42, 0],
  rForearm = [0, -0.42, 0],
  lHand = [0, 0.42, 0],
  rHand = [0, -0.42, 0],
  neck = [0.4, 0, 0], // flex the neck to lift the head onto the pillow
}) {
  const { scene } = useGLTF('/models/patient.glb')
  const materials = useRef([])

  const { scale, offset } = useMemo(() => {
    // Bounds measured offline — Box3.setFromObject is unreliable on skinned
    // meshes (it can include the skeleton), which throws off scale/centering.
    const SIZE = [0.18, 0.99, 1.0]
    const CENTER = [0, 0.495, 0]
    const s = targetLength / Math.max(...SIZE)
    const mats = []
    scene.traverse((m) => {
      if (m.isMesh || m.isSkinnedMesh) {
        m.castShadow = true
        m.receiveShadow = true
        m.frustumCulled = false
        for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
          if (mat) mats.push(mat)
        }
      }
    })
    materials.current = mats
    return { scale: s, offset: [-CENTER[0] * s, -CENTER[1] * s, -CENTER[2] * s] }
  }, [scene, targetLength])

  // SpO2 heatmap: multiply the skin texture by a tint that goes bluish
  // (cyanosis) as saturation drops. The model shares one material, so this
  // washes the whole patient slightly blue under hypoxia.
  useFrame(() => {
    const spo2 = useVitals.getState().current.spo2
    const t = THREE.MathUtils.clamp((94 - spo2) / 14, 0, 1)
    _tint.setRGB(1 - 0.5 * t, 1 - 0.38 * t, 1 - 0.08 * t)
    for (const m of materials.current) m.color.copy(_tint)
  })

  // Pose the arms: rotate the upper-arm bones relative to their bind pose.
  useMemo(() => {
    const pose = (name, e) => {
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

  return (
    <group position={pos}>
      {/* Nested so rotation order is explicit: roll (outer, applied last) then
          lay-down (inner, applied first), then the fit (scale + recenter). */}
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
