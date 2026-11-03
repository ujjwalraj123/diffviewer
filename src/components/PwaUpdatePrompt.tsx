import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function PwaUpdatePrompt() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showReadyToast, setShowReadyToast] = useState(false)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Periodically check for SW updates (every 60 min)
      if (registration) {
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.error('Service worker registration failed:', error)
    },
  })

  // Track online / offline status
  useEffect(() => {
    function handleOnline() {
      setIsOffline(false)
    }
    function handleOffline() {
      setIsOffline(true)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Show "ready for offline use" toast briefly
  useEffect(() => {
    if (offlineReady) {
      setShowReadyToast(true)
      const timer = setTimeout(() => {
        setShowReadyToast(false)
        setOfflineReady(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [offlineReady, setOfflineReady])

  async function applyUpdate() {
    setIsUpdating(true)
    setUpdateError('')
    try {
      await updateServiceWorker(true)
    } catch (error) {
      console.error('Service worker update failed:', error)
      setUpdateError('The update could not be applied. Please try again.')
      setIsUpdating(false)
    }
  }

  return (
    <>
      {/* Offline banner */}
      {isOffline && (
        <aside className="pwa-offline-banner" role="status" aria-live="polite">
          You are offline — DiffViewer is still fully functional.
        </aside>
      )}

      {/* Offline-ready toast */}
      {showReadyToast && !needRefresh && (
        <aside className="pwa-update-prompt" role="status" aria-live="polite">
          <p className="pwa-update-prompt__message">DiffViewer is ready to work offline.</p>
          <div className="pwa-update-prompt__actions">
            <button type="button" onClick={() => setShowReadyToast(false)}>
              OK
            </button>
          </div>
        </aside>
      )}

      {/* Update available prompt */}
      {needRefresh && (
        <aside className="pwa-update-prompt" role="status" aria-live="polite">
          <div>
            <p className="pwa-update-prompt__message">A new version of DiffViewer is ready.</p>
            {updateError && <p className="pwa-update-prompt__error">{updateError}</p>}
          </div>
          <div className="pwa-update-prompt__actions">
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              disabled={isUpdating}
            >
              Later
            </button>
            <button type="button" onClick={applyUpdate} disabled={isUpdating}>
              {isUpdating ? 'Updating…' : 'Update'}
            </button>
          </div>
        </aside>
      )}
    </>
  )
}
