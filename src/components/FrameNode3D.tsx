import { useEffect, useRef } from 'react'
import { Html } from '@react-three/drei'
import type { Group } from 'three'
import type { FrameNode } from '../types/frame'
import { useFrameStore, getChildren } from '../store/frameStore'

const DEG2RAD = Math.PI / 180

interface FrameNode3DProps {
  frame: FrameNode
  groupRefs: React.MutableRefObject<Record<string, Group>>
}

function AxisArrows() {
  const len = 0.04
  const r = 0.002
  return (
    <group>
      <mesh position={[len / 2, 0, 0]}>
        <boxGeometry args={[len, r * 2, r * 2]} />
        <meshBasicMaterial color="#e74c3c" />
      </mesh>
      <mesh position={[0, len / 2, 0]}>
        <boxGeometry args={[r * 2, len, r * 2]} />
        <meshBasicMaterial color="#2ecc71" />
      </mesh>
      <mesh position={[0, 0, len / 2]}>
        <boxGeometry args={[r * 2, r * 2, len]} />
        <meshBasicMaterial color="#3498db" />
      </mesh>
    </group>
  )
}

export function FrameNode3D({ frame, groupRefs }: FrameNode3DProps) {
  const frames = useFrameStore((s) => s.frames)
  const selectedId = useFrameStore((s) => s.selectedId)
  const isDragging = useFrameStore((s) => s.isDragging)
  const setSelectedId = useFrameStore((s) => s.setSelectedId)
  const children = getChildren(frames, frame.id)
  const isSelected = selectedId === frame.id
  const innerRef = useRef<Group>(null)

  useEffect(() => {
    const g = innerRef.current
    if (!g) return
    if (isDragging && selectedId === frame.id) return
    g.position.set(frame.position[0], frame.position[1], frame.position[2])
    g.rotation.set(
      frame.rotation[0] * DEG2RAD,
      frame.rotation[1] * DEG2RAD,
      frame.rotation[2] * DEG2RAD,
    )
  }, [frame.position, frame.rotation, isDragging, selectedId, frame.id])

  return (
    <group
      ref={(ref) => {
        innerRef.current = ref
        if (ref) groupRefs.current[frame.id] = ref
        else delete groupRefs.current[frame.id]
      }}
      onClick={(e) => {
        e.stopPropagation()
        setSelectedId(frame.id)
      }}
    >
      <AxisArrows />
      <Html center transform={false} style={{ pointerEvents: 'none' }}>
        <span
          style={{
            color: isSelected ? '#f39c12' : '#fff',
            fontSize: 10,
            fontWeight: isSelected ? 700 : 400,
            textShadow: '0 0 4px #000',
            whiteSpace: 'nowrap',
          }}
        >
          {frame.name}
        </span>
      </Html>
      {children.map((child) => (
        <FrameNode3D key={child.id} frame={child} groupRefs={groupRefs} />
      ))}
    </group>
  )
}

export function FrameTreeRenderer({
  groupRefs,
}: {
  groupRefs: React.MutableRefObject<Record<string, Group>>
}) {
  const baselink = useFrameStore((s) => s.frames.baselink)
  if (!baselink) return null
  return <FrameNode3D frame={baselink} groupRefs={groupRefs} />
}
