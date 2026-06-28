import { Euler, Matrix4, Quaternion, Vector3 } from 'three'
import type { FrameNode, LinkTransform, Vec3 } from '../types/frame'

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

/** URDF/ROS rpy: fixed-axis Rx→Ry→Rz, Three.js equivalent order */
export const RPY_EULER_ORDER = 'ZYX' as const

export function rpyDegToMatrix4(rotation: Vec3, position: Vec3): Matrix4 {
  const m = new Matrix4()
  const euler = new Euler(
    rotation[0] * DEG2RAD,
    rotation[1] * DEG2RAD,
    rotation[2] * DEG2RAD,
    RPY_EULER_ORDER,
  )
  const q = new Quaternion().setFromEuler(euler)
  m.compose(new Vector3(...position), q, new Vector3(1, 1, 1))
  return m
}

export function matrix4ToRpyDeg(m: Matrix4): { position: Vec3; rotation: Vec3 } {
  const pos = new Vector3()
  const quat = new Quaternion()
  const scale = new Vector3()
  m.decompose(pos, quat, scale)
  const euler = new Euler().setFromQuaternion(quat, RPY_EULER_ORDER)
  return {
    position: [pos.x, pos.y, pos.z],
    rotation: [euler.x * RAD2DEG, euler.y * RAD2DEG, euler.z * RAD2DEG],
  }
}

export function computeWorldMatrices(frames: Record<string, FrameNode>): Record<string, Matrix4> {
  const result: Record<string, Matrix4> = {}
  const getWorld = (id: string): Matrix4 => {
    if (result[id]) return result[id]
    const frame = frames[id]
    const local = rpyDegToMatrix4(frame.rotation, frame.position)
    if (!frame.parentId) {
      result[id] = local.clone()
    } else {
      result[id] = getWorld(frame.parentId).clone().multiply(local)
    }
    return result[id]
  }
  Object.keys(frames).forEach(getWorld)
  return result
}

export function worldToLocal(parentWorld: Matrix4, childWorld: Matrix4): Matrix4 {
  return parentWorld.clone().invert().multiply(childWorld)
}

export function matrix4ToLinkTransform(m: Matrix4): LinkTransform {
  const e = m.elements
  const R = [
    [e[0], e[4], e[8]],
    [e[1], e[5], e[9]],
    [e[2], e[6], e[10]],
  ]
  const t: Vec3 = [e[12], e[13], e[14]]
  const T = [
    [e[0], e[4], e[8], e[12]],
    [e[1], e[5], e[9], e[13]],
    [e[2], e[6], e[10], e[14]],
    [e[3], e[7], e[11], e[15]],
  ]
  return { R, t, T }
}

export function computeLinkTransform(frame: FrameNode): LinkTransform {
  return matrix4ToLinkTransform(rpyDegToMatrix4(frame.rotation, frame.position))
}

export function computeExtrinsic(
  worldMatrices: Record<string, Matrix4>,
  fromId: string,
  toId: string,
): LinkTransform {
  const relative = worldMatrices[fromId].clone().invert().multiply(worldMatrices[toId])
  return matrix4ToLinkTransform(relative)
}

export function formatMatrix(rows: number[][]): string {
  return rows.map((row) => row.map((v) => v.toFixed(4)).join('\t')).join('\n')
}
