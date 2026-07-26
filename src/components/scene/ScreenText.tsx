import { Text } from '@react-three/drei'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'
import { SCREEN_FONT } from '@/lib/font'
import type { TextMesh } from '@/types'

const ScreenText = forwardRef<TextMesh, ComponentPropsWithoutRef<typeof Text>>((props, ref) => (
  <Text ref={ref} font={SCREEN_FONT} {...props} />
))
ScreenText.displayName = 'ScreenText'
export default ScreenText
