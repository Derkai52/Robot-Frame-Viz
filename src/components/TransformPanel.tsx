import { useState, useEffect } from 'react'
import { useFrameStore } from '../store/frameStore'
import type { Vec3 } from '../types/frame'

function Vec3Input({
  label,
  value,
  onChange,
}: {
  label: string
  value: Vec3
  onChange: (v: Vec3) => void
}) {
  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      {(['X', 'Y', 'Z'] as const).map((axis, i) => (
        <input
          key={axis}
          type="number"
          step="0.01"
          value={value[i]}
          onChange={(e) => {
            const next = [...value] as Vec3
            next[i] = parseFloat(e.target.value) || 0
            onChange(next)
          }}
          onBlur={(e) => {
            const next = [...value] as Vec3
            next[i] = parseFloat(e.target.value) || 0
            onChange(next)
          }}
        />
      ))}
    </div>
  )
}

export function TransformPanel() {
  const selectedId = useFrameStore((s) => s.selectedId)
  const frame = useFrameStore((s) => s.frames[selectedId])
  const updateFrame = useFrameStore((s) => s.updateFrame)
  const [name, setName] = useState(frame?.name ?? '')
  const [position, setPosition] = useState<Vec3>(frame?.position ?? [0, 0, 0])
  const [rotation, setRotation] = useState<Vec3>(frame?.rotation ?? [0, 0, 0])

  useEffect(() => {
    if (!frame) return
    setName(frame.name)
    setPosition(frame.position)
    setRotation(frame.rotation)
  }, [frame])

  if (!frame) return null

  const parentName = frame.parentId
    ? useFrameStore.getState().frames[frame.parentId]?.name ?? frame.parentId
    : '(baselink)'

  return (
    <div className="panel">
      <h3>Transform</h3>
      <div className="field-row">
        <span className="field-label">名称</span>
        <input
          className="full-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => updateFrame(selectedId, { name })}
        />
      </div>
      <div className="hint">Parent: {parentName}</div>
      <div className="hint">RPY 约定: intrinsic XYZ (Roll-Pitch-Yaw, 度)</div>
      <Vec3Input
        label="位置"
        value={position}
        onChange={(v) => {
          setPosition(v)
          updateFrame(selectedId, { position: v })
        }}
      />
      <Vec3Input
        label="RPY"
        value={rotation}
        onChange={(v) => {
          setRotation(v)
          updateFrame(selectedId, { rotation: v })
        }}
      />
    </div>
  )
}
