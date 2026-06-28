import { useRef } from 'react'
import { useFrameStore, BASELINK_ID } from '../store/frameStore'

export function Toolbar() {
  const mode = useFrameStore((s) => s.mode)
  const selectedId = useFrameStore((s) => s.selectedId)
  const setMode = useFrameStore((s) => s.setMode)
  const addFrame = useFrameStore((s) => s.addFrame)
  const removeFrame = useFrameStore((s) => s.removeFrame)
  const exportYaml = useFrameStore((s) => s.exportYaml)
  const importYaml = useFrameStore((s) => s.importYaml)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const yaml = exportYaml()
    const blob = new Blob([yaml], { type: 'application/x-yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'frames.yaml'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importYaml(reader.result as string)
      } catch (err) {
        alert(err instanceof Error ? err.message : '载入失败')
      }
      e.target.value = ''
    }
    reader.readAsText(file)
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
      <button onClick={() => fileRef.current?.click()}>载入 YAML</button>
      <input ref={fileRef} type="file" accept=".yaml,.yml" hidden onChange={handleImport} />
      <button onClick={handleExport}>导出 YAML</button>
      <span className="toolbar-hint">Shift+拖拽: 从选中坐标系创建子坐标系</span>
    </div>
  )
}
