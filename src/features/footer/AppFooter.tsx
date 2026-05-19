import changelogRaw from '../../../CHANGELOG.md?raw'
import ChangelogDialog from './ChangelogDialog'
import styles from './AppFooter.module.css'

function calver(): string {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function AppFooter() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <span className={styles.copy}>Leistungserfassung · v{calver()}</span>
      <ChangelogDialog changelogRaw={changelogRaw} />
    </footer>
  )
}
