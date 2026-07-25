/**
 * Room — floor and two walls of the ward. Neutral, clinically cool backdrop.
 */
export default function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#111a2b" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 4, -6]} receiveShadow>
        <planeGeometry args={[24, 8]} />
        <meshStandardMaterial color="#16233a" roughness={1} />
      </mesh>

      {/* Side wall */}
      <mesh position={[-6, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[24, 8]} />
        <meshStandardMaterial color="#132033" roughness={1} />
      </mesh>

      {/* Subtle floor grid */}
      <gridHelper args={[24, 24, '#1e3a5f', '#16283f']} position={[0, 0.02, 0]} />
    </group>
  )
}
