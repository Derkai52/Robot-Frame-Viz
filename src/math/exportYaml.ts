import type { FrameNode, Vec3 } from '../types/frame'
import { computeLinkTransform } from './transforms'

function getChildren(frames: Record<string, FrameNode>, parentId: string): FrameNode[] {
  return Object.values(frames).filter((f) => f.parentId === parentId)
}

function fmt(n: number): number {
  return Math.round(n * 1e6) / 1e6
}

function fmtVec3(v: Vec3): string {
  return `[${v.map(fmt).join(', ')}]`
}

function fmtMatrixRows(R: number[][]): string[] {
  return R.map((row) => `      - [${row.map(fmt).join(', ')}]`)
}

export function exportFramesYaml(frames: Record<string, FrameNode>): string {
  const lines: string[] = ['structure:']

  for (const frame of Object.values(frames)) {
    const parentName = frame.parentId ? frames[frame.parentId].name : null
    const childNames = getChildren(frames, frame.id).map((c) => c.name)
    lines.push(`  ${frame.name}:`)
    lines.push(`    parent: ${parentName ?? 'null'}`)
    lines.push(`    children: [${childNames.join(', ')}]`)
  }

  lines.push('extrinsics:')
  for (const frame of Object.values(frames)) {
    if (!frame.parentId) continue
    const link = computeLinkTransform(frame)
    lines.push(`  ${frame.name}:`)
    lines.push(`    parent: ${frames[frame.parentId].name}`)
    lines.push(`    xyz: ${fmtVec3(frame.position)}`)
    lines.push(`    rpy: ${fmtVec3(frame.rotation)}`)
    lines.push('    R:')
    lines.push(...fmtMatrixRows(link.R))
    lines.push(`    t: ${fmtVec3(link.t)}`)
  }

  return lines.join('\n') + '\n'
}
