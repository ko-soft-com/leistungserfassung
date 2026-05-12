import changelogRaw from '../../../CHANGELOG.md?raw'
import ChangelogDialog from './ChangelogDialog'
import styles from './AppFooter.module.css'

export default function AppFooter() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <span className={styles.copy}>Leistungserfassung · v{__APP_VERSION__}</span>
      <ChangelogDialog changelogRaw={changelogRaw} />
    </footer>
  )
}
