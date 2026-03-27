"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api-client"
import type { LayoutRead } from "@/lib/types"

// ---------------------------------------------------------------------------
// Resolution presets
// ---------------------------------------------------------------------------

const RESOLUTION_PRESETS = [
  { label: "Full HD", w: 1920, h: 1080, desc: "1920×1080 (16:9)" },
  { label: "QHD", w: 2560, h: 1440, desc: "2560×1440 (16:9)" },
  { label: "4K UHD", w: 3840, h: 2160, desc: "3840×2160 (16:9)" },
  { label: "Portrait FHD", w: 1080, h: 1920, desc: "1080×1920 (9:16)" },
  { label: "Ultrawide", w: 2560, h: 1080, desc: "2560×1080 (21:9)" },
  { label: "720p", w: 1280, h: 720, desc: "1280×720 (16:9)" },
] as const

const REFRESH_OPTIONS = [
  { label: "10 seconds", value: 10 },
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "2 minutes", value: 120 },
  { label: "5 minutes", value: 300 },
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSettings() {
  if (typeof window === "undefined") return { resW: 1920, resH: 1080, defaultCols: 12, defaultRows: 8, defaultGap: 8, refreshInterval: 30 }
  try {
    const raw = localStorage.getItem("snb-settings")
    if (raw) return JSON.parse(raw)
  } catch {}
  return { resW: 1920, resH: 1080, defaultCols: 12, defaultRows: 8, defaultGap: 8, refreshInterval: 30 }
}

