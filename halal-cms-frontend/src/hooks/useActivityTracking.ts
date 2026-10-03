import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { updateCustomerActivity, clearCustomerActivity, isLiveActivityEnabled } from "@/lib/liveActivity"

export function useActivityTracking() {
  const location = useLocation()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!isLiveActivityEnabled() || !user || user.role !== "customer") {
      return
    }

    // Send activity update immediately
    updateCustomerActivity(
      String(user.id || ""),
      user.name || "Unknown",
      (user as any).companyName || "Unknown Company",
      location.pathname
    )

    // Send updates every 15 seconds
    const interval = setInterval(() => {
      if (isLiveActivityEnabled() && user) {
        updateCustomerActivity(
          String(user.id || ""),
          user.name || "Unknown",
          (user as any).companyName || "Unknown Company",
          location.pathname
        )
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [location.pathname, user])

  // Clear activity on logout/unmount
  useEffect(() => {
    return () => {
      if (user && user.role === "customer") {
        clearCustomerActivity(String(user.id || ""))
      }
    }
  }, [user])
}
