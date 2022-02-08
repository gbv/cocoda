const windowManager = {
  window: null,
  eventType: null,
}
export function openWindow({ url, eventType }) {
  windowManager.window = window.open(url)
  windowManager.eventType = eventType
}
export function closeWindow({ eventType } = {}) {
  if (windowManager.window && windowManager.eventType == eventType) {
    setTimeout(() => {
      windowManager.window && windowManager.window.close()
      windowManager.window = null
    }, 100)
  }
}
