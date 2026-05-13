import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppHeader from './features/header/AppHeader'
import ErfassungPage from './pages/ErfassungPage'
import AppFooter from './features/footer/AppFooter'
import styles from './App.module.css'

const queryClient = new QueryClient()

export default function App() {
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
