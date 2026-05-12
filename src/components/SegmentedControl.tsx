import styles from './SegmentedControl.module.css'

interface Option {
  label: string
  value: string
}

interface SegmentedControlProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
}

export default function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div className={styles.container}>
      {options.map(opt => (
        <button
          key={opt.value}
          className={[styles.btn, opt.value === value ? styles.active : ''].filter(Boolean).join(' ')}
          onClick={() => onChange(opt.value)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
