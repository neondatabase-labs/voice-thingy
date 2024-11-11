'use client'

import { ConsolePage } from '@/components/ConsolePage'
import NoSSR from 'react-no-ssr'

export default function () {
  return (
    <NoSSR>
      <ConsolePage />
    </NoSSR>
  )
}
