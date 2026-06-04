import styles from './Field.module.css'

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  mono?: boolean
  suggestion?: string
  onSuggestionClick?: () => void
  error?: string
  multiline?: boolean
  readOnly?: boolean
  placeholder?: string
  id?: string
  rows?: number
  type?: string
  suggestions?: readonly string[]
}

export default function Field({ label, value, onChange, required, mono, suggestion, onSuggestionClick, error, multiline, readOnly, placeholder, id, rows, type, suggestions }: FieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  const listId = suggestions && suggestions.length > 0 ? `${inputId}-list` : undefined
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
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
          />
        ) : (
          <input
            id={inputId}
            type={type}
            className={cls}
            value={value}
            onChange={e => onChange(e.target.value)}
            readOnly={readOnly}
            placeholder={placeholder}
            list={listId}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
          />
        )}
        {listId && (
          <datalist id={listId}>
            {suggestions!.map(s => <option key={s} value={s} />)}
          </datalist>
        )}
        {suggestion && (
          onSuggestionClick
            ? <button type="button" className={`${styles.suggestion} ${styles.suggestionButton}`} onClick={onSuggestionClick}>{suggestion}</button>
            : <span className={styles.suggestion}>{suggestion}</span>
        )}
      </div>
      {error && <span id={`${inputId}-error`} className={styles.error}>{error}</span>}
    </div>
  )
}
