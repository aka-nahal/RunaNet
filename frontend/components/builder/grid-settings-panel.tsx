"use client"

import type { GridSpec } from "@/lib/grid-engine"

// Common display resolutions as grid presets
const RESOLUTION_PRESETS = [
  { label: "HD (16:9)", cols: 16, rows: 9, icon: "🖥️" },
  { label: "Full HD (16:9)", cols: 16, rows: 9, icon: "🖥️" },
  { label: "Ultrawide (21:9)", cols: 21, rows: 9, icon: "🖥️" },
  { label: "4K (16:9)", cols: 16, rows: 9, icon: "📺" },
  { label: "Square (1:1)", cols: 12, rows: 12, icon: "⬜" },
  { label: "Portrait (9:16)", cols: 9, rows: 16, icon: "📱" },
  { label: "Tablet (4:3)", cols: 12, rows: 9, icon: "📱" },
  { label: "Banner (3:1)", cols: 18, rows: 6, icon: "📢" },
  { label: "Compact (12×8)", cols: 12, rows: 8, icon: "📋" },
  { label: "Large (24×16)", cols: 24, rows: 16, icon: "🗂️" },
] as const

interface Props {
  spec: GridSpec
  tileCount: number
  onUpdate: (patch: { grid_cols?: number; grid_rows?: number; gap_px?: number }) => void
}

function StepField({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-400 w-14">{label}</span>
      <div className="flex items-center rounded-md border border-zinc-700 overflow-hidden">
        <button onClick={() => value > min && onChange(value - 1)} disabled={value <= min}
          className="px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700 disabled:opacity-30 border-r border-zinc-700">&minus;</button>
        <input
          type="number" value={value} min={min} max={max}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10)
            if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)))
          }}
          className="w-12 bg-transparent px-1 py-1 text-center text-xs tabular-nums text-zinc-200 outline-none"
        />
        <button onClick={() => value < max && onChange(value + 1)} disabled={value >= max}
          className="px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700 disabled:opacity-30 border-l border-zinc-700">+</button>
      </div>
    </div>
  )
}

export function GridSettingsPanel({ spec, tileCount, onUpdate }: Props) {
  const currentAspect = `${spec.cols}:${spec.rows}`
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const g = gcd(spec.cols, spec.rows)
  const simplifiedAspect = `${spec.cols / g}:${spec.rows / g}`

  return (
    <div className="border-b border-zinc-800 bg-zinc-900/50">
      {/* Manual controls */}
      <div className="flex items-center gap-6 px-4 py-2.5">
        <StepField label="Columns" value={spec.cols} min={1} max={24} onChange={(v) => onUpdate({ grid_cols: v })} />
        <StepField label="Rows" value={spec.rows} min={1} max={24} onChange={(v) => onUpdate({ grid_rows: v })} />
        <StepField label="Gap (px)" value={spec.gapPx} min={0} max={32} onChange={(v) => onUpdate({ gap_px: v })} />

        <div className="ml-2 h-5 w-px bg-zinc-800" />

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="tabular-nums">{spec.cols * spec.rows} cells</span>
          <span>&middot;</span>
          <span className="tabular-nums">{tileCount} tiles</span>
          <span>&middot;</span>
          <span className="text-zinc-600">{simplifiedAspect} aspect</span>
        </div>
      </div>

      {/* Resolution presets */}
      <div className="flex items-center gap-1 border-t border-zinc-800/50 px-4 py-2 overflow-x-auto">
        <span className="mr-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 shrink-0">Presets</span>
        {RESOLUTION_PRESETS.map((preset) => {
          const isActive = spec.cols === preset.cols && spec.rows === preset.rows
          return (
            <button
              key={preset.label}
              onClick={() => onUpdate({ grid_cols: preset.cols, grid_rows: preset.rows })}
              className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] transition-colors ${
                isActive
                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                  : "text-zinc-400 hover:bg-zinc-800 border border-transparent hover:border-zinc-700"
              }`}
            >
              <span className="mr-1">{preset.icon}</span>
              {preset.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
