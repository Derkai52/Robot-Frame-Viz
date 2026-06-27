export type Vec3 = [number, number, number]

export interface FrameNode {
  id: string
  name: string
  parentId: string | null
  position: Vec3
  rotation: Vec3
}

export interface LinkTransform {
  R: number[][]
  t: Vec3
  T: number[][]
}

export type TransformMode = 'translate' | 'rotate'
