'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function () {
  const router = useRouter()
  useEffect(() => {
    toast('Creating a new conversation...')
    router.push(`/c/${performance.now()}_${Math.random()}`)
  }, [router])
  return null
}
