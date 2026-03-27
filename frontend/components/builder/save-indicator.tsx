"use client"

export function SaveIndicator({
  saving,
  lastSaved,
  error,
}: {
  saving: boolean
  lastSaved: Date | null
  error: string | null
}) {
  if (error) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        Save failed
      </span>
    )
  }
  if (saving) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-zinc-500">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
        Saving&hellip;
      </span>
    )
  }
  if (lastSaved) {
    const ago = Math.round((Date.now() - lastSaved.getTime()) / 1000)
    const label = ago < 5 ? "just now" : ago < 60 ? `${ago}s ago` : `${Math.round(ago / 60)}m ago`
    return (
      <span className="flex items-center gap-1.5 text-xs text-zinc-600">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Saved {label}
      </span>
    )
  }
  return null
}
