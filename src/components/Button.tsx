import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

export default function Button({ variant = 'primary', children, className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={[styles.btn, styles[variant], className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
