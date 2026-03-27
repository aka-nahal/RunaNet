"use client"

import { useState } from "react"
import type { TileRead, TileUpdate, NoticeRead } from "@/lib/types"
import { TILE_TYPES } from "@/lib/types"
import type { GridSpec } from "@/lib/grid-engine"
import { ImageUpload } from "./image-upload"
import { VideoUpload, isYouTubeUrl } from "./video-upload"
import { parseSlides, stringifySlides, type CarouselSlide } from "@/components/carousel-widget"

const inputCls = "w-full rounded-md bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 border border-zinc-700 focus:border-blue-500/50"
const selectCls = inputCls

function Section({ label, children, defaultOpen = true }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex cursor-pointer items-center gap-1.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 select-none">
        <svg className="h-3 w-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {label}
      </summary>
      <div className="ml-1 space-y-2 pb-2">{children}</div>
    </details>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium text-zinc-500">{label}</span>
      {children}
    </label>
  )
}

function NumField({ label, value, min, max, onChange, disabled = false }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void; disabled?: boolean
}) {
  return (
    <Field label={label}>
      <input type="number" value={value} min={min} max={max} disabled={disabled}
        onChange={(e) => { const n = parseInt(e.target.value, 10); if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n))) }}
        className={inputCls + " tabular-nums"} />
    </Field>
  )
}

function ColorField({ label, value, onChange, disabled }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={value || "#ffffff"} disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded border border-zinc-700 bg-transparent disabled:opacity-50" />
        <input value={value} disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#ffffff"
          className={inputCls + " font-mono text-xs flex-1"} />
        {value && (
          <button onClick={() => onChange("")} disabled={disabled}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 disabled:opacity-30">&times;</button>
        )}
      </div>
    </Field>
  )
}

