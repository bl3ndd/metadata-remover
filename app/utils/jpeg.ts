export interface StripOptions {
  removeExif?: boolean
  removeXmp?: boolean
  keepIcc?: boolean
  resetOrientation?: boolean
}

export function describeStripPlan(options: StripOptions) {
  const tasks: string[] = []
  if (options.removeExif) tasks.push('Удаление EXIF')
  if (options.removeXmp) tasks.push('Удаление XMP/IPTC')
  if (!options.keepIcc) tasks.push('Удаление ICC профиля')
  if (options.resetOrientation) tasks.push('Сброс ориентации')
  return tasks
}
