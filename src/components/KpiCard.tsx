import styles from './KpiCard.module.css'

interface KpiCardProps {
  label: string
  value: string
  sublabel: string
  progress: number
}

export default function KpiCard({ label, value, sublabel, progress }: KpiCardProps) {
  const pct = Math.min(100, Math.round(progress * 100))
  return (
    <div className={styles.card}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      <div className={styles.sublabel}>{sublabel}</div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
