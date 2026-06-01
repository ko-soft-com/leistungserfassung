import { useState, useEffect } from 'react'
import { collection, getDocs, limit, query } from 'firebase/firestore'
import { db } from '../services/firebase'

export type FirestoreStatus = 'connected' | 'offline' | 'checking'

export function useFirestoreStatus(): FirestoreStatus {
  const [status, setStatus] = useState<FirestoreStatus>(
    navigator.onLine ? 'checking' : 'offline',
  )

  useEffect(() => {
    let cancelled = false

    async function probe() {
      if (!navigator.onLine) {
        if (!cancelled) setStatus('offline')
        return
      }
      if (!cancelled) setStatus('checking')
      try {
        await getDocs(query(collection(db, 'eintraege'), limit(1)))
        if (!cancelled) setStatus('connected')
      } catch {
        if (!cancelled) setStatus('offline')
      }
    }

    probe()

    const onOnline = () => probe()
    const onOffline = () => { if (!cancelled) setStatus('offline') }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      cancelled = true
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return status
}
