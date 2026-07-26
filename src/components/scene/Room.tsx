// Floor + two walls of the ward - light clinical surfaces.
export default function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#dfe5ec" roughness={0.85} metalness={0.02} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 4, -6]} receiveShadow>
        <planeGeometry args={[24, 8]} />
        <meshStandardMaterial color="#eef2f7" roughness={1} />
      </mesh>

      {/* Side wall */}
      <mesh position={[-6, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[24, 8]} />
        <meshStandardMaterial color="#e7ecf2" roughness={1} />
      </mesh>

      {/* Faint floor grid */}
      <gridHelper args={[24, 24, '#c2ccd8', '#d6dde5']} position={[0, 0.02, 0]} />
    </group>
  )
}
