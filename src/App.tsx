import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppHeader from './features/header/AppHeader'
import AppSidebar from './features/header/AppSidebar'
import ErfassungPage from './pages/ErfassungPage'
import styles from './App.module.css'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className={styles.shell}>
        <AppHeader />
        <div className={styles.body}>
          <AppSidebar activeRoute="/erfassung" />
          <ErfassungPage />
        </div>
      </div>
    </QueryClientProvider>
  )
}
