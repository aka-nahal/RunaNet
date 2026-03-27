import { useCallback, useState } from "react"

export function useSaveState() {
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const wrap = useCallback(
    async <T>(fn: () => Promise<T>, errorMsg = "Save failed"): Promise<T | undefined> => {
      setSaving(true)
      setSaveError(null)
      try {
        const result = await fn()
        setLastSaved(new Date())
        return result
      } catch (e) {
        console.error(errorMsg, e)
        setSaveError(errorMsg)
        return undefined
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  return { saving, saveError, lastSaved, wrap }
}
