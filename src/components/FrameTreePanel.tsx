import { useFrameStore, getChildren, BASELINK_ID } from '../store/frameStore'
import type { FrameNode } from '../types/frame'

function FrameTreeItem({ frame, depth }: { frame: FrameNode; depth: number }) {
  const frames = useFrameStore((s) => s.frames)
  const selectedId = useFrameStore((s) => s.selectedId)
  const setSelectedId = useFrameStore((s) => s.setSelectedId)
  const children = getChildren(frames, frame.id)

  return (
    <div>
      <div
        className={`tree-item ${selectedId === frame.id ? 'selected' : ''}`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => setSelectedId(frame.id)}
      >
        {frame.name}
        {frame.id === BASELINK_ID && ' (baselink)'}
      </div>
      {children.map((child) => (
        <FrameTreeItem key={child.id} frame={child} depth={depth + 1} />
      ))}
    </div>
  )
}

export function FrameTreePanel() {
  const baselink = useFrameStore((s) => s.frames.baselink)
  if (!baselink) return null
  return (
    <div className="panel">
      <h3>坐标系树</h3>
      <FrameTreeItem frame={baselink} depth={0} />
    </div>
  )
}
