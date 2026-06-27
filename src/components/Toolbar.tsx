import { useFrameStore, BASELINK_ID } from '../store/frameStore'

export function Toolbar() {
  const mode = useFrameStore((s) => s.mode)
  const selectedId = useFrameStore((s) => s.selectedId)
  const setMode = useFrameStore((s) => s.setMode)
  const addFrame = useFrameStore((s) => s.addFrame)
  const removeFrame = useFrameStore((s) => s.removeFrame)
  const exportJson = useFrameStore((s) => s.exportJson)

  const handleExport = () => {
    const json = exportJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'frames.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="toolbar">
      <button onClick={() => addFrame(selectedId)}>+ 新建子坐标系</button>
      <button className={mode === 'translate' ? 'active' : ''} onClick={() => setMode('translate')}>
        平移
      </button>
      <button className={mode === 'rotate' ? 'active' : ''} onClick={() => setMode('rotate')}>
        旋转
      </button>
      <button
        disabled={selectedId === BASELINK_ID}
        onClick={() => removeFrame(selectedId)}
      >
        删除
      </button>
      <button onClick={handleExport}>导出 JSON</button>
      <span className="toolbar-hint">Shift+拖拽: 从选中坐标系创建子坐标系</span>
    </div>
  )
}
