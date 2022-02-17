const windowManager = {
  window: null,
  eventType: null,
}
export function openWindow({ url, eventType, name }) {
  const newWindow = window.open(url, name)
  if (eventType) {
    windowManager.window = newWindow
    windowManager.eventType = eventType
  }
}
export function closeWindow({ eventType } = {}) {
  if (windowManager.window && windowManager.eventType == eventType) {
    setTimeout(() => {
      windowManager.window && windowManager.window.close()
      windowManager.window = null
    }, 100)
  }
}
