import { useState } from 'react'
import { X, Check } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import type { TimeEntry } from '../../types/entry'
import Field from '../../components/Field'
import Button from '../../components/Button'
import styles from './EditEntryDrawer.module.css'

interface EditEntryDrawerProps {
  entry: TimeEntry
  onSave: (updated: TimeEntry) => void
  onClose: () => void
}

export default function EditEntryDrawer({ entry, onSave, onClose }: EditEntryDrawerProps) {
  const [draft, setDraft] = useState({ ...entry })

  function setField<K extends keyof TimeEntry>(key: K, value: TimeEntry[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.drawer}>
          <div className={styles.header}>
            <Dialog.Title className={styles.title}>Eintrag bearbeiten</Dialog.Title>
            <Dialog.Close asChild>
              <button className={styles.closeBtn} aria-label="Schließen"><X size={16} /></button>
            </Dialog.Close>
          </div>

          <div className={styles.body}>
            <Field id="edit-auftraggeber" label="Auftraggeber" required value={draft.client} onChange={v => setField('client', v)} />
            <Field id="edit-orderNo" label="Auftragsnr." required value={draft.orderNo} onChange={v => setField('orderNo', v)} />
            <Field id="edit-zeitkonto" label="Zeitkonto" required value={draft.account} onChange={v => setField('account', v)} />
            <div className={styles.timeRow}>
              <Field id="edit-start" label="Start" mono value={draft.start} onChange={v => setField('start', v)} />
              <Field id="edit-ende" label="Ende" mono value={draft.end ?? ''} onChange={v => setField('end', v || null)} />
            </div>
            <Field id="edit-beschreibung" label="Beschreibung" multiline value={draft.description} onChange={v => setField('description', v)} />
            <div className={styles.refRow}>
              <Field id="edit-jira" label="JIRA-Ticket" mono value={draft.jira ?? ''} onChange={v => setField('jira', v || undefined)} />
              <Field id="edit-pr" label="Pull-Request" mono value={draft.pr ?? ''} onChange={v => setField('pr', v || undefined)} />
            </div>
          </div>

          <div className={styles.footer}>
            <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
            <Button variant="primary" onClick={() => { onSave(draft); onClose() }}>
              <Check size={13} /> Speichern
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
