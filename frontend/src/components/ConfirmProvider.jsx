import { createContext, useCallback, useContext, useState } from 'react'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)

  const confirmAction = useCallback((message, title = 'Please confirm') => {
    return new Promise((resolve) => {
      setDialog({
        title,
        message,
        onConfirm: () => {
          setDialog(null)
          resolve(true)
        },
        onCancel: () => {
          setDialog(null)
          resolve(false)
        }
      })
    })
  }, [])

  return (
    <ConfirmContext.Provider value={confirmAction}>
      {children}
      {dialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-ink mb-2">{dialog.title}</h3>
            <p className="text-sm text-ink-muted mb-6">{dialog.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={dialog.onCancel}
                className="px-4 py-2 rounded-lg text-sm text-ink-muted hover:bg-canvas"
              >
                Cancel
              </button>
              <button
                onClick={dialog.onConfirm}
                className="px-4 py-2 rounded-md text-sm text-white bg-red-600 hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider')
  return ctx
}