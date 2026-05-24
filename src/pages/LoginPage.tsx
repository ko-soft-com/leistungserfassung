import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Field from '../components/Field'
import Button from '../components/Button'
import styles from './LoginPage.module.css'

interface LoginPageProps {
  onSwitchToRegister: () => void
}

function authErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'E-Mail oder Passwort ist falsch.'
    case 'auth/too-many-requests':
      return 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.'
    default:
      return 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.'
  }
}

export default function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err: any) {
      setError(authErrorMessage(err?.code ?? ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <h1 className={styles.title}>Anmelden</h1>
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
            required
          />
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <Button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Anmelden…' : 'Anmelden'}
          </Button>
        </form>
        <p className={styles.switchText}>
          Noch kein Konto?{' '}
          <button type="button" className={styles.switchLink} onClick={onSwitchToRegister}>
            Registrieren
          </button>
        </p>
      </div>
    </div>
  )
}
