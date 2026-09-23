export interface AppNotification {
  id: string
  title: string
  body: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  link?: string
}

type Portal = 'customer' | 'office'

function key(portal: Portal) { return `hcs_notifications_${portal}` }

export function getNotifications(portal: Portal): AppNotification[] {
  try { return JSON.parse(localStorage.getItem(key(portal)) || '[]') } catch { return [] }
}

export function addNotification(portal: Portal, n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) {
  const all = getNotifications(portal)
  const notif: AppNotification = { ...n, id: `notif_${Date.now()}`, read: false, createdAt: new Date().toISOString() }
  localStorage.setItem(key(portal), JSON.stringify([notif, ...all].slice(0, 50)))
}

export function markRead(portal: Portal, id: string) {
  const all = getNotifications(portal).map(n => n.id === id ? { ...n, read: true } : n)
  localStorage.setItem(key(portal), JSON.stringify(all))
}

export function markAllRead(portal: Portal) {
  const all = getNotifications(portal).map(n => ({ ...n, read: true }))
  localStorage.setItem(key(portal), JSON.stringify(all))
}

export function clearNotifications(portal: Portal) {
  localStorage.removeItem(key(portal))
}
