// Live Activity Tracking
const LIVE_ACTIVITY_KEY = "hcs_live_activity_enabled"
const CUSTOMER_ACTIVITY_KEY = "hcs_customer_activities"

export interface CustomerActivity {
  customerId: string
  customerName: string
  companyName: string
  currentPage: string
  lastActiveAt: string
  isOnline: boolean
}

// Settings
export function isLiveActivityEnabled(): boolean {
  try {
    return JSON.parse(localStorage.getItem(LIVE_ACTIVITY_KEY) ?? "true")
  } catch {
    return true
  }
}

export function setLiveActivityEnabled(enabled: boolean): void {
  localStorage.setItem(LIVE_ACTIVITY_KEY, JSON.stringify(enabled))
}

// Activity tracking (server-side would store this)
export function getCustomerActivities(): CustomerActivity[] {
  try {
    const activities = JSON.parse(localStorage.getItem(CUSTOMER_ACTIVITY_KEY) ?? "[]")
    // Filter out offline customers (no activity for 2 minutes)
    const now = new Date().getTime()
    const twoMinutesAgo = now - 2 * 60 * 1000
    return activities.filter((a: CustomerActivity) => {
      const lastActive = new Date(a.lastActiveAt).getTime()
      return lastActive > twoMinutesAgo
    })
  } catch {
    return []
  }
}

export function updateCustomerActivity(
  customerId: string,
  customerName: string,
  companyName: string,
  currentPage: string
): void {
  if (!isLiveActivityEnabled()) return

  try {
    const activities = JSON.parse(localStorage.getItem(CUSTOMER_ACTIVITY_KEY) ?? "[]")
    const existingIndex = activities.findIndex((a: CustomerActivity) => a.customerId === customerId)
    const now = new Date().toISOString()

    const activity: CustomerActivity = {
      customerId,
      customerName,
      companyName,
      currentPage,
      lastActiveAt: now,
      isOnline: true,
    }

    if (existingIndex >= 0) {
      activities[existingIndex] = activity
    } else {
      activities.push(activity)
    }

    localStorage.setItem(CUSTOMER_ACTIVITY_KEY, JSON.stringify(activities))
  } catch {
    // Silently fail
  }
}

export function clearCustomerActivity(customerId: string): void {
  try {
    const activities = JSON.parse(localStorage.getItem(CUSTOMER_ACTIVITY_KEY) ?? "[]")
    const filtered = activities.filter((a: CustomerActivity) => a.customerId !== customerId)
    localStorage.setItem(CUSTOMER_ACTIVITY_KEY, JSON.stringify(filtered))
  } catch {
    // Silently fail
  }
}
