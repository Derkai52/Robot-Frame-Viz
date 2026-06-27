import { useEffect, useRef } from 'react'
import { TransformControls } from '@react-three/drei'
import type { Group } from 'three'
import { Matrix4 } from 'three'
import { useFrameStore } from '../store/frameStore'

interface Props {
  groupRefs: React.MutableRefObject<Record<string, Group>>
  orbitRef: React.MutableRefObject<{ enabled: boolean } | null>
}

export function TransformControlsWrapper({ groupRefs, orbitRef }: Props) {
  const selectedId = useFrameStore((s) => s.selectedId)
  const mode = useFrameStore((s) => s.mode)
  const updateFrameFromWorld = useFrameStore((s) => s.updateFrameFromWorld)
  const setIsDragging = useFrameStore((s) => s.setIsDragging)
  const controlsRef = useRef<React.ComponentRef<typeof TransformControls>>(null)
  const target = groupRefs.current[selectedId]

  useEffect(() => {
    const ctrl = controlsRef.current
    if (!ctrl) return
    const onDraggingChanged = (e: { value: boolean }) => {
      setIsDragging(e.value)
      if (orbitRef.current) orbitRef.current.enabled = !e.value
      if (!e.value) {
        const obj = groupRefs.current[selectedId]
        if (!obj) return
        obj.updateMatrixWorld(true)
        updateFrameFromWorld(selectedId, new Matrix4().copy(obj.matrixWorld))
      }
    }
    const ctrlObj = ctrl as unknown as {
      addEventListener: (type: string, fn: (e: { value: boolean }) => void) => void
      removeEventListener: (type: string, fn: (e: { value: boolean }) => void) => void
    }
    ctrlObj.addEventListener('dragging-changed', onDraggingChanged)
    return () => {
      ctrlObj.removeEventListener('dragging-changed', onDraggingChanged)
    }
  }, [selectedId, groupRefs, orbitRef, updateFrameFromWorld, setIsDragging])

  if (!target) return null

  return (
    <TransformControls
      key={selectedId}
      ref={controlsRef}
      object={target}
      mode={mode}
      size={0.8}
    />
  )
}
