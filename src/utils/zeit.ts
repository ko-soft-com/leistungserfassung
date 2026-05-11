export function roundUpTo15(minutes: number): number {
  return Math.ceil(minutes / 15) * 15
}

export function calcDauerFromZeit(
  start: string,
  end: string,
): { stunden: number; minuten: number } | null {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  if (diff <= 0) return null
  const rounded = roundUpTo15(diff)
  return { stunden: Math.floor(rounded / 60), minuten: rounded % 60 }
}
