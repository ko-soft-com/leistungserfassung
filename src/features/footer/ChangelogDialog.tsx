import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { parseChangelog } from './parseChangelog'
import type { ChangelogSection } from './parseChangelog'
import styles from './ChangelogDialog.module.css'

interface ChangelogDialogProps {
  changelogRaw: string
}

export default function ChangelogDialog({ changelogRaw }: ChangelogDialogProps) {
  const sections = parseChangelog(changelogRaw)

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className={styles.trigger} type="button">Was ist neu?</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content} aria-describedby={undefined}>
          <div className={styles.header}>
            <Dialog.Title className={styles.title}>Neuigkeiten</Dialog.Title>
            <Dialog.Close asChild>
              <button className={styles.closeBtn} aria-label="Schließen" type="button">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>
          <div className={styles.body}>
            {sections.map(section => (
              <ChangelogSectionView key={section.version} section={section} />
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function ChangelogSectionView({ section }: { section: ChangelogSection }) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{section.version}</h3>
      {section.groups.map(group => (
        <div key={group.heading} className={styles.group}>
          <h4 className={styles.groupHeading}>{group.heading}</h4>
          <ul className={styles.itemList}>
            {group.items.map((item, i) => (
              <li key={i} className={styles.item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
