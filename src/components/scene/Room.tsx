/**
 * Room - floor and two walls of the ward. Tuned to the app's editorial dark
 * palette: deep neutral surfaces with a faint clinical-teal accent grid.
 */
export default function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#0d1116" roughness={0.92} metalness={0.04} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 4, -6]} receiveShadow>
        <planeGeometry args={[24, 8]} />
        <meshStandardMaterial color="#12171e" roughness={1} />
      </mesh>

      {/* Side wall */}
      <mesh position={[-6, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[24, 8]} />
        <meshStandardMaterial color="#0f141a" roughness={1} />
      </mesh>

      {/* Subtle floor grid - faint teal to echo the UI accent */}
      <gridHelper args={[24, 24, '#245049', '#161d22']} position={[0, 0.02, 0]} />
    </group>
  )
}
