'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function () {
  const router = useRouter()
  useEffect(() => {
    router.push(`/c/${performance.now()}_${Math.random()}`)
  }, [])
  return
}
