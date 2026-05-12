import styles from './Field.module.css'

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  mono?: boolean
  suggestion?: string
  error?: string
  multiline?: boolean
  readOnly?: boolean
  placeholder?: string
  id?: string
  rows?: number
}

export default function Field({ label, value, onChange, required, mono, suggestion, error, multiline, readOnly, placeholder, id, rows }: FieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  const cls = [styles.input, mono ? styles.mono : '', error ? styles.inputError : ''].filter(Boolean).join(' ')
  return (
    <div className={styles.wrapper}>
      <label htmlFor={inputId} className={styles.label}>
        {label}{required && <span className={styles.required}>*</span>}
      </label>
      <div className={styles.inputWrap}>
        {multiline ? (
          <textarea
            id={inputId}
            className={cls}
            value={value}
            onChange={e => onChange(e.target.value)}
            readOnly={readOnly}
            placeholder={placeholder}
            rows={rows ?? 2}
          />
        ) : (
          <input
            id={inputId}
            className={cls}
            value={value}
            onChange={e => onChange(e.target.value)}
            readOnly={readOnly}
            placeholder={placeholder}
          />
        )}
        {suggestion && <span className={styles.suggestion}>{suggestion}</span>}
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
