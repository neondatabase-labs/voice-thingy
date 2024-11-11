'use client'

import React from 'react'
import { Icon } from 'react-feather'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  icon?: Icon
  iconPosition?: 'start' | 'end'
  iconColor?: 'red' | 'green' | 'grey'
  iconFill?: boolean
  buttonStyle?: 'regular' | 'action' | 'alert' | 'flush'
}

export function Button({ label = 'Okay', icon = void 0, iconPosition = 'start', iconColor = void 0, iconFill = false, buttonStyle = 'regular', ...rest }: ButtonProps) {
  const StartIcon = iconPosition === 'start' ? icon : null
  const EndIcon = iconPosition === 'end' ? icon : null
  return (
    <button {...rest}>
      {StartIcon && (
        <span>
          <StartIcon />
        </span>
      )}
      <span>{label}</span>
      {EndIcon && (
        <span>
          <EndIcon />
        </span>
      )}
    </button>
  )
}
