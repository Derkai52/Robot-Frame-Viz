import { useState, useEffect } from 'react'
import { useFrameStore, BASELINK_ID } from '../store/frameStore'
import { computeExtrinsic, formatMatrix } from '../math/transforms'
import type { LinkTransform } from '../types/frame'

function MatrixBlock({ link }: { link: LinkTransform }) {
  return (
    <>
      <div className="matrix-block">
        <div className="matrix-title">旋转矩阵 R (3×3)</div>
        <pre>{formatMatrix(link.R)}</pre>
      </div>
      <div className="matrix-block">
        <div className="matrix-title">平移 t</div>
        <pre>{link.t.map((v) => v.toFixed(4)).join(', ')}</pre>
      </div>
      <div className="matrix-block">
        <div className="matrix-title">齐次变换 T (4×4)</div>
        <pre>{formatMatrix(link.T)}</pre>
      </div>
    </>
  )
}

export function LinkMatrixPanel() {
  const selectedId = useFrameStore((s) => s.selectedId)
  const frames = useFrameStore((s) => s.frames)
  const worldMatrices = useFrameStore((s) => s.worldMatrices)
  const frameList = Object.values(frames)

  const [customFromId, setCustomFromId] = useState(BASELINK_ID)
  const [customToId, setCustomToId] = useState(selectedId)

  useEffect(() => {
    setCustomToId(selectedId)
  }, [selectedId])

  const baselink = frames[BASELINK_ID]
  const selected = frames[selectedId]

  const defaultLink =
    selectedId !== BASELINK_ID
      ? computeExtrinsic(worldMatrices, BASELINK_ID, selectedId)
      : null

  const customLink = computeExtrinsic(worldMatrices, customFromId, customToId)

  return (
    <div className="panel">
      <h3>外参矩阵</h3>
      <div className="hint">坐标系 Z 轴朝上 (Z-up)</div>

      <div className="sub-panel">
        <div className="sub-title">默认: baselink → 当前选中</div>
        {selectedId === BASELINK_ID ? (
          <div className="hint">当前选中 baselink，外参为单位阵</div>
        ) : (
          <>
            <div className="hint">
              {baselink?.name} → {selected?.name}
            </div>
            {defaultLink && <MatrixBlock link={defaultLink} />}
          </>
        )}
      </div>

      <div className="sub-panel">
        <div className="sub-title">自定义: 任意两坐标系</div>
        <div className="field-row">
          <span className="field-label">From</span>
          <select
            className="full-input"
            value={customFromId}
            onChange={(e) => setCustomFromId(e.target.value)}
          >
            {frameList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <span className="field-label">To</span>
          <select
            className="full-input"
            value={customToId}
            onChange={(e) => setCustomToId(e.target.value)}
          >
            {frameList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="hint">
          {frames[customFromId]?.name} → {frames[customToId]?.name}
        </div>
        <MatrixBlock link={customLink} />
      </div>
    </div>
  )
}
