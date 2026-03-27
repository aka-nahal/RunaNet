import { useCallback, useState } from "react"
import type { TileRead } from "@/lib/types"

const MAX_HISTORY = 50

export function useHistory() {
  const [past, setPast] = useState<TileRead[][]>([])
  const [future, setFuture] = useState<TileRead[][]>([])

  const push = useCallback((tiles: TileRead[]) => {
    setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), tiles])
    setFuture([])
  }, [])

  const undo = useCallback(
    (currentTiles: TileRead[]): TileRead[] | null => {
      if (past.length === 0) return null
      const prev = past[past.length - 1]
      setPast((p) => p.slice(0, -1))
      setFuture((f) => [...f, currentTiles])
      return prev
    },
    [past],
  )

  const redo = useCallback(
    (currentTiles: TileRead[]): TileRead[] | null => {
      if (future.length === 0) return null
      const next = future[future.length - 1]
      setFuture((f) => f.slice(0, -1))
      setPast((p) => [...p, currentTiles])
      return next
    },
    [future],
  )

  const reset = useCallback(() => {
    setPast([])
    setFuture([])
  }, [])

  return {
    push,
    undo,
    redo,
    reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  }
}
