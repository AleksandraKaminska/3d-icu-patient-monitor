import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { Suspense } from 'react'
import Simulation from './Simulation.jsx'
import Room from './Room.jsx'
import Bed from './Bed.jsx'
import PatientModel from './PatientModel.jsx'
import Pillow from './Pillow.jsx'
import Cardiomonitor from './Cardiomonitor.jsx'
import Ventilator from './Ventilator.jsx'
import IVStand from './IVStand.jsx'
import Tubes from './Tubes.jsx'

/**
 * ICUScene — modular intensive-care room scene.
 * Each piece of equipment (bed, monitor, ventilator, IV stand) is its own component.
 */
export default function ICUScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [4.2, 2.6, 4.8], fov: 45 }}
      className="!absolute inset-0"
    >
      <color attach="background" args={['#0a0f1a']} />
      <fog attach="fog" args={['#0a0f1a', 12, 26]} />

      {/* Clinical lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-4, 3, -2]} intensity={20} color="#3b82f6" distance={12} />

      <Suspense fallback={null}>
        {/* Simulation driver — no visual element */}
        <Simulation />

        {/* Clean procedural room (floor + walls). */}
        <Room />

        {/* Hospital bed from a GLB asset (auto-fitted). */}
        <Bed targetLength={2.7} lift={0} />
        {/* Patient model (GLB). The procedural patient is kept as a fallback
            below — swap back if needed. */}
        <Pillow targetWidth={0.72} pos={[0, 1.13, -1.08]} />
        <PatientModel
          targetLength={2.3}
          pos={[0, 1.2, -0.1]}
          layRot={[-Math.PI / 2, 0, 0]}
          rollRot={[0, 0, Math.PI / 2]}
          neck={[-0.4, 0, 0]}
        />
        <Cardiomonitor position={[1.6, 0, -0.7]} rotation={[0, Math.PI, 0]} targetHeight={1.9} />
        <Ventilator position={[-2.2, 0, -1.0]} />
        <IVStand position={[-1.25, 0, -0.6]} rotation={[0, Math.PI, 0]} />
        <Tubes />

        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.5}
          scale={16}
          blur={2.4}
          far={6}
        />
        <Environment preset="city" />
      </Suspense>

      <OrbitControls
        target={[0, 1, 0]}
        minDistance={3}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2.05}
        enablePan={false}
      />
    </Canvas>
  )
}
