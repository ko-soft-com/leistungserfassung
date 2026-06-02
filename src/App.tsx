import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppHeader from './features/header/AppHeader'
import ErfassungPage from './pages/ErfassungPage'
import AppFooter from './features/footer/AppFooter'
import ToastContainer from './components/ToastContainer'
import UpdateModal from './components/UpdateModal'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { useAuth } from './contexts/AuthContext'
import { useStopwatchNotification } from './hooks/useStopwatchNotification'
import type { UpdateStatus } from './types/electron'
import styles from './App.module.css'

const queryClient = new QueryClient()

function useUpdateModal() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<UpdateStatus | null>(null)

  useEffect(() => {
    const api = window.electronAPI
    if (!api) return
    api.onUpdateStatus((s) => setStatus(s as UpdateStatus))
    api.onTriggerUpdateCheck(() => {
      setStatus(null)
      setOpen(true)
      api.checkForUpdates()
    })
  }, [])

  function openAndCheck() {
    setStatus(null)
    setOpen(true)
    window.electronAPI?.checkForUpdates()
  }

  function install() {
    window.electronAPI?.installUpdate()
  }

  return { open, status, openAndCheck, install, close: () => setOpen(false) }
}

export default function App() {
  useStopwatchNotification()
  const { user, loading } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'register'>('login')
  const update = useUpdateModal()

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
        <ToastContainer />
        <UpdateModal
          open={update.open}
          status={update.status}
          onClose={update.close}
          onInstall={update.install}
        />
      </div>
    </QueryClientProvider>
  )
}
