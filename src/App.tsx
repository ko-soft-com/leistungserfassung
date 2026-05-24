import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppHeader from './features/header/AppHeader'
import ErfassungPage from './pages/ErfassungPage'
import AppFooter from './features/footer/AppFooter'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { useAuth } from './contexts/AuthContext'
import styles from './App.module.css'

const queryClient = new QueryClient()

export default function App() {
  const { user, loading } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'register'>('login')

  if (loading) {
    return <div className={styles.appLoading}>Laden…</div>
  }

  if (!user) {
    return authView === 'login'
      ? <LoginPage onSwitchToRegister={() => setAuthView('register')} />
      : <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className={styles.shell}>
        <AppHeader />
        <div className={styles.body}>
          <ErfassungPage />
        </div>
        <AppFooter />
      </div>
    </QueryClientProvider>
  )
}
