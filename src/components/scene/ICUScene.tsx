import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import { Suspense } from 'react'
import Simulation from '@/components/scene/Simulation'
import Room from '@/components/scene/Room'
import Bed from '@/components/scene/Bed'
import PatientModel from '@/components/scene/PatientModel'
import Pillow from '@/components/scene/Pillow'
import Cannula from '@/components/scene/Cannula'
import Cardiomonitor from '@/components/scene/Cardiomonitor'
import VentilatorModel from '@/components/scene/VentilatorModel'
import VentScreen from '@/components/scene/VentScreen'
import IVStand from '@/components/scene/IVStand'
import Tubes from '@/components/scene/Tubes'

/**
 * ICUScene - modular intensive-care room scene.
 * Each piece of equipment (bed, monitor, ventilator, IV stand) is its own component.
 */
export default function ICUScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [3.5, 2.3, 4.2], fov: 45 }}
      className="!absolute inset-0"
    >
      <color attach="background" args={['#e9eef4']} />
      <fog attach="fog" args={['#e9eef4', 14, 30]} />

      {/* Bright clinical lighting; hemisphere fill (no CDN Environment). */}
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#ffffff', '#c4cdd8', 0.65]} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      <Suspense fallback={null}>
        {/* Simulation driver - no visual element */}
        <Simulation />

        {/* Clean procedural room (floor + walls). */}
        <Room />

        {/* Hospital bed from a GLB asset (auto-fitted). */}
        <Bed targetLength={2.7} lift={0} />
        {/* Patient model (GLB). The procedural patient is kept as a fallback
            below - swap back if needed. */}
        <Pillow targetWidth={0.72} pos={[0, 1.13, -1.08]} />
        <PatientModel
          targetLength={2.3}
          pos={[0, 1.2, -0.1]}
          layRot={[-Math.PI / 2, 0, 0]}
          rollRot={[0, 0, Math.PI / 2]}
          neck={[-0.4, 0, 0]}
        />
        {/* IV cannula on the back of the patient's right hand (computed:
            wrist + fingers direction). */}
        <Cannula pos={[-0.337, 1.135, -0.14]} rot={[0, 0, 0]} />
        <Cardiomonitor position={[1.6, 0, -0.7]} rotation={[0, Math.PI, 0]} targetHeight={1.9} />
        <VentilatorModel targetHeight={1.7} position={[-1.45, 0, -1.15]} rotation={[0, -Math.PI / 2, 0]} />
        {/* Live ventilator screen, placed in world space onto the model's
            painted screen (tune pos/rot against a render). */}
        <VentScreen pos={[-1.47, 1.39, -1.13]} rot={[-0.33, 0, 0]} size={[0.26, 0.19]} />
        <IVStand position={[-1.25, 0, -0.6]} rotation={[0, Math.PI, 0]} />
        <Tubes />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.78} scale={16} blur={2} far={6} color="#334155" />
      </Suspense>

      <OrbitControls
        target={[0, 0.95, -0.05]}
        minDistance={3}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2.05}
        enablePan={false}
      />
    </Canvas>
  )
}
