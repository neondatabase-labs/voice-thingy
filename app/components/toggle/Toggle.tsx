'use client'

import { useEffect, useRef, useState } from 'react'

export function Toggle({
  defaultValue = false,
  values,
  labels,
  onChange = () => {},
}: {
  defaultValue?: string | boolean
  values?: string[]
  labels?: string[]
  onChange?: (isEnabled: boolean, value: string) => void
}) {
  if (typeof defaultValue === 'string') defaultValue = !!Math.max(0, (values || []).indexOf(defaultValue))
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState<boolean>(defaultValue)

  const toggleValue = () => {
    const v = !value
    const index = +v
    setValue(v)
    onChange(v, (values || [])[index])
  }
  useEffect(() => {
    const leftEl = leftRef.current
    const rightEl = rightRef.current
    const bgEl = bgRef.current
    if (leftEl && rightEl && bgEl) {
      if (value) {
        bgEl.style.left = rightEl.offsetLeft + 'px'
        bgEl.style.width = rightEl.offsetWidth + 'px'
      } else {
        bgEl.style.left = ''
        bgEl.style.width = leftEl.offsetWidth + 'px'
      }
    }
  }, [value])
  return (
    <div onClick={toggleValue}>
      {labels && <div ref={leftRef}>{labels[0]}</div>}
      {labels && <div ref={rightRef}>{labels[1]}</div>}
      <div ref={bgRef}></div>
    </div>
  )
}
