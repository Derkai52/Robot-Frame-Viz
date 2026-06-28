import { create } from 'zustand'
import { Matrix4 } from 'three'
import type { FrameNode, TransformMode, Vec3 } from '../types/frame'
import { computeWorldMatrices, matrix4ToRpyDeg } from '../math/transforms'
import { exportFramesYaml } from '../math/exportYaml'
import { importFramesYaml, syncFrameCounterFromFrames } from '../math/importYaml'

export const BASELINK_ID = 'baselink'

const BASE_FRAME: FrameNode = {
  id: BASELINK_ID,
  name: 'baselink',
  parentId: null,
  position: [0, 0, 0],
  rotation: [0, 0, 0],
}

let frameCounter = 0

function nextFrameName(): string {
  frameCounter += 1
  return `frame_${frameCounter}`
}

function collectDescendants(frames: Record<string, FrameNode>, id: string): string[] {
  const ids = [id]
  Object.values(frames).forEach((f) => {
    if (f.parentId === id) ids.push(...collectDescendants(frames, f.id))
  })
  return ids
}

interface FrameStore {
  frames: Record<string, FrameNode>
  selectedId: string
  mode: TransformMode
  isDragging: boolean
  worldMatrices: Record<string, Matrix4>
  setSelectedId: (id: string) => void
  setMode: (mode: TransformMode) => void
  setIsDragging: (v: boolean) => void
  addFrame: (parentId: string, position?: Vec3) => string
  updateFrame: (id: string, patch: Partial<Pick<FrameNode, 'name' | 'position' | 'rotation'>>) => void
  updateFrameFromWorld: (id: string, worldMatrix: Matrix4) => void
  removeFrame: (id: string) => void
  exportYaml: () => string
  importYaml: (text: string) => void
  recompute: () => void
}

function recomputeWorld(frames: Record<string, FrameNode>) {
  return computeWorldMatrices(frames)
}

export const useFrameStore = create<FrameStore>((set, get) => ({
  frames: { [BASELINK_ID]: BASE_FRAME },
  selectedId: BASELINK_ID,
  mode: 'translate',
  isDragging: false,
  worldMatrices: recomputeWorld({ [BASELINK_ID]: BASE_FRAME }),

  setSelectedId: (id) => set({ selectedId: id }),

  setMode: (mode) => set({ mode }),

  setIsDragging: (v) => set({ isDragging: v }),

  addFrame: (parentId, position = [0, 0, 0]) => {
    const id = crypto.randomUUID()
    const frame: FrameNode = {
      id,
      name: nextFrameName(),
      parentId,
      position,
      rotation: [0, 0, 0],
    }
    set((s) => {
      const frames = { ...s.frames, [id]: frame }
      return { frames, selectedId: id, worldMatrices: recomputeWorld(frames) }
    })
    return id
  },

  updateFrame: (id, patch) => {
    set((s) => {
      const frames = { ...s.frames, [id]: { ...s.frames[id], ...patch } }
      return { frames, worldMatrices: recomputeWorld(frames) }
    })
  },

  updateFrameFromWorld: (id, worldMatrix) => {
    const { frames } = get()
    const frame = frames[id]
    if (!frame) return
    let localMatrix = worldMatrix.clone()
    if (frame.parentId) {
      const parentWorld = get().worldMatrices[frame.parentId]
      localMatrix = parentWorld.clone().invert().multiply(worldMatrix)
    }
    const { position, rotation } = matrix4ToRpyDeg(localMatrix)
    get().updateFrame(id, { position, rotation })
  },

  removeFrame: (id) => {
    if (id === BASELINK_ID) return
    set((s) => {
      const toRemove = new Set(collectDescendants(s.frames, id))
      const frames = Object.fromEntries(
        Object.entries(s.frames).filter(([fid]) => !toRemove.has(fid)),
      )
      const selectedId = toRemove.has(s.selectedId) ? BASELINK_ID : s.selectedId
      return { frames, selectedId, worldMatrices: recomputeWorld(frames) }
    })
  },

  exportYaml: () => exportFramesYaml(get().frames),

  importYaml: (text) => {
    const frames = importFramesYaml(text)
    frameCounter = syncFrameCounterFromFrames(frames)
    set({ frames, selectedId: BASELINK_ID, worldMatrices: recomputeWorld(frames) })
  },

  recompute: () => {
    set((s) => ({ worldMatrices: recomputeWorld(s.frames) }))
  },
}))

export function getChildren(frames: Record<string, FrameNode>, parentId: string): FrameNode[] {
  return Object.values(frames).filter((f) => f.parentId === parentId)
}
