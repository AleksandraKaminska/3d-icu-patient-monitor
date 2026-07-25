/**
 * Cannula — a small procedural IV cannula (tape dressing + luer connector) on
 * the back of the patient's hand, since the model has none. The IV line plugs
 * into the connector.
 */
export default function Cannula({ pos = [0, 0, 0], rot = [0, 0, 0] }) {
  return (
    <group position={pos} rotation={rot}>
      {/* Transparent tape dressing flat on the back of the hand */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.055, 0.006, 0.07]} />
        <meshStandardMaterial color="#eef1f4" transparent opacity={0.8} roughness={0.9} />
      </mesh>
      {/* Cannula hub + short luer connector where the tube attaches */}
      <mesh position={[0, 0.012, 0.01]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.009, 0.04, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.03, 0.02]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.02, 10]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
}
