import { Home, List, Calendar, BarChart3, Settings } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import styles from './AppSidebar.module.css'

const items = [
  { icon: Home, label: 'Übersicht', href: '/dashboard' },
  { icon: List, label: 'Erfassung', href: '/erfassung' },
  { icon: Calendar, label: 'Kalender', href: '/kalender' },
  { icon: BarChart3, label: 'Berichte', href: '/berichte' },
  { icon: Settings, label: 'Einstellungen', href: '/einstellungen' },
]

interface AppSidebarProps {
  activeRoute?: string
}

export default function AppSidebar({ activeRoute = '/erfassung' }: AppSidebarProps) {
  return (
    <Tooltip.Provider delayDuration={300}>
      <aside className={styles.sidebar}>
        {items.map(({ icon: Icon, label, href }) => (
          <Tooltip.Root key={href}>
            <Tooltip.Trigger asChild>
              <a
                href={href}
                role="button"
                className={[styles.item, href === activeRoute ? styles.active : ''].filter(Boolean).join(' ')}
                aria-label={label}
              >
                <Icon size={17} />
              </a>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="right" className={styles.tooltip}>
                {label}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </aside>
    </Tooltip.Provider>
  )
}
