"use client"

import { createContext, useCallback, useContext, useState } from "react"

export type ToastType = "success" | "error" | "info" | "warning"

interface Toast {
  id: number
  type: ToastType
  message: string
  detail?: string
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (type: ToastType, message: string, detail?: string) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((type: ToastType, message: string, detail?: string) => {
    const id = ++nextId
    setToasts((prev) => [...prev, { id, type, message, detail }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
}

const COLORS: Record<ToastType, string> = {
  success: "border-emerald-500/40 bg-emerald-950/80 text-emerald-300",
  error: "border-red-500/40 bg-red-950/80 text-red-300",
  info: "border-blue-500/40 bg-blue-950/80 text-blue-300",
  warning: "border-amber-500/40 bg-amber-950/80 text-amber-300",
}

const ICON_COLORS: Record<ToastType, string> = {
  success: "bg-emerald-500/20 text-emerald-400",
  error: "bg-red-500/20 text-red-400",
  info: "bg-blue-500/20 text-blue-400",
  warning: "bg-amber-500/20 text-amber-400",
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-4 right-4 z-[300] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 shadow-xl backdrop-blur-sm animate-in slide-in-from-right-5 ${COLORS[t.type]}`}
        >
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${ICON_COLORS[t.type]}`}>
            {ICONS[t.type]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium">{t.message}</p>
            {t.detail && <p className="text-[10px] opacity-70 mt-0.5">{t.detail}</p>}
          </div>
          <button onClick={() => onDismiss(t.id)} className="shrink-0 text-xs opacity-50 hover:opacity-100">&times;</button>
        </div>
      ))}
    </div>
  )
}
