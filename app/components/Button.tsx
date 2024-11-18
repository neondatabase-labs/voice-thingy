'use client'

import clsx from 'clsx'
import React from 'react'
import { Icon } from 'react-feather'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: Icon | null
  label?: string
  iconFill?: boolean
  buttonStyle?: string
  iconPosition?: 'start' | 'end'
  iconColor?: 'red' | 'green' | 'grey'
}

export default function ({ label = 'Okay', icon = null, iconPosition = 'start', iconColor = void 0, iconFill = false, buttonStyle, ...rest }: ButtonProps) {
  const EndIcon = iconPosition === 'end' ? icon : null
  const StartIcon = iconPosition === 'start' ? icon : null
  return (
    <button {...rest} className={clsx('flex max-w-max flex-row items-center gap-x-2 rounded-md px-5 py-2', buttonStyle || 'bg-black text-white')}>
      {StartIcon && <StartIcon width={16} height={16} />}
      <span>{label}</span>
      {EndIcon && <EndIcon width={16} height={16} />}
    </button>
  )
}
