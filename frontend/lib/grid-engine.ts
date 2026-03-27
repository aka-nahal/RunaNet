/**
 * Grid layout engine: cell coordinates (x,y) origin top-left, spans (w,h) in columns/rows.
 * Maps to CSS Grid placement: gridRow / gridColumn as start / end lines (1-based).
 */

export interface GridRect {
  x: number
  y: number
  w: number
  h: number
}

export interface GridSpec {
  cols: number
  rows: number
  gapPx: number
}

export function rectsOverlap(a: GridRect, b: GridRect): boolean {
  if (a.x + a.w <= b.x || b.x + b.w <= a.x) return false
  if (a.y + a.h <= b.y || b.y + b.h <= a.y) return false
  return true
}

export function isWithinBounds(rect: GridRect, spec: GridSpec): boolean {
  if (rect.x < 0 || rect.y < 0) return false
  if (rect.w < 1 || rect.h < 1) return false
  if (rect.x + rect.w > spec.cols) return false
  if (rect.y + rect.h > spec.rows) return false
  return true
}

export function collidesWithAny(rect: GridRect, others: GridRect[], excludeIndex?: number): boolean {
  return others.some((o, i) => i !== excludeIndex && rectsOverlap(rect, o))
}

/** Snap pixel delta to nearest cell given container inner size (excluding padding). */
export function snapPixelsToCells(params: {
  deltaXPx: number
  deltaYPx: number
  cellWidthPx: number
  cellHeightPx: number
}): { dx: number; dy: number } {
  const { deltaXPx, deltaYPx, cellWidthPx, cellHeightPx } = params
  if (cellWidthPx <= 0 || cellHeightPx <= 0) return { dx: 0, dy: 0 }
  return {
    dx: Math.round(deltaXPx / cellWidthPx),
    dy: Math.round(deltaYPx / cellHeightPx)
  }
}

/** CSS grid line indices (1-based): rowStart / colStart / rowEnd / colEnd */
export function rectToGridPlacement(rect: GridRect): {
  gridRow: string
  gridColumn: string
} {
  const rowStart = rect.y + 1
  const colStart = rect.x + 1
  const rowEnd = rect.y + rect.h + 1
  const colEnd = rect.x + rect.w + 1
  return {
    gridRow: `${rowStart} / ${rowEnd}`,
    gridColumn: `${colStart} / ${colEnd}`
  }
}

export function sortByPaintOrder<T extends { zIndex: number; id: number }>(tiles: T[]): T[] {
  return [...tiles].sort((a, b) => a.zIndex - b.zIndex || a.id - b.id)
}

// ---------------------------------------------------------------------------
// Alignment helpers (for multi-select align/distribute)
// ---------------------------------------------------------------------------

export function alignLeft(rects: GridRect[]): GridRect[] {
  const minX = Math.min(...rects.map((r) => r.x))
  return rects.map((r) => ({ ...r, x: minX }))
}

export function alignRight(rects: GridRect[], cols: number): GridRect[] {
  const maxRight = Math.max(...rects.map((r) => r.x + r.w))
  return rects.map((r) => ({ ...r, x: Math.min(cols - r.w, maxRight - r.w) }))
}

export function alignTop(rects: GridRect[]): GridRect[] {
  const minY = Math.min(...rects.map((r) => r.y))
  return rects.map((r) => ({ ...r, y: minY }))
}

export function alignBottom(rects: GridRect[], rows: number): GridRect[] {
  const maxBottom = Math.max(...rects.map((r) => r.y + r.h))
  return rects.map((r) => ({ ...r, y: Math.min(rows - r.h, maxBottom - r.h) }))
}

export function distributeH(rects: GridRect[]): GridRect[] {
  if (rects.length < 3) return rects
  const sorted = [...rects].sort((a, b) => a.x - b.x)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const totalSpan = (last.x + last.w) - first.x
  const totalTileW = sorted.reduce((s, r) => s + r.w, 0)
  const gap = (totalSpan - totalTileW) / (sorted.length - 1)
  let cx = first.x
  const result = sorted.map((r) => {
    const nr = { ...r, x: Math.round(cx) }
    cx += r.w + gap
    return nr
  })
  // Map back to original order
  return rects.map((r) => result.find((nr) => nr === result[sorted.indexOf(r)])!)
}

export function distributeV(rects: GridRect[]): GridRect[] {
  if (rects.length < 3) return rects
  const sorted = [...rects].sort((a, b) => a.y - b.y)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const totalSpan = (last.y + last.h) - first.y
  const totalTileH = sorted.reduce((s, r) => s + r.h, 0)
  const gap = (totalSpan - totalTileH) / (sorted.length - 1)
  let cy = first.y
  const result = sorted.map((r) => {
    const nr = { ...r, y: Math.round(cy) }
    cy += r.h + gap
    return nr
  })
  return rects.map((r) => result.find((nr) => nr === result[sorted.indexOf(r)])!)
}
