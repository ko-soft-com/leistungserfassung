import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Field from '../components/Field'
import Button from '../components/Button'
import styles from './RegisterPage.module.css'

interface RegisterPageProps {
  onSwitchToLogin: () => void
}

function authErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Diese E-Mail ist bereits registriert. Bitte melde dich an.'
    case 'auth/weak-password':
      return 'Das Passwort muss mindestens 6 Zeichen lang sein.'
    case 'auth/invalid-email':
      return 'Ungültige E-Mail-Adresse.'
    default:
      return 'Registrierung fehlgeschlagen. Bitte versuche es erneut.'
  }
}

export default function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.')
      return
    }
    setLoading(true)
    try {
      await signUp(email, password)
    } catch (err: any) {
      setError(authErrorMessage(err?.code ?? ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <h1 className={styles.title}>Registrieren</h1>
        <p className={styles.subtitle}>Leistungserfassung</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Field
            label="E-Mail"
            type="email"
            value={email}
            onChange={setEmail}
            required
          />
          <Field
            label="Passwort"
            type="password"
            value={password}
            onChange={setPassword}
          />
          <Field
            label="Passwort bestätigen"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <Button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Registrieren…' : 'Registrieren'}
          </Button>
        </form>
        <p className={styles.switchText}>
          Bereits registriert?{' '}
          <button type="button" className={styles.switchLink} onClick={onSwitchToLogin}>
            Anmelden
          </button>
        </p>
      </div>
    </div>
  )
}
