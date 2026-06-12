import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppHeader from './features/header/AppHeader'
import QuickAddBar from './features/quick-add/QuickAddBar'
import AppSidebar from './features/header/AppSidebar'
import ErfassungPage from './pages/ErfassungPage'
import JiraPage from './features/jira/JiraPage'
import PullRequestsPage from './features/pull-requests/PullRequestsPage'
import TasksPage from './features/tasks/TasksPage'
import AppFooter from './features/footer/AppFooter'
import ToastContainer from './components/ToastContainer'
import UpdateModal from './components/UpdateModal'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { useAuth } from './contexts/AuthContext'
import { useStopwatchNotification } from './hooks/useStopwatchNotification'
import { useElectronUpdater } from './hooks/useElectronUpdater'
import type { Page } from './types/page'
import styles from './App.module.css'

const queryClient = new QueryClient()

export default function App() {
  useStopwatchNotification()
  const { user, loading } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'register'>('login')
  const [currentPage, setCurrentPage] = useState<Page>('erfassung')
  const update = useElectronUpdater()

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
        <QuickAddBar />
        <div className={styles.body}>
          <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
          {currentPage === 'erfassung' && <ErfassungPage />}
          {currentPage === 'jira' && <JiraPage />}
          {currentPage === 'prs' && <PullRequestsPage />}
          {currentPage === 'tasks' && <TasksPage />}
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