function saveSettings(s: Record<string, number>) {
  localStorage.setItem("snb-settings", JSON.stringify(s))
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-zinc-200">{title}</h2>
      <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [layouts, setLayouts] = useState<LayoutRead[]>([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  const [settings, setSettings] = useState(getSettings)
  const [customResW, setCustomResW] = useState(settings.resW)
  const [customResH, setCustomResH] = useState(settings.resH)

  useEffect(() => {
    api.layouts.list().then(setLayouts).finally(() => setLoading(false))
  }, [])

  function updateSetting(key: string, value: number) {
    const next = { ...settings, [key]: value }
    setSettings(next)
    saveSettings(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function applyResolution(w: number, h: number) {
    const next = { ...settings, resW: w, resH: h }
    setSettings(next)
    setCustomResW(w)
    setCustomResH(h)
    saveSettings(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function setActiveLayout(layout: LayoutRead) {
    const ver = layout.versions[0]
    if (!ver) return
    try {
      await api.versions.publish(layout.id, ver.id)
      const lays = await api.layouts.list()
      setLayouts(lays)
    } catch (e) {
      console.error("Publish failed", e)
    }
  }

  const activeLayout = layouts.find((l) => l.versions.some((v) => v.is_published))
  const displayUrl = typeof window !== "undefined" ? `${window.location.origin}/display` : "/display"

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">Configure display and default preferences</p>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-900/30 px-3 py-1 text-xs text-emerald-400 border border-emerald-500/20 animate-in fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Saved
          </span>
        )}
      </div>

      <div className="space-y-8">
        {/* Display Resolution */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <SectionHeader title="Display Resolution" desc="Target resolution for the display screen. Affects how the layout is previewed." />
          <div className="grid grid-cols-3 gap-2 mb-4">
            {RESOLUTION_PRESETS.map((r) => {
              const isActive = settings.resW === r.w && settings.resH === r.h
              return (
                <button key={r.label} onClick={() => applyResolution(r.w, r.h)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                    isActive
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                      : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                  }`}>
                  <p className="text-xs font-medium">{r.label}</p>
                  <p className="text-[10px] opacity-60 mt-0.5">{r.desc}</p>
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">Custom:</span>
            <input type="number" value={customResW} min={320} max={7680}
              onChange={(e) => setCustomResW(+e.target.value)}
              className="w-20 rounded-md bg-zinc-800 px-2 py-1 text-sm text-zinc-200 outline-none border border-zinc-700 tabular-nums" />
            <span className="text-zinc-600">×</span>
            <input type="number" value={customResH} min={240} max={4320}
              onChange={(e) => setCustomResH(+e.target.value)}
              className="w-20 rounded-md bg-zinc-800 px-2 py-1 text-sm text-zinc-200 outline-none border border-zinc-700 tabular-nums" />
            <button onClick={() => applyResolution(customResW, customResH)}
              className="rounded-md bg-zinc-800 px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-700 border border-zinc-700">
              Apply
            </button>
          </div>
        </section>

        {/* Default Grid */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <SectionHeader title="Default Grid Settings" desc="Default values when creating new layouts" />
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500">Columns</span>
              <input type="number" value={settings.defaultCols} min={1} max={24}
                onChange={(e) => updateSetting("defaultCols", +e.target.value)}
                className="w-20 rounded-md bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 outline-none border border-zinc-700 tabular-nums" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500">Rows</span>
              <input type="number" value={settings.defaultRows} min={1} max={24}
                onChange={(e) => updateSetting("defaultRows", +e.target.value)}
                className="w-20 rounded-md bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 outline-none border border-zinc-700 tabular-nums" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500">Gap (px)</span>
              <input type="number" value={settings.defaultGap} min={0} max={32}
                onChange={(e) => updateSetting("defaultGap", +e.target.value)}
                className="w-20 rounded-md bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 outline-none border border-zinc-700 tabular-nums" />
            </label>
          </div>
        </section>

        {/* Refresh interval */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <SectionHeader title="Display Refresh Interval" desc="How often the live display checks for layout updates" />
          <div className="flex flex-wrap gap-2">
            {REFRESH_OPTIONS.map((opt) => {
              const isActive = settings.refreshInterval === opt.value
              return (
                <button key={opt.value} onClick={() => updateSetting("refreshInterval", opt.value)}
                  className={`rounded-lg border px-4 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  }`}>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </section>

        {/* Active Layout */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <SectionHeader title="Active Layout" desc="Choose which layout is displayed on screens" />
          {activeLayout && (
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-emerald-900/10 border border-emerald-500/20 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-emerald-300">Currently active: {activeLayout.name}</p>
                <p className="text-[10px] text-zinc-500">
                  {activeLayout.versions[0]?.grid_cols}×{activeLayout.versions[0]?.grid_rows} · {activeLayout.versions[0]?.tiles.length} tiles
                </p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {layouts.map((layout) => {
              const isActive = layout.versions.some((v) => v.is_published)
              const ver = layout.versions[0]
              return (
                <div key={layout.id}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                    isActive ? "border-emerald-500/30 bg-emerald-900/5" : "border-zinc-800"
                  }`}>
                  <div className="flex items-center gap-3">
                    {/* Mini preview */}
                    {ver && (
                      <div className="relative h-8 w-12 rounded border border-zinc-700 bg-zinc-900 overflow-hidden shrink-0">
                        {ver.tiles.map((t) => (
                          <div key={t.id} className="absolute bg-zinc-500/30 rounded-[1px]" style={{
                            left: `${(t.grid_x / ver.grid_cols) * 100}%`,
                            top: `${(t.grid_y / ver.grid_rows) * 100}%`,
                            width: `${(t.grid_w / ver.grid_cols) * 100}%`,
                            height: `${(t.grid_h / ver.grid_rows) * 100}%`,
                          }} />
                        ))}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{layout.name}</p>
                      {layout.description && <p className="text-[10px] text-zinc-500">{layout.description}</p>}
                    </div>
                  </div>
                  {isActive ? (
                    <span className="text-[10px] font-medium text-emerald-400">Active</span>
                  ) : (
                    <button onClick={() => setActiveLayout(layout)}
                      className="rounded-md bg-zinc-800 px-3 py-1 text-[11px] text-zinc-400 hover:bg-zinc-700 border border-zinc-700">
                      Make Active
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Display Access */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <SectionHeader title="Display Access" desc="Open this URL on your display screen" />
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded-lg bg-zinc-800 px-4 py-2.5 text-sm text-zinc-300 font-mono border border-zinc-700">
              {displayUrl}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(displayUrl) }}
              className="shrink-0 rounded-lg bg-zinc-800 px-4 py-2.5 text-xs text-zinc-400 hover:bg-zinc-700 border border-zinc-700">
              Copy URL
            </button>
            <a href="/display" target="_blank"
              className="shrink-0 rounded-lg bg-blue-600/10 border border-blue-500/20 px-4 py-2.5 text-xs font-medium text-blue-400 hover:bg-blue-600/20">
              Open Display &nearr;
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
