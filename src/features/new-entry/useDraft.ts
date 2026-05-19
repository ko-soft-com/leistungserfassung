import { useState } from 'react'
import { format } from 'date-fns'
import type { TaskType, JiraIssueType } from '../../types/entry'

interface Draft {
  date: string
  start: string | null
  end: string
  client: string
  orderNo: string
  account: string
  task: TaskType
  description: string
  jira: string
  pr: string
  jiraIssueType: JiraIssueType | ''
}

type DraftErrors = Partial<Record<keyof Draft, string>>

export function roundTo5(date: Date): string {
  const m = date.getMinutes()
  const rounded = Math.round(m / 5) * 5
  const d = new Date(date)
  d.setMinutes(rounded % 60, 0, 0)
  if (rounded === 60) d.setHours(d.getHours() + 1)
  return format(d, 'HH:mm')
}

export function useDraft() {
  const now = new Date()
  const [draft, setDraft] = useState<Draft>({
    date: format(now, 'yyyy-MM-dd'),
    start: roundTo5(now),
    end: '',
    client: '',
    orderNo: '',
    account: '',
    task: 'Feature',
    description: '',
    jira: '',
    pr: '',
    jiraIssueType: '',
  })
  const [errors, setErrors] = useState<DraftErrors>({})

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: DraftErrors = {}
    if (!draft.client.trim()) errs.client = 'Pflichtfeld'
    if (!draft.orderNo.trim()) errs.orderNo = 'Pflichtfeld'
    if (!draft.account.trim()) errs.account = 'Pflichtfeld'
    if (draft.description.trim().length < 5) errs.description = 'Mindestens 5 Zeichen'
    if (draft.start && draft.end && draft.end <= draft.start) errs.end = 'Ende muss nach Start liegen'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function reset() {
    const n = new Date()
    setDraft({
      date: format(n, 'yyyy-MM-dd'),
      start: roundTo5(n),
      end: '',
      client: '',
      orderNo: '',
      account: '',
      task: 'Feature',
      description: '',
      jira: '',
      pr: '',
      jiraIssueType: '',
    })
    setErrors({})
  }

  return { draft, setField, errors, validate, reset }
}
