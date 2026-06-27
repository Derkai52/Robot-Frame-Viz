import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import type { Group } from 'three'
import { FrameTreeRenderer } from './FrameNode3D'
import { TransformControlsWrapper } from './TransformControlsWrapper'
import { DragCreateHandler } from './DragCreateHandler'

export function Scene() {
  const groupRefs = useRef<Record<string, Group>>({})
  const orbitRef = useRef<{ enabled: boolean } | null>(null)

  return (
    <Canvas
      camera={{ position: [4, 4, 3], fov: 50, up: [0, 0, 1] }}
      style={{ background: '#1a1a2e' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 10]} intensity={0.8} />
      <Grid
        infiniteGrid
        fadeDistance={30}
        cellColor="#444"
        sectionColor="#666"
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <axesHelper args={[1]} />
      <OrbitControls ref={orbitRef as never} makeDefault />
      <FrameTreeRenderer groupRefs={groupRefs} />
      <TransformControlsWrapper groupRefs={groupRefs} orbitRef={orbitRef} />
      <DragCreateHandler />
    </Canvas>
  )
}
