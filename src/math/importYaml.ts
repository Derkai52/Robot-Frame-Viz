import { load as loadYaml } from 'js-yaml'
import type { FrameNode, Vec3 } from '../types/frame'

const BASELINK_NAME = 'baselink'

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
  structure: Record<string, StructureNode>
  extrinsics?: Record<string, ExtrinsicNode>
}

function asVec3(v: unknown, field: string): Vec3 {
  if (!Array.isArray(v) || v.length !== 3 || v.some((n) => typeof n !== 'number')) {
    throw new Error(`${field} 格式无效，应为 [x, y, z]`)
  }
  return [v[0], v[1], v[2]]
}

export function importFramesYaml(text: string): Record<string, FrameNode> {
  const data = loadYaml(text) as YamlData
  if (!data?.structure?.baselink) {
    throw new Error('缺少 structure.baselink')
  }

  const nameToId: Record<string, string> = { [BASELINK_NAME]: BASELINK_NAME }
  for (const name of Object.keys(data.structure)) {
    if (name !== BASELINK_NAME) nameToId[name] = crypto.randomUUID()
  }

  const frames: Record<string, FrameNode> = {}

  for (const [name, node] of Object.entries(data.structure)) {
    const id = nameToId[name]
    const parentId =
      name === BASELINK_NAME
        ? null
        : node.parent
          ? (nameToId[node.parent] ?? null)
          : null

    if (name !== BASELINK_NAME && !parentId) {
      throw new Error(`坐标系 ${name} 的 parent 无效: ${node.parent}`)
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
