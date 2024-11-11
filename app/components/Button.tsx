'use client'

import React from 'react'
import { Icon } from 'react-feather'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: Icon
  label?: string
  iconFill?: boolean
  iconPosition?: 'start' | 'end'
  iconColor?: 'red' | 'green' | 'grey'
  buttonStyle?: 'regular' | 'action' | 'alert' | 'flush'
}

export default function ({ label = 'Okay', icon = void 0, iconPosition = 'start', iconColor = void 0, iconFill = false, buttonStyle = 'regular', ...rest }: ButtonProps) {
  const EndIcon = iconPosition === 'end' ? icon : null
  const StartIcon = iconPosition === 'start' ? icon : null
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
