import { useState } from 'react'
import { Plus } from 'lucide-react'
import QuickAddJiraModal from './QuickAddJiraModal'
import QuickAddPrModal from './QuickAddPrModal'
import QuickAddTaskModal from './QuickAddTaskModal'
import QuickAddZeitModal from './QuickAddZeitModal'
import styles from './QuickAddBar.module.css'

type ModalType = 'zeit' | 'jira' | 'pr' | 'task' | null

export default function QuickAddBar() {
  const [openModal, setOpenModal] = useState<ModalType>(null)
  const close = () => setOpenModal(null)

  return (
    <div className={styles.bar}>
      <button className={styles.button} type="button" onClick={() => setOpenModal('zeit')}>
        <Plus size={13} /> Zeiterfassung
      </button>
      <button className={styles.button} type="button" onClick={() => setOpenModal('jira')}>
        <Plus size={13} /> Jira-Ticket
      </button>
      <button className={styles.button} type="button" onClick={() => setOpenModal('pr')}>
        <Plus size={13} /> Pull Request
      </button>
      <button className={styles.button} type="button" onClick={() => setOpenModal('task')}>
        <Plus size={13} /> Aufgabe
      </button>
      {openModal === 'zeit' && <QuickAddZeitModal onClose={close} />}
      {openModal === 'jira' && <QuickAddJiraModal onClose={close} />}
      {openModal === 'pr'   && <QuickAddPrModal   onClose={close} />}
      {openModal === 'task' && <QuickAddTaskModal onClose={close} />}
    </div>
  )
}
