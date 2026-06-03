export const NOTIFICATIONS_REFRESH_EVENT = "notifications-refresh"

export function notifyNotificationsChanged(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_REFRESH_EVENT))
}
