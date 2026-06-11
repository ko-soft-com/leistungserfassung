import type { ReactNode } from 'react'
import { Clock, Ticket, GitPullRequest, CheckSquare } from 'lucide-react'
import type { Page } from '../../types/page'
import styles from './AppSidebar.module.css'

interface AppSidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

const NAV_ITEMS: { page: Page; icon: ReactNode; label: string }[] = [
  { page: 'erfassung', icon: <Clock size={18} />,         label: 'Zeiterfassung' },
  { page: 'jira',      icon: <Ticket size={18} />,        label: 'Jira-Tickets' },
  { page: 'prs',       icon: <GitPullRequest size={18} />, label: 'Pull Requests' },
  { page: 'tasks',     icon: <CheckSquare size={18} />,   label: 'Aufgaben' },
]

export default function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      {NAV_ITEMS.map(({ page, icon, label }) => (
        <button
          key={page}
          type="button"
          className={[styles.item, currentPage === page ? styles.active : ''].filter(Boolean).join(' ')}
          onClick={() => onNavigate(page)}
          aria-label={label}
          aria-current={currentPage === page ? 'page' : undefined}
          title={label}
        >
          {icon}
        </button>
      ))}
    </aside>
  )
}
