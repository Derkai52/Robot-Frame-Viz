import { useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { Line } from '@react-three/drei'
import { Vector3 } from 'three'
import { useFrameStore } from '../store/frameStore'
import type { Vec3 } from '../types/frame'

export function DragCreateHandler() {
  const selectedId = useFrameStore((s) => s.selectedId)
  const addFrame = useFrameStore((s) => s.addFrame)
  const { camera, gl } = useThree()
  const dragging = useRef(false)
  const [linePoints, setLinePoints] = useState<[Vec3, Vec3] | null>(null)

  useEffect(() => {
    const dom = gl.domElement

    const getWorldPoint = (clientX: number, clientY: number): Vector3 | null => {
      const rect = dom.getBoundingClientRect()
      const x = ((clientX - rect.left) / rect.width) * 2 - 1
      const y = -((clientY - rect.top) / rect.height) * 2 + 1
      const origin = new Vector3(x, y, 0.5).unproject(camera)
      const dir = origin.sub(camera.position).normalize()
      const planeNormal = new Vector3(0, 0, 1)
      const denom = dir.dot(planeNormal)
      if (Math.abs(denom) < 1e-6) return null
      const t = -camera.position.dot(planeNormal) / denom
      if (t < 0) return null
      return camera.position.clone().add(dir.multiplyScalar(t))
    }

    const worldToLocal = (world: Vector3, parentId: string): Vec3 => {
      const worldMatrices = useFrameStore.getState().worldMatrices
      const inv = worldMatrices[parentId].clone().invert()
      const local = world.clone().applyMatrix4(inv)
      return [local.x, local.y, local.z]
    }

    const getParentWorldPos = (): Vec3 => {
      const worldMatrices = useFrameStore.getState().worldMatrices
      const pos = new Vector3().setFromMatrixPosition(worldMatrices[selectedId])
      return [pos.x, pos.y, pos.z]
    }

    const onPointerDown = (e: PointerEvent) => {
      if (!e.shiftKey || e.button !== 0) return
      dragging.current = true
      const start = getParentWorldPos()
      setLinePoints([start, start])
      e.preventDefault()
      e.stopPropagation()
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const pt = getWorldPoint(e.clientX, e.clientY)
      if (!pt) return
      const start = getParentWorldPos()
      setLinePoints([start, [pt.x, pt.y, pt.z]])
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging.current) return
      dragging.current = false
      setLinePoints(null)
      const pt = getWorldPoint(e.clientX, e.clientY)
      if (!pt) return
      const local = worldToLocal(pt, selectedId)
      const dist = Math.hypot(local[0], local[1], local[2])
      if (dist > 0.05) addFrame(selectedId, local)
    }

    dom.addEventListener('pointerdown', onPointerDown)
    dom.addEventListener('pointermove', onPointerMove)
    dom.addEventListener('pointerup', onPointerUp)
    return () => {
      dom.removeEventListener('pointerdown', onPointerDown)
      dom.removeEventListener('pointermove', onPointerMove)
      dom.removeEventListener('pointerup', onPointerUp)
    }
  }, [camera, gl, selectedId, addFrame])

  if (!linePoints) return null

  return <Line points={linePoints} color="#f39c12" lineWidth={2} />
}
