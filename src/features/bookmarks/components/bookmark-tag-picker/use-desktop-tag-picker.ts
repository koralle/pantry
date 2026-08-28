import { useSyncExternalStore } from 'react'

const desktopQuery = '(min-width: 768px)'

function subscribe(onStoreChange: () => void): () => void {
  const media = globalThis.matchMedia(desktopQuery)
  media.addEventListener('change', onStoreChange)
  return () => {
    media.removeEventListener('change', onStoreChange)
  }
}

function getSnapshot(): boolean {
  return globalThis.matchMedia(desktopQuery).matches
}

function getServerSnapshot(): boolean {
  return true
}

export function useDesktopTagPicker(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
