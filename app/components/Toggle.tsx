'use client'

import { useEffect, useRef, useState } from 'react'

export default function ({
  values,
  labels,
  onChange = () => {},
  defaultValue = false,
}: {
  values?: string[]
  labels?: string[]
  defaultValue?: string | boolean
  onChange?: (isEnabled: boolean, value: string) => void
}) {
  if (typeof defaultValue === 'string') defaultValue = !!Math.max(0, (values || []).indexOf(defaultValue))
  const bgRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState<boolean>(defaultValue)

  const toggleValue = () => {
    const v = !value
    const index = +v
    setValue(v)
    onChange(v, (values || [])[index])
  }

  useEffect(() => {
    const bgEl = bgRef.current
    const leftEl = leftRef.current
    const rightEl = rightRef.current
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
