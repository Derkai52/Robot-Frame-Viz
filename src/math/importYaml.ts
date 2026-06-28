import { load as loadYaml } from 'js-yaml'
import type { FrameNode, Vec3 } from '../types/frame'

const BASELINK_NAME = 'baselink'
const BASELINK_ID = 'baselink'

interface StructureNode {
  parent: string | null
  children: string[]
}

interface ExtrinsicNode {
  parent: string
  xyz: Vec3
  rpy: Vec3
  R?: number[][]
  t?: Vec3
}

interface YamlData {
  structure?: Record<string, StructureNode>
  extrinsics?: Record<string, ExtrinsicNode>
}

function asVec3(v: unknown, field: string): Vec3 {
  if (!Array.isArray(v) || v.length !== 3 || v.some((n) => typeof n !== 'number')) {
    throw new Error(`${field} 格式无效，应为 [x, y, z]`)
  }
  return [v[0], v[1], v[2]]
}

function isRootParent(parent: string | null | undefined): boolean {
  return parent == null || parent === 'null'
}

function buildStructureFromExtrinsics(
  extrinsics: Record<string, ExtrinsicNode>,
): Record<string, StructureNode> {
  const structure: Record<string, StructureNode> = {}

  for (const [name, ext] of Object.entries(extrinsics)) {
    structure[name] = { parent: ext.parent, children: [] }
  }

  for (const ext of Object.values(extrinsics)) {
    if (ext.parent && !structure[ext.parent]) {
      structure[ext.parent] = { parent: null, children: [] }
    }
  }

  for (const [name, node] of Object.entries(structure)) {
    if (node.parent && structure[node.parent]) {
      structure[node.parent].children.push(name)
    }
  }

  return structure
}

export function importFramesYaml(text: string): Record<string, FrameNode> {
  const data = loadYaml(text) as YamlData
  if (!data) throw new Error('YAML 为空')

  let structure = data.structure
  if (!structure || Object.keys(structure).length === 0) {
    if (!data.extrinsics || Object.keys(data.extrinsics).length === 0) {
      throw new Error('缺少 structure 或 extrinsics')
    }
    structure = buildStructureFromExtrinsics(data.extrinsics)
  }

  const names = Object.keys(structure)
  const roots = names.filter((n) => isRootParent(structure[n].parent))

  const hasBaselink = BASELINK_NAME in structure
  const useSingleRootAsBaselink = !hasBaselink && roots.length === 1
  const insertBaselink = !hasBaselink && roots.length > 1

  const nameToId: Record<string, string> = {}
  if (hasBaselink) {
    nameToId[BASELINK_NAME] = BASELINK_ID
  } else if (useSingleRootAsBaselink) {
    nameToId[roots[0]] = BASELINK_ID
  }
  for (const name of names) {
    if (!nameToId[name]) nameToId[name] = crypto.randomUUID()
  }

  const frames: Record<string, FrameNode> = {}

  if (insertBaselink) {
    frames[BASELINK_ID] = {
      id: BASELINK_ID,
      name: BASELINK_NAME,
      parentId: null,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    }
  }

  for (const [name, node] of Object.entries(structure)) {
    const id = nameToId[name]
    const isRoot = id === BASELINK_ID

    let parentId: string | null = null
    if (!isRoot) {
      const parentName = node.parent
      if (parentName && !isRootParent(parentName)) {
        parentId = nameToId[parentName]
        if (!parentId) throw new Error(`坐标系 ${name} 的 parent 无效: ${parentName}`)
      } else if (insertBaselink) {
        parentId = BASELINK_ID
      } else {
        throw new Error(`坐标系 ${name} 的 parent 无效: ${node.parent}`)
      }
    }

    const ext = data.extrinsics?.[name]
    frames[id] = {
      id,
      name,
      parentId,
      position: ext ? asVec3(ext.xyz, `${name}.xyz`) : [0, 0, 0],
      rotation: ext ? asVec3(ext.rpy, `${name}.rpy`) : [0, 0, 0],
    }
  }

  if (!frames[BASELINK_ID]) {
    throw new Error('无法确定根坐标系')
  }

  return frames
}

export function syncFrameCounterFromFrames(frames: Record<string, FrameNode>): number {
  let max = 0
  for (const f of Object.values(frames)) {
    const m = /^frame_(\d+)$/.exec(f.name)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return max
}
