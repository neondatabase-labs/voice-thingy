'use client'

import NoSSR from 'react-no-ssr'
import { ConsolePage } from './pages/ConsolePage'

export default function () {
  return (
    <NoSSR>
      <ConsolePage />
    </NoSSR>
  )
}
