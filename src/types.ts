import type { Mesh } from 'three'

export type Vec3 = [number, number, number]

/** drei's <Text> forwards a troika text mesh that exposes a mutable `text`. */
export type TextMesh = Mesh & { text: string }