function parseConfig(raw: string | null): Record<string, unknown> {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

interface Props {
  tile: TileRead
  notices: NoticeRead[]
  spec: GridSpec
  isLocked: boolean
  onUpdate: (field: keyof TileUpdate, value: number | string | boolean | null) => void
  onDelete: () => void
  onMove: () => void
  onDuplicate: () => void
  onToggleLock: () => void
  onCreateNotice: (title: string, body: string) => void
}

export function TileInspector({ tile, notices, spec, isLocked, onUpdate, onDelete, onMove, onDuplicate, onToggleLock, onCreateNotice }: Props) {
  const config = parseConfig(tile.config_json)

  function updateConfig(key: string, value: string | number | undefined) {
    const c = { ...config }
    if (value === undefined || value === "") delete c[key]
    else c[key] = value
    const json = Object.keys(c).length > 0 ? JSON.stringify(c) : null
    onUpdate("config_json", json)
  }

  const [showNewNotice, setShowNewNotice] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newBody, setNewBody] = useState("")

  const type = tile.tile_type

  return (
    <div className="flex flex-col gap-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{TILE_TYPES.find((t) => t.value === type)?.icon ?? "?"}</span>
          <div>
            <p className="text-xs font-semibold text-zinc-300">Tile #{tile.id}</p>
            <p className="text-[10px] text-zinc-600">{tile.grid_w}&times;{tile.grid_h} at ({tile.grid_x},{tile.grid_y})</p>
          </div>
        </div>
        {isLocked && (
          <span className="rounded bg-amber-900/20 px-1.5 py-0.5 text-[9px] font-medium text-amber-400 border border-amber-500/20">
            Locked
          </span>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-1 mb-2">
        <button onClick={onMove} disabled={isLocked}
          className="flex-1 rounded-md bg-zinc-800 py-1.5 text-[10px] text-blue-400 hover:bg-zinc-700 disabled:opacity-30 border border-zinc-700 hover:border-blue-500/30 transition-colors">
          Move
        </button>
        <button onClick={onDuplicate}
          className="flex-1 rounded-md bg-zinc-800 py-1.5 text-[10px] text-zinc-400 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 transition-colors">
          Copy
        </button>
        <button onClick={onToggleLock}
          className="flex-1 rounded-md bg-zinc-800 py-1.5 text-[10px] text-amber-400 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500/30 transition-colors">
          {isLocked ? "Unlock" : "Lock"}
        </button>
        <button onClick={onDelete} disabled={isLocked}
          className="flex-1 rounded-md bg-zinc-800 py-1.5 text-[10px] text-red-400 hover:bg-red-900/20 disabled:opacity-30 border border-zinc-700 hover:border-red-500/30 transition-colors">
          Delete
        </button>
      </div>

      {/* Type selector */}
      <Field label="Tile Type">
        <select value={type} onChange={(e) => onUpdate("tile_type", e.target.value)} disabled={isLocked} className={selectCls}>
          {TILE_TYPES.map((tt) => <option key={tt.value} value={tt.value}>{tt.icon} {tt.label}</option>)}
        </select>
      </Field>

      {/* Content section */}
      <Section label="Content">
        {(type === "notice" || type === "event" || type === "emergency") && (
          <>
            <Field label="Assign Notice">
              <select value={tile.notice_id ?? ""} disabled={isLocked}
                onChange={(e) => { const v = e.target.value; onUpdate("notice_id", v ? Number(v) : null) }}
                className={selectCls}>
                <option value="">&mdash; none &mdash;</option>
                {notices.map((n) => <option key={n.id} value={n.id}>{n.title || `Notice #${n.id}`}</option>)}
              </select>
            </Field>
            {!showNewNotice ? (
              <button onClick={() => setShowNewNotice(true)} disabled={isLocked}
                className="rounded-md border border-dashed border-zinc-700 px-2 py-2 text-xs text-zinc-500 hover:border-blue-500/30 hover:text-blue-400 disabled:opacity-30 transition-colors">
                + Create new notice inline
              </button>
            ) : (
              <div className="rounded-md border border-zinc-700 bg-zinc-800/50 p-2.5 space-y-2">
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Notice title"
                  className={inputCls} />
                <textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Notice body text" rows={3}
                  className={inputCls} />
                <div className="flex gap-1">
                  <button disabled={!newTitle.trim()} onClick={() => {
                    onCreateNotice(newTitle.trim(), newBody.trim() || newTitle.trim())
                    setNewTitle(""); setNewBody(""); setShowNewNotice(false)
                  }} className="rounded-md bg-blue-600 px-3 py-1 text-[10px] text-white hover:bg-blue-500 disabled:opacity-30">
                    Create &amp; Assign
                  </button>
                  <button onClick={() => { setShowNewNotice(false); setNewTitle(""); setNewBody("") }}
                    className="rounded-md px-3 py-1 text-[10px] text-zinc-500 hover:bg-zinc-700">Cancel</button>
                </div>
              </div>
            )}
          </>
        )}

        {type === "ticker" && (
          <Field label="Ticker Text">
            <textarea value={(config.tickerText as string) ?? ""} disabled={isLocked}
              onChange={(e) => updateConfig("tickerText", e.target.value)}
              placeholder="Welcome to the Smart Notice Board..." rows={3}
              className={inputCls} />
          </Field>
        )}

        {type === "banner" && (
          <>
            <Field label="Banner Title">
              <input value={(config.bannerTitle as string) ?? ""} disabled={isLocked}
                onChange={(e) => updateConfig("bannerTitle", e.target.value)}
                placeholder="Smart Notice Board" className={inputCls} />
            </Field>
            <Field label="Subtitle">
              <input value={(config.bannerSubtitle as string) ?? ""} disabled={isLocked}
                onChange={(e) => updateConfig("bannerSubtitle", e.target.value)}
                placeholder="AI-Powered Campus Display" className={inputCls} />
            </Field>
          </>
        )}

        {type === "image" && (
          <>
            <ImageUpload
              currentMediaId={tile.media_id}
              currentImageUrl={(config.imageUrl as string) ?? null}
              disabled={isLocked}
              onSelectMedia={(mediaId) => {
                if (mediaId > 0) {
                  onUpdate("media_id", mediaId)
                  const c = { ...config }; delete c.imageUrl
                  const json = Object.keys(c).length > 0 ? JSON.stringify(c) : null
                  onUpdate("config_json", json)
                } else { onUpdate("media_id", null) }
              }}
              onSetImageUrl={(url) => {
                updateConfig("imageUrl", url || undefined)
                if (url) onUpdate("media_id", null)
              }}
            />
            <Field label="Alt Text">
              <input value={(config.imageAlt as string) ?? ""} disabled={isLocked}
                onChange={(e) => updateConfig("imageAlt", e.target.value)}
                placeholder="Description of image" className={inputCls} />
            </Field>
          </>
        )}

        {type === "video" && (
          <>
            <VideoUpload
              currentMediaId={tile.media_id}
              currentVideoUrl={(config.videoUrl as string) ?? null}
              disabled={isLocked}
              onSelectMedia={(mediaId) => {
                onUpdate("media_id", mediaId)
                const c = { ...config }; delete c.videoUrl
                const json = Object.keys(c).length > 0 ? JSON.stringify(c) : null
                onUpdate("config_json", json)
              }}
              onSetVideoUrl={(url) => {
                updateConfig("videoUrl", url || undefined)
                if (url) onUpdate("media_id", null)
              }}
              onClear={() => {
                onUpdate("media_id", null)
                const c = { ...config }; delete c.videoUrl
                const json = Object.keys(c).length > 0 ? JSON.stringify(c) : null
                onUpdate("config_json", json)
              }}
            />

            {/* YouTube indicator */}
            {(config.videoUrl as string) && isYouTubeUrl(config.videoUrl as string) && (
              <div className="rounded-md bg-red-900/10 border border-red-500/15 px-2.5 py-1.5 text-[10px] text-red-400">
                YouTube video will be embedded as an iframe on the display.
              </div>
            )}

            <Field label="Poster Image URL">
              <input value={(config.videoPoster as string) ?? ""} disabled={isLocked}
                onChange={(e) => updateConfig("videoPoster", e.target.value || undefined)}
                placeholder="Thumbnail shown before play" className={inputCls} />
            </Field>

            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mt-1">Playback Options</p>
            <div className="space-y-2 py-1">
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input type="checkbox" checked={config.videoAutoplay !== "false"} disabled={isLocked}
                  onChange={(e) => updateConfig("videoAutoplay", e.target.checked ? undefined : "false")}
                  className="rounded border-zinc-600 bg-zinc-800 text-pink-500 focus:ring-pink-500/50" />
                Autoplay (muted)
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input type="checkbox" checked={config.videoLoop !== "false"} disabled={isLocked}
                  onChange={(e) => updateConfig("videoLoop", e.target.checked ? undefined : "false")}
                  className="rounded border-zinc-600 bg-zinc-800 text-pink-500 focus:ring-pink-500/50" />
                Loop
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input type="checkbox" checked={!!config.videoControls} disabled={isLocked}
                  onChange={(e) => updateConfig("videoControls", e.target.checked ? "true" : undefined)}
                  className="rounded border-zinc-600 bg-zinc-800 text-pink-500 focus:ring-pink-500/50" />
                Show controls
              </label>
            </div>
          </>
        )}

        {type === "clock" && (
          <div className="rounded-md bg-zinc-800/50 border border-zinc-700 p-2.5 text-xs text-zinc-500">
            Displays current time and date automatically. No configuration needed.
          </div>
        )}

        {type === "weather" && (
          <>
            <div className="flex items-center gap-2 rounded-md bg-teal-900/10 border border-teal-500/15 px-2.5 py-2 mb-1">
              <span className="text-base">🌤️</span>
              <span className="text-[11px] text-teal-400 font-medium">OpenWeather Integration</span>
            </div>
            <Field label="City">
              <input value={(config.weatherCity as string) ?? ""} disabled={isLocked}
                onChange={(e) => updateConfig("weatherCity", e.target.value || undefined)}
                placeholder="London" className={inputCls} />
            </Field>
            <Field label="Units">
              <select value={(config.weatherUnits as string) ?? "metric"} disabled={isLocked}
                onChange={(e) => updateConfig("weatherUnits", e.target.value)} className={selectCls}>
                <option value="metric">Celsius (°C)</option>
                <option value="imperial">Fahrenheit (°F)</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer py-1">
              <input type="checkbox"
                checked={config.weatherShowForecast !== "false" && config.weatherShowForecast !== false}
                disabled={isLocked}
                onChange={(e) => updateConfig("weatherShowForecast", e.target.checked ? undefined : "false")}
                className="rounded border-zinc-600 bg-zinc-800 text-teal-500 focus:ring-teal-500/50" />
              Show 3-hour forecast
            </label>
            <p className="text-[10px] text-zinc-600">
              Weather data refreshes every 10 minutes. Requires an OpenWeather API key in backend settings.
            </p>
          </>
        )}

        {type === "carousel" && (
          <CarouselEditor config={config} updateConfig={updateConfig} disabled={isLocked} />
        )}
      </Section>

      {/* Position & Size */}
      <Section label="Position & Size">
        <div className="grid grid-cols-2 gap-2">
          <NumField label="X" value={tile.grid_x} min={0} max={spec.cols - tile.grid_w} onChange={(v) => onUpdate("grid_x", v)} disabled={isLocked} />
          <NumField label="Y" value={tile.grid_y} min={0} max={spec.rows - tile.grid_h} onChange={(v) => onUpdate("grid_y", v)} disabled={isLocked} />
          <NumField label="Width" value={tile.grid_w} min={1} max={spec.cols - tile.grid_x} onChange={(v) => onUpdate("grid_w", v)} disabled={isLocked} />
          <NumField label="Height" value={tile.grid_h} min={1} max={spec.rows - tile.grid_y} onChange={(v) => onUpdate("grid_h", v)} disabled={isLocked} />
        </div>
        <NumField label="Z-Index (layer order)" value={tile.z_index} min={0} max={99} onChange={(v) => onUpdate("z_index", v)} disabled={isLocked} />
      </Section>

      {/* Styling */}
      <Section label="Styling">
        <Field label="Font Family">
          <select value={(config.fontFamily as string) ?? ""} disabled={isLocked}
            onChange={(e) => updateConfig("fontFamily", e.target.value)} className={selectCls}>
            <option value="">Default (DM Sans)</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="system-ui">System UI</option>
            <option value="'Courier New', monospace">Courier New</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="'Arial', sans-serif">Arial</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Title Size (px)" value={(config.titleSize as number) ?? 0} min={0} max={72}
            onChange={(v) => updateConfig("titleSize", v || undefined)} disabled={isLocked} />
          <NumField label="Body Size (px)" value={(config.bodySize as number) ?? 0} min={0} max={48}
            onChange={(v) => updateConfig("bodySize", v || undefined)} disabled={isLocked} />
        </div>
        <ColorField label="Background Color" value={(config.bgColor as string) ?? ""} disabled={isLocked}
          onChange={(v) => updateConfig("bgColor", v || undefined)} />
        <ColorField label="Text Color" value={(config.textColor as string) ?? ""} disabled={isLocked}
          onChange={(v) => updateConfig("textColor", v || undefined)} />
      </Section>

      {/* Behavior */}
      <Section label="Behavior">
        <NumField label="Priority Weight" value={tile.priority_weight} min={0} max={100} onChange={(v) => onUpdate("priority_weight", v)} disabled={isLocked} />
        <div className="flex items-center gap-3 py-1">
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
            <input type="checkbox" checked={tile.is_emergency_slot} disabled={isLocked}
              onChange={(e) => onUpdate("is_emergency_slot", e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-800 text-red-500 focus:ring-red-500/50" />
            Emergency slot
          </label>
        </div>
        {tile.is_emergency_slot && (
          <p className="text-[10px] text-red-400/70 bg-red-900/10 rounded-md px-2 py-1.5 border border-red-500/10">
            This tile will pulse and show a red indicator bar on the display.
          </p>
        )}
      </Section>

      {/* Advanced */}
      <Section label="Advanced Config" defaultOpen={false}>
        <p className="text-[10px] text-zinc-600 mb-1">Raw JSON configuration for power users.</p>
        <textarea value={tile.config_json ?? ""} disabled={isLocked}
          onChange={(e) => onUpdate("config_json", e.target.value || null)}
          placeholder="{}" rows={5}
          className={inputCls + " font-mono text-xs"} />
      </Section>
    </div>
  )
}


// ---------------------------------------------------------------------------
// Carousel Slide Editor (inline in inspector)
// ---------------------------------------------------------------------------

function CarouselEditor({ config, updateConfig, disabled }: {
  config: Record<string, unknown>
  updateConfig: (key: string, value: string | number | undefined) => void
  disabled: boolean
}) {
  const slides = parseSlides(config.carouselSlides as string)
  const [newUrl, setNewUrl] = useState("")
  const [newType, setNewType] = useState<CarouselSlide["type"]>("image")
  const [newCaption, setNewCaption] = useState("")

  function setSlides(next: CarouselSlide[]) {
    updateConfig("carouselSlides", next.length > 0 ? stringifySlides(next) : undefined)
  }

  function detectType(url: string): CarouselSlide["type"] {
    if (/youtu\.?be/i.test(url)) return "youtube"
    if (/\.pdf(\?|$)/i.test(url)) return "pdf"
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return "video"
    return "image"
  }

  function addSlide() {
    const url = newUrl.trim()
    if (!url) return
    const type = detectType(url)
    setSlides([...slides, { type, url, caption: newCaption.trim() || undefined }])
    setNewUrl("")
    setNewCaption("")
    setNewType("image")
  }

  function removeSlide(i: number) {
    setSlides(slides.filter((_, idx) => idx !== i))
  }

  function moveSlide(from: number, dir: -1 | 1) {
    const to = from + dir
    if (to < 0 || to >= slides.length) return
    const next = [...slides]
    ;[next[from], next[to]] = [next[to], next[from]]
    setSlides(next)
  }

  function updateSlideCaption(i: number, caption: string) {
    const next = [...slides]
    next[i] = { ...next[i], caption: caption || undefined }
    setSlides(next)
  }

  const typeIcons: Record<string, string> = { image: "🖼️", pdf: "📄", youtube: "▶️", video: "🎬" }

  return (
    <>
      <div className="flex items-center gap-2 rounded-md bg-orange-900/10 border border-orange-500/15 px-2.5 py-2 mb-1">
        <span className="text-base">🎠</span>
        <span className="text-[11px] text-orange-400 font-medium">Carousel Slides</span>
        <span className="ml-auto text-[10px] text-zinc-600 tabular-nums">{slides.length} slide{slides.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Existing slides */}
      {slides.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {slides.map((slide, i) => (
            <div key={i} className="flex items-start gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/50 p-2">
              <span className="text-xs mt-0.5 shrink-0">{typeIcons[slide.type] ?? "?"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-zinc-300 truncate" title={slide.url}>{slide.url}</p>
                <input
                  value={slide.caption ?? ""}
                  onChange={(e) => updateSlideCaption(i, e.target.value)}
                  placeholder="Caption (optional)"
                  disabled={disabled}
                  className="mt-1 w-full rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 outline-none border border-zinc-700/50 focus:border-orange-500/30"
                />
                <span className="text-[8px] text-zinc-600 uppercase">{slide.type}</span>
              </div>
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={() => moveSlide(i, -1)} disabled={i === 0 || disabled}
                  className="rounded px-1 text-[9px] text-zinc-500 hover:bg-zinc-700 disabled:opacity-20">▲</button>
                <button onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1 || disabled}
                  className="rounded px-1 text-[9px] text-zinc-500 hover:bg-zinc-700 disabled:opacity-20">▼</button>
                <button onClick={() => removeSlide(i)} disabled={disabled}
                  className="rounded px-1 text-[9px] text-red-400 hover:bg-red-900/20 disabled:opacity-30">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add slide */}
      <div className="rounded-md border border-dashed border-zinc-700 p-2 space-y-1.5">
        <p className="text-[10px] text-zinc-500 font-medium">Add Slide</p>
        <input
          value={newUrl}
          onChange={(e) => { setNewUrl(e.target.value); setNewType(detectType(e.target.value)) }}
          placeholder="Image URL, YouTube link, PDF URL, or video URL"
          disabled={disabled}
          className="w-full rounded-md bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 outline-none border border-zinc-700 focus:border-orange-500/30"
        />
        {newUrl && (
          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
            <span>{typeIcons[newType]}</span>
            <span>Detected: <strong className="text-zinc-400">{newType}</strong></span>
          </div>
        )}
        <input
          value={newCaption}
          onChange={(e) => setNewCaption(e.target.value)}
          placeholder="Caption (optional)"
          disabled={disabled}
          className="w-full rounded-md bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 outline-none border border-zinc-700 focus:border-orange-500/30"
        />
        <button onClick={addSlide} disabled={!newUrl.trim() || disabled}
          className="rounded-md bg-orange-600/80 px-3 py-1 text-[11px] font-medium text-white hover:bg-orange-500 disabled:opacity-30">
          + Add Slide
        </button>
      </div>

      {/* Carousel settings */}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mt-2">Carousel Options</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-zinc-500">Interval (sec)</span>
          <input type="number" value={(config.carouselInterval as number) ?? 5} min={1} max={120} disabled={disabled}
            onChange={(e) => updateConfig("carouselInterval", parseInt(e.target.value) || undefined)}
            className="w-full rounded-md bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 outline-none border border-zinc-700 tabular-nums" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-zinc-500">Transition</span>
          <select value={(config.carouselTransition as string) ?? "fade"} disabled={disabled}
            onChange={(e) => updateConfig("carouselTransition", e.target.value)}
            className="w-full rounded-md bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 outline-none border border-zinc-700">
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
            <option value="none">None</option>
          </select>
        </label>
      </div>
      <div className="space-y-1.5 py-1">
        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
          <input type="checkbox"
            checked={config.carouselAutoplay !== "false" && config.carouselAutoplay !== false}
            disabled={disabled}
            onChange={(e) => updateConfig("carouselAutoplay", e.target.checked ? undefined : "false")}
            className="rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500/50" />
          Autoplay
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
          <input type="checkbox"
            checked={config.carouselShowDots !== "false" && config.carouselShowDots !== false}
            disabled={disabled}
            onChange={(e) => updateConfig("carouselShowDots", e.target.checked ? undefined : "false")}
            className="rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500/50" />
          Show dots
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
          <input type="checkbox"
            checked={config.carouselShowArrows === "true" || config.carouselShowArrows === true}
            disabled={disabled}
            onChange={(e) => updateConfig("carouselShowArrows", e.target.checked ? "true" : undefined)}
            className="rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500/50" />
          Show arrows
        </label>
      </div>
    </>
  )
}
