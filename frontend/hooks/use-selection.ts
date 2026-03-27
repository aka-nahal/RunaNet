import { useCallback, useState } from "react"

export function useSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const select = useCallback((id: number) => {
    setSelectedIds(new Set([id]))
  }, [])

  const deselect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const toggle = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback((ids: number[]) => {
    setSelectedIds(new Set(ids))
  }, [])

  const clear = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  return { selectedIds, select, deselect, toggle, selectAll, clear, setSelectedIds }
}
