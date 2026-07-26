import type { Mesh } from 'three'

export type Vec3 = [number, number, number]

export type TextMesh = Mesh & { text: string }
